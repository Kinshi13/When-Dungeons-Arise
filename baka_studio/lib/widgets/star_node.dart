import 'dart:math';
import 'package:flutter/material.dart';

import '../core/theme/theme.dart';

/// Generic visual state for a star node, shared across constellations,
/// channel maps, and task completion indicators.
enum StarNodeState { done, inProgress, planned, blocked, future }

/// A single star — the atomic visual unit of the constellation metaphor.
/// Used for project items, channel markers, and completed-task indicators.
class StarNode extends StatefulWidget {
  const StarNode({
    super.key,
    required this.color,
    this.state = StarNodeState.done,
    this.size = 14,
    this.label,
    this.onTap,
  });

  final Color color;
  final StarNodeState state;
  final double size;
  final String? label;
  final VoidCallback? onTap;

  @override
  State<StarNode> createState() => _StarNodeState();
}

class _StarNodeState extends State<StarNode> with SingleTickerProviderStateMixin {
  AnimationController? _pulseController;

  @override
  void initState() {
    super.initState();
    if (widget.state == StarNodeState.inProgress) {
      _pulseController = AnimationController(vsync: this, duration: BakaMotion.pulse)
        ..repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(covariant StarNode oldWidget) {
    super.didUpdateWidget(oldWidget);
    final shouldPulse = widget.state == StarNodeState.inProgress;
    if (shouldPulse && _pulseController == null) {
      _pulseController = AnimationController(vsync: this, duration: BakaMotion.pulse)
        ..repeat(reverse: true);
    } else if (!shouldPulse && _pulseController != null) {
      _pulseController!.dispose();
      _pulseController = null;
    }
  }

  @override
  void dispose() {
    _pulseController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    Widget star = RepaintBoundary(
      child: CustomPaint(
        size: Size.square(widget.size),
        painter: _StarPainter(color: widget.color, state: widget.state),
      ),
    );

    if (_pulseController != null) {
      star = AnimatedBuilder(
        animation: _pulseController!,
        builder: (context, child) {
          final t = _pulseController!.value;
          final opacity = 0.65 + (t * 0.35);
          return Opacity(opacity: opacity, child: child);
        },
        child: star,
      );
    }

    final content = widget.label == null
        ? star
        : Tooltip(message: widget.label!, child: star);

    if (widget.onTap == null) return content;
    return GestureDetector(onTap: widget.onTap, child: content);
  }
}

class _StarPainter extends CustomPainter {
  _StarPainter({required this.color, required this.state});

  final Color color;
  final StarNodeState state;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    switch (state) {
      case StarNodeState.future:
        final dashPaint = Paint()
          ..color = color.withValues(alpha: 0.45)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.2;
        _drawDashedCircle(canvas, center, radius * 0.75, dashPaint);
        return;
      case StarNodeState.blocked:
        final ringPaint = Paint()
          ..color = BakaColors.danger.withValues(alpha: 0.8)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.4;
        canvas.drawCircle(center, radius * 0.85, ringPaint);
        final dotPaint = Paint()..color = color.withValues(alpha: 0.5);
        canvas.drawCircle(center, radius * 0.32, dotPaint);
        return;
      case StarNodeState.planned:
        final paint = Paint()..color = color.withValues(alpha: 0.55);
        canvas.drawCircle(center, radius * 0.55, paint);
        return;
      case StarNodeState.done:
      case StarNodeState.inProgress:
        final glowPaint = Paint()
          ..color = color.withValues(alpha: 0.35)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
        canvas.drawCircle(center, radius * 0.7, glowPaint);
        final starPaint = Paint()..color = color;
        _drawFourPointStar(canvas, center, radius, starPaint);
        return;
    }
  }

  void _drawFourPointStar(Canvas canvas, Offset center, double radius, Paint paint) {
    final path = Path();
    final outer = radius;
    final inner = radius * 0.38;
    for (var i = 0; i < 8; i++) {
      final angle = (pi / 4) * i - pi / 2;
      final r = i.isEven ? outer : inner;
      final point = Offset(center.dx + r * cos(angle), center.dy + r * sin(angle));
      if (i == 0) {
        path.moveTo(point.dx, point.dy);
      } else {
        path.lineTo(point.dx, point.dy);
      }
    }
    path.close();
    canvas.drawPath(path, paint);
  }

  void _drawDashedCircle(Canvas canvas, Offset center, double radius, Paint paint) {
    const dashCount = 10;
    const dashFraction = 0.6;
    for (var i = 0; i < dashCount; i++) {
      final startAngle = (2 * pi / dashCount) * i;
      final sweep = (2 * pi / dashCount) * dashFraction;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweep,
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _StarPainter oldDelegate) {
    return oldDelegate.color != color || oldDelegate.state != state;
  }
}
