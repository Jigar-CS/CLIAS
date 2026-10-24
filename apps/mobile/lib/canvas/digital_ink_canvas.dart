import 'dart:ui';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import '../models/stroke.dart';
import 'canvas_controller.dart';

class DigitalInkCanvas extends StatefulWidget {
  final CanvasController controller;

  const DigitalInkCanvas({
    super.key,
    required this.controller,
  });

  @override
  State<DigitalInkCanvas> createState() => _DigitalInkCanvasState();
}

class _DigitalInkCanvasState extends State<DigitalInkCanvas> {
  // Intelligent Palm Rejection state
  bool _isStylusActive = false;
  int? _activePointerId;

  void _onPointerDown(PointerDownEvent event) {
    // 1. Palm Rejection logic:
    // If a stylus is used, prioritize stylus and reject touch events.
    final isStylus = event.kind == PointerDeviceKind.stylus ||
        event.kind == PointerDeviceKind.invertedStylus;

    if (isStylus) {
      _isStylusActive = true;
    } else if (_isStylusActive && event.kind == PointerDeviceKind.touch) {
      // Discard touch as palm rest
      return;
    }

    // Reject large contact areas (accidental palm rests)
    if (event.size > 0.45 || (event.radiusMajor > 30.0)) {
      return;
    }

    if (_activePointerId != null) {
      // Ignore secondary multi-touch fingers
      return;
    }

    _activePointerId = event.pointer;
    widget.controller.startStroke(event.localPosition, event.pressure);
  }

  void _onPointerMove(PointerMoveEvent event) {
    if (event.pointer != _activePointerId) return;

    widget.controller.appendPoint(event.localPosition, event.pressure);
  }

  void _onPointerUp(PointerUpEvent event) {
    if (event.pointer == _activePointerId) {
      widget.controller.endStroke();
      _activePointerId = null;

      // Reset stylus bias after a period of inactivity
      if (event.kind == PointerDeviceKind.stylus) {
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted && _activePointerId == null) {
            _isStylusActive = false;
          }
        });
      }
    }
  }

  void _onPointerCancel(PointerCancelEvent event) {
    if (event.pointer == _activePointerId) {
      widget.controller.endStroke();
      _activePointerId = null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      behavior: HitTestBehavior.opaque,
      onPointerDown: _onPointerDown,
      onPointerMove: _onPointerMove,
      onPointerUp: _onPointerUp,
      onPointerCancel: _onPointerCancel,
      child: AnimatedBuilder(
        animation: widget.controller,
        builder: (context, _) {
          return CustomPaint(
            painter: InkPainter(
              strokes: widget.controller.strokes,
              activeStroke: widget.controller.activeStroke,
            ),
            size: Size.infinite,
          );
        },
      ),
    );
  }
}

class InkPainter extends CustomPainter {
  final List<Stroke> strokes;
  final Stroke? activeStroke;

  InkPainter({
    required this.strokes,
    this.activeStroke,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // White answer sheet background
    final bgPaint = Paint()..color = Colors.white;
    canvas.drawRect(Offset.zero & size, bgPaint);

    // Subtle exam paper ruling lines (Optional aesthetic guideline for handwritten tests)
    final gridPaint = Paint()
      ..color = const Color(0xFFF1F5F9)
      ..strokeWidth = 1.0;
    for (double y = 60.0; y < size.height; y += 32.0) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // Draw completed strokes
    for (final stroke in strokes) {
      _drawStroke(canvas, stroke);
    }

    // Draw active stroke with live points
    if (activeStroke != null) {
      _drawStroke(canvas, activeStroke!);
    }
  }

  void _drawStroke(Canvas canvas, Stroke stroke) {
    if (stroke.points.isEmpty) return;

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    if (stroke.toolType == ToolType.highlighter) {
      paint
        ..color = stroke.color
        ..strokeWidth = stroke.strokeWidth
        ..blendMode = BlendMode.multiply;
    } else {
      paint
        ..color = stroke.color
        ..strokeWidth = stroke.strokeWidth;
    }

    if (stroke.points.length == 1) {
      canvas.drawCircle(
        stroke.points.first.toOffset(),
        stroke.strokeWidth / 2,
        paint..style = PaintingStyle.fill,
      );
      return;
    }

    // Smooth Bezier Curve interpolation
    final path = Path();
    path.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (int i = 1; i < stroke.points.length; i++) {
      final p0 = stroke.points[i - 1];
      final p1 = stroke.points[i];
      final midX = (p0.x + p1.x) / 2;
      final midY = (p0.y + p1.y) / 2;
      path.quadraticBezierTo(p0.x, p0.y, midX, midY);
    }

    final last = stroke.points.last;
    path.lineTo(last.x, last.y);

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant InkPainter oldDelegate) {
    return true; // Fast redraw during active drawing
  }
}
