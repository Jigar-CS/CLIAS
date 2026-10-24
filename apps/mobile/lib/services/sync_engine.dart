import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'kiosk_service.dart';
import '../models/stroke.dart';
import '../models/sync_packet.dart';

enum SyncStatus {
  disconnected,
  connecting,
  connected,
  syncing,
  synced,
  offlineBufferActive,
  error,
}

class SyncEngine {
  final String sessionId;
  final String questionId;
  final String wsUrl;

  WebSocketChannel? _channel;
  StreamSubscription? _channelSubscription;
  Timer? _syncTimer;
  Timer? _debouncedSyncTimer;
  Timer? _heartbeatTimer;

  bool _isConnected = false;
  bool get isConnected => _isConnected;

  int _sequenceNumber = 0;
  final List<Stroke> _pendingDelta = [];
  final List<String> _deletedDelta = [];
  final ValueNotifier<SyncStatus> statusNotifier = ValueNotifier(SyncStatus.disconnected);
  final ValueNotifier<DateTime?> lastSyncedNotifier = ValueNotifier(null);

  bool _isDisposed = false;

  SyncEngine({
    required this.sessionId,
    required this.questionId,
    required this.wsUrl,
  });

  /// Starts the WebSocket connection and the sync loop.
  Future<void> start() async {
    await _restorePendingFromCache();
    _connectWebSocket();
    _startSyncLoop();
    _startHeartbeat();
  }

  void _connectWebSocket() {
    if (_isDisposed) return;
    statusNotifier.value = SyncStatus.connecting;

    try {
      final uri = Uri.parse('$wsUrl?sessionId=$sessionId&questionId=$questionId');
      _channel = WebSocketChannel.connect(uri);

      _channelSubscription = _channel!.stream.listen(
        (data) => _handleIncomingMessage(data),
        onDone: () => _handleDisconnect('WebSocket closed'),
        onError: (err) => _handleDisconnect(err),
      );

      _isConnected = true;
      statusNotifier.value = SyncStatus.connected;
      debugPrint('[SyncEngine] Connected to laptop WebSocket: $uri');

      // Flush any pending deltas immediately upon connecting
      if (_pendingDelta.isNotEmpty || _deletedDelta.isNotEmpty) {
        performSync();
      }
    } catch (e) {
      debugPrint('[SyncEngine] Connection error: $e');
      _handleDisconnect(e);
    }
  }

  void _handleIncomingMessage(dynamic rawMessage) {
    try {
      final msg = jsonDecode(rawMessage.toString()) as Map<String, dynamic>;
      final type = msg['type'];

      if (type == 'CANVAS_DELTA_ACK') {
        final ackSeq = msg['seq'] as int?;
        if (ackSeq != null && ackSeq <= _sequenceNumber) {
          _onDeltaAcknowledged();
        }
      } else if (type == 'HEARTBEAT_ACK') {
        _isConnected = true;
      }
    } catch (e) {
      debugPrint('[SyncEngine] Error parsing incoming message: $e');
    }
  }

  void _handleDisconnect([dynamic error]) {
    debugPrint('[SyncEngine] Disconnected: $error');
    _isConnected = false;
    statusNotifier.value = _pendingDelta.isNotEmpty
        ? SyncStatus.offlineBufferActive
        : SyncStatus.disconnected;

    _channelSubscription?.cancel();
    _channelSubscription = null;
    _channel = null;

    if (!_isDisposed) {
      // Auto-reconnect after 3 seconds
      Future.delayed(const Duration(seconds: 3), () {
        if (!_isDisposed && !_isConnected) {
          debugPrint('[SyncEngine] Attempting reconnect...');
          _connectWebSocket();
        }
      });
    }
  }

  /// Appends a new or modified stroke to the pending sync delta buffer.
  void recordStroke(Stroke stroke) {
    _pendingDelta.add(stroke);
    // Instant debounced sync 1.2s after user finishes stroke
    _debouncedSyncTimer?.cancel();
    _debouncedSyncTimer = Timer(const Duration(milliseconds: 1200), () {
      performSync();
    });
  }

  /// Records a deleted stroke ID for incremental eraser delta sync.
  void recordStrokeDeletion(String strokeId) {
    _deletedDelta.add(strokeId);
    _debouncedSyncTimer?.cancel();
    _debouncedSyncTimer = Timer(const Duration(milliseconds: 1200), () {
      performSync();
    });
  }

  /// Periodic sync loop (safety sync every 5 seconds)
  void _startSyncLoop() {
    _syncTimer = Timer.periodic(const Duration(seconds: 5), (_) async {
      await performSync();
    });
  }

  void _startHeartbeat() {
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (_isConnected && _channel != null) {
        try {
          _channel!.sink.add(jsonEncode({
            'type': 'HEARTBEAT',
            'sessionId': sessionId,
            'timestamp': DateTime.now().millisecondsSinceEpoch,
          }));
        } catch (e) {
          _handleDisconnect(e);
        }
      }
    });
  }

  /// Performs a delta sync operation.
  Future<void> performSync() async {
    if (_pendingDelta.isEmpty && _deletedDelta.isEmpty) return;

    final strokesToSend = List<Stroke>.from(_pendingDelta);
    final deletedToSend = List<String>.from(_deletedDelta);

    _sequenceNumber++;
    final packet = SyncPacket(
      sessionId: sessionId,
      questionId: questionId,
      sequenceNumber: _sequenceNumber,
      timestamp: DateTime.now().millisecondsSinceEpoch,
      strokesDelta: strokesToSend,
      deletedStrokeIds: deletedToSend,
    );

    // Save to local offline cache first (Write-Ahead Log)
    await _savePendingToCache(packet);

    if (_isConnected && _channel != null) {
      statusNotifier.value = SyncStatus.syncing;
      try {
        _channel!.sink.add(packet.serialize());
        debugPrint('[SyncEngine] Sent sync packet Seq #$_sequenceNumber with ${strokesToSend.length} strokes');
      } catch (e) {
        _isConnected = false;
        statusNotifier.value = SyncStatus.offlineBufferActive;
        debugPrint('[SyncEngine] Send failed, buffered locally: $e');
        _handleDisconnect(e);
      }
    } else {
      statusNotifier.value = SyncStatus.offlineBufferActive;
      debugPrint('[SyncEngine] Offline: Buffered ${strokesToSend.length} strokes locally.');
      if (!_isDisposed) {
        _connectWebSocket();
      }
    }
  }

  void _onDeltaAcknowledged() async {
    _pendingDelta.clear();
    _deletedDelta.clear();
    statusNotifier.value = SyncStatus.synced;
    lastSyncedNotifier.value = DateTime.now();

    // Clear disk cache for this sequence
    await KioskService().clearCache('cached_strokes_${sessionId}_$questionId');
  }

  /// Sends a clear command to the laptop server and clears all local caches for this question
  Future<void> clearRemoteCanvas() async {
    _pendingDelta.clear();
    _deletedDelta.clear();
    _debouncedSyncTimer?.cancel();

    await KioskService().clearCache('cached_strokes_${sessionId}_$questionId');
    await KioskService().clearCache('all_strokes_${sessionId}_$questionId');

    if (_isConnected && _channel != null) {
      try {
        _channel!.sink.add(jsonEncode({
          'type': 'CLEAR_CANVAS',
          'sessionId': sessionId,
          'questionId': questionId,
          'timestamp': DateTime.now().millisecondsSinceEpoch,
        }));
        debugPrint('[SyncEngine] Sent CLEAR_CANVAS to laptop companion server');
      } catch (e) {
        debugPrint('[SyncEngine] Error sending CLEAR_CANVAS: $e');
      }
    }
    statusNotifier.value = SyncStatus.synced;
  }

  Future<void> _savePendingToCache(SyncPacket packet) async {
    try {
      await KioskService().saveCache(
        'cached_strokes_${sessionId}_$questionId',
        packet.serialize(),
      );
    } catch (e) {
      debugPrint('[SyncEngine] Cache write error: $e');
    }
  }

  Future<void> _restorePendingFromCache() async {
    try {
      final cached = await KioskService().getCache('cached_strokes_${sessionId}_$questionId');
      if (cached != null) {
        final decoded = jsonDecode(cached) as Map<String, dynamic>;
        final strokesJson = decoded['strokes'] as List<dynamic>? ?? [];
        for (final item in strokesJson) {
          _pendingDelta.add(Stroke.fromJson(item as Map<String, dynamic>));
        }
        debugPrint('[SyncEngine] Restored ${_pendingDelta.length} offline buffered strokes from cache.');
      }
    } catch (e) {
      debugPrint('[SyncEngine] Cache read error: $e');
    }
  }

  void dispose() {
    _isDisposed = true;
    _isConnected = false;
    _debouncedSyncTimer?.cancel();
    _syncTimer?.cancel();
    _heartbeatTimer?.cancel();
    _channelSubscription?.cancel();
    _channel?.sink.close();
  }
}
