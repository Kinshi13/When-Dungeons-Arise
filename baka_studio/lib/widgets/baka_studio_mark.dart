import 'package:flutter/material.dart';

import '../core/theme/baka_colors.dart';

/// Provisional Baka Studio symbol: seven points loosely tracing a "B",
/// connected like a constellation. Isolated here so the whole app updates
/// in one place once final brand art replaces it — used in the sidebar
/// header, the splash screen, and the quick-capture star.
///
/// Works at any size (tested down to 16px); below ~20px the glow is
/// dropped automatically since it just reads as noise at that scale.
class BakaStudioMark extends StatelessWidget {
  const BakaStudioMark({super.key, this.size = 32, this.color = BakaColors.stellarBlue});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: SizedBox(
        width: size,
        height: size,
        child: CustomPaint(painter: _BakaMarkPainter(color: color, glow: size >= 20)),
      ),
    );
  }
}

class _BakaMarkPainter extends CustomPainter {
  const _BakaMarkPainter({required this.color, required this.glow});

  final Color color;
  final bool glow;

  @override
  void paint(Canvas canvas, Size size) {
    final points = [
      Offset(size.width * 0.28, size.height * 0.12),
      Offset(size.width * 0.28, size.height * 0.50),
      Offset(size.width * 0.28, size.height * 0.88),
      Offset(size.width * 0.68, size.height * 0.24),
      Offset(size.width * 0.68, size.height * 0.50),
      Offset(size.width * 0.68, size.height * 0.76),
      Offset(size.width * 0.44, size.height * 0.50),
    ];
    const edges = [
      [0, 1], [1, 2], [0, 3], [3, 6], [6, 1], [1, 4], [4, 6], [6, 5], [5, 2],
    ];

    final linePaint = Paint()
      ..color = color.withValues(alpha: 0.5)
      ..strokeWidth = size.width * 0.02
      ..style = PaintingStyle.stroke;

    for (final edge in edges) {
      canvas.drawLine(points[edge[0]], points[edge[1]], linePaint);
    }

    final dotRadius = size.width * 0.06;
    final dotPaint = Paint()..color = color;

    if (glow) {
      final glowPaint = Paint()
        ..color = color.withValues(alpha: 0.4)
        ..maskFilter = MaskFilter.blur(BlurStyle.normal, size.width * 0.08);
      for (final point in points) {
        canvas.drawCircle(point, dotRadius * 1.8, glowPaint);
      }
    }

    for (final point in points) {
      canvas.drawCircle(point, dotRadius, dotPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _BakaMarkPainter oldDelegate) {
    return oldDelegate.color != color || oldDelegate.glow != glow;
  }
}
