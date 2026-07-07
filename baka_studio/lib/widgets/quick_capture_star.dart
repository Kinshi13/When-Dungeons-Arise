import 'package:flutter/material.dart';

import '../core/theme/theme.dart';

/// The global quick-capture entry point — a discreet star-shaped FAB.
/// Visual identity is intentionally distinct from the bottom nav icons so
/// it always reads as "add something now" wherever it appears.
class QuickCaptureStar extends StatelessWidget {
  const QuickCaptureStar({super.key, required this.onPressed, this.mini = false});

  final VoidCallback onPressed;
  final bool mini;

  @override
  Widget build(BuildContext context) {
    final size = mini ? 48.0 : 56.0;
    return Tooltip(
      message: 'Captura rápida',
      child: Material(
        color: BakaColors.stellarBlue,
        shape: const CircleBorder(),
        elevation: 0,
        child: InkWell(
          onTap: onPressed,
          customBorder: const CircleBorder(),
          child: Container(
            width: size,
            height: size,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: BakaShadows.focusGlow(BakaColors.stellarBlue, opacity: 0.4),
            ),
            child: Icon(Icons.auto_awesome, color: BakaColors.midnightVoid, size: mini ? 22 : 26),
          ),
        ),
      ),
    );
  }
}
