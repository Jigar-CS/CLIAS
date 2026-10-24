import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../canvas/canvas_controller.dart';
import '../canvas/digital_ink_canvas.dart';
import '../models/stroke.dart';
import '../services/kiosk_service.dart';
import '../services/sync_engine.dart';
import '../widgets/drawing_toolbar.dart';
import '../widgets/exit_pin_dialog.dart';

class ExamSheetScreen extends StatefulWidget {
  final String sessionId;
  final String questionId;
  final String questionTitle;
  final String wsUrl;
  final String proctorPinHash;

  const ExamSheetScreen({
    super.key,
    required this.sessionId,
    required this.questionId,
    required this.questionTitle,
    required this.wsUrl,
    required this.proctorPinHash,
  });

  @override
  State<ExamSheetScreen> createState() => _ExamSheetScreenState();
}

class _ExamSheetScreenState extends State<ExamSheetScreen>
    with WidgetsBindingObserver {
  late final SyncEngine _syncEngine;
  late final CanvasController _canvasController;

  // Proctor hidden exit gesture detection (5 taps in corner within 3s)
  int _proctorTapCount = 0;
  DateTime? _firstTapTime;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Lock to horizontal landscape mode for comfortable digital writing
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);

    _syncEngine = SyncEngine(
      sessionId: widget.sessionId,
      questionId: widget.questionId,
      wsUrl: widget.wsUrl,
    );
    _syncEngine.start();

    _canvasController = CanvasController(syncEngine: _syncEngine);

    // Restore any previously drawn strokes for this question
    _loadExistingStrokes();

    // Enforce instant device lockdown upon entry
    _initiateLockdown();
  }

  Future<void> _loadExistingStrokes() async {
    // 1. Check local persistent cache
    try {
      final cached = await KioskService().getCache('all_strokes_${widget.sessionId}_${widget.questionId}');
      if (cached != null) {
        final data = jsonDecode(cached) as List<dynamic>;
        final strokes = data.map((e) => Stroke.fromJson(e as Map<String, dynamic>)).toList();
        if (strokes.isNotEmpty && mounted) {
          _canvasController.loadStrokes(strokes);
          return;
        }
      }
    } catch (_) {}

    // 2. Fetch from laptop companion server HTTP endpoint
    try {
      final host = widget.wsUrl.replaceAll('ws://', '').replaceAll('/companion', '');
      final httpUrl = Uri.parse('http://$host/api/strokes?questionId=${widget.questionId}');
      final client = HttpClient();
      final request = await client.getUrl(httpUrl).timeout(const Duration(seconds: 2));
      final response = await request.close();
      if (response.statusCode == 200) {
        final body = await response.transform(utf8.decoder).join();
        final json = jsonDecode(body) as Map<String, dynamic>;
        final strokesList = json['strokes'] as List<dynamic>? ?? [];
        final strokes = strokesList.map((e) => Stroke.fromJson(e as Map<String, dynamic>)).toList();
        if (strokes.isNotEmpty && mounted) {
          _canvasController.loadStrokes(strokes);
        }
      }
    } catch (e) {
      debugPrint('[ExamSheet] Note: Could not fetch initial strokes from laptop: $e');
    }
  }

  Future<void> _initiateLockdown() async {
    await KioskService().enterLockdown();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      // Security violation: The student attempted to switch apps or minimize
      debugPrint('[SecurityAlert] App switching / backgrounding attempt detected!');
      // Instantly reclaim lock task
      KioskService().enterLockdown();
    }
  }

  void _handleCornerSecretTap() {
    final now = DateTime.now();
    if (_firstTapTime == null || now.difference(_firstTapTime!).inSeconds > 3) {
      _firstTapTime = now;
      _proctorTapCount = 1;
    } else {
      _proctorTapCount++;
      if (_proctorTapCount >= 5) {
        _proctorTapCount = 0;
        _firstTapTime = null;
        _showExitPinDialog();
      }
    }
  }

  void _showExitPinDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => ExitPinDialog(
        expectedPinHash: widget.proctorPinHash,
        onExitConfirmed: () {
          Navigator.of(context).pop(); // Back to pairing/main
        },
      ),
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    // Restore all orientations upon exiting exam screen
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    _syncEngine.dispose();
    _canvasController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false, // Prevent Android Back key from exiting
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Stack(
            children: [
              // 1. Digital Ink Canvas (Full surface with downward vertical scroll)
              Positioned.fill(
                child: DigitalInkCanvas(controller: _canvasController),
              ),

              // 2. Question Header & Drawing Toolbar (Single sleek horizontal row in landscape)
              Positioned(
                top: 6,
                left: 10,
                right: 70, // Leave room for secret proctor exit hitbox on far top-right
                child: Row(
                  children: [
                    // Compact Question Chip
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.description, color: Colors.white, size: 14),
                          const SizedBox(width: 6),
                          Text(
                            widget.questionTitle,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Drawing Toolbar (Scrollable horizontal row)
                    Expanded(
                      child: DrawingToolbar(
                        controller: _canvasController,
                        syncEngine: _syncEngine,
                      ),
                    ),
                  ],
                ),
              ),

              // 3. Hidden Proctor Exit Tap Target (Top-right corner invisible hit-box)
              Positioned(
                top: 0,
                right: 0,
                width: 65,
                height: 50,
                child: GestureDetector(
                  behavior: HitTestBehavior.translucent,
                  onTap: _handleCornerSecretTap,
                  child: Container(color: Colors.transparent),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
