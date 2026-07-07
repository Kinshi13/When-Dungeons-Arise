import 'dart:math';
import 'package:flutter/material.dart';

import '../core/theme/baka_colors.dart';

/// A very low-cost, low-density star field used as a backdrop.
///
/// Stars are generated once (seeded, deterministic) and painted with
/// [shouldRepaint] returning false, so this never re-executes per frame —
/// this is a static backdrop, not an animation. Wrap call sites in a
/// [RepaintBoundary] (already done here) so the star field never gets pulled
/// into a parent's repaint pass.
class StellarBackground extends StatelessWidget {
  const StellarBackground({super.key, this.density = 60, this.seed = 7});

  final int density;
  final int seed;

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: CustomPaint(
        painter: _StarFieldPainter(density: density, seed: seed),
        size: Size.infinite,
      ),
    );
  }
}

class _StarFieldPainter extends CustomPainter {
  _StarFieldPainter({required this.density, required this.seed});

  final int density;
  final int seed;

  @override
  void paint(Canvas canvas, Size size) {
    final random = Random(seed);
    final paint = Paint()..style = PaintingStyle.fill;

    for (var i = 0; i < density; i++) {
      final dx = random.nextDouble() * size.width;
      final dy = random.nextDouble() * size.height;
      final radius = 0.4 + random.nextDouble() * 1.1;
      final opacity = 0.12 + random.nextDouble() * 0.28;
      paint.color = BakaColors.starDust.withValues(alpha: opacity);
      canvas.drawCircle(Offset(dx, dy), radius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _StarFieldPainter oldDelegate) => false;
}
