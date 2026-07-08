import 'package:flutter/material.dart';

import '../core/theme/theme.dart';
import 'baka_studio_mark.dart';

/// The global quick-capture entry point. Deliberately built from the same
/// constellation mark used in the sidebar and splash rather than a stock
/// Material icon, with a soft radial fill and thin outer ring — so it reads
/// as "a star you tap," not a generic FAB with an icon glued on.
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
        color: Colors.transparent,
        shape: const CircleBorder(),
        child: InkWell(
          onTap: onPressed,
          customBorder: const CircleBorder(),
          child: Container(
            width: size,
            height: size,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  Color.lerp(BakaColors.stellarBlue, BakaColors.starWhite, 0.18)!,
                  BakaColors.stellarBlue,
                ],
                radius: 0.85,
              ),
              border: Border.all(color: BakaColors.starWhite.withValues(alpha: 0.35), width: 1),
              boxShadow: BakaShadows.focusGlow(BakaColors.stellarBlue, opacity: 0.45),
            ),
            child: BakaStudioMark(size: mini ? 22 : 26, color: BakaColors.midnightVoid),
          ),
        ),
      ),
    );
  }
}
