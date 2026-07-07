import 'package:flutter/material.dart';

import '../core/theme/baka_colors.dart';

/// A single connection to draw between two points in a constellation map.
class ConstellationEdge {
  const ConstellationEdge({
    required this.start,
    required this.end,
    this.color = BakaColors.starDust,
    this.dashed = false,
  });

  final Offset start;
  final Offset end;
  final Color color;

  /// Dashed lines represent a future/planned dependency.
  final bool dashed;
}

/// Paints every edge of a constellation map in one pass. Meant to sit behind
/// the star nodes inside a [Stack], sized to fill the map area.
class ConstellationLine extends StatelessWidget {
  const ConstellationLine({super.key, required this.edges});

  final List<ConstellationEdge> edges;

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: CustomPaint(
        painter: _ConstellationLinePainter(edges: edges),
        size: Size.infinite,
      ),
    );
  }
}

class _ConstellationLinePainter extends CustomPainter {
  _ConstellationLinePainter({required this.edges});

  final List<ConstellationEdge> edges;

  @override
  void paint(Canvas canvas, Size size) {
    for (final edge in edges) {
      final paint = Paint()
        ..color = edge.color.withValues(alpha: 0.35)
        ..strokeWidth = 1
        ..style = PaintingStyle.stroke;

      if (!edge.dashed) {
        canvas.drawLine(edge.start, edge.end, paint);
        continue;
      }

      const dashLength = 5.0;
      const gapLength = 4.0;
      final total = (edge.end - edge.start).distance;
      if (total == 0) continue;
      final direction = (edge.end - edge.start) / total;
      var covered = 0.0;
      var draw = true;
      while (covered < total) {
        final segment = draw ? dashLength : gapLength;
        final next = (covered + segment).clamp(0, total).toDouble();
        if (draw) {
          canvas.drawLine(
            edge.start + direction * covered,
            edge.start + direction * next,
            paint,
          );
        }
        covered = next;
        draw = !draw;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _ConstellationLinePainter oldDelegate) {
    return oldDelegate.edges != edges;
  }
}
