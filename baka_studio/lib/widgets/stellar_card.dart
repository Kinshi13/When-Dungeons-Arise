import 'package:flutter/material.dart';

import '../core/theme/theme.dart';

/// Base surface used across the app for cards, panels, and elevated
/// sections. Wraps the shared radius/border/padding tokens so screens don't
/// hand-roll decorations.
class StellarCard extends StatelessWidget {
  const StellarCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(BakaSpacing.lg),
    this.onTap,
    this.selected = false,
    this.accentColor,
    this.elevated = false,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final bool selected;

  /// When set, draws a thin colored top accent — used for channel context.
  final Color? accentColor;
  final bool elevated;

  @override
  Widget build(BuildContext context) {
    final borderColor = selected
        ? BakaColors.stellarBlue
        : BakaColors.borderSubtle;

    return Material(
      color: elevated ? BakaColors.nebulaSlate : BakaColors.deepOrbit,
      borderRadius: BorderRadius.circular(BakaRadii.lg),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(BakaRadii.lg),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(BakaRadii.lg),
            border: Border.all(color: borderColor, width: selected ? 1.5 : 1),
            boxShadow: elevated ? BakaShadows.card : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (accentColor != null)
                Container(
                  height: 3,
                  decoration: BoxDecoration(
                    color: accentColor,
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(BakaRadii.lg),
                    ),
                  ),
                ),
              Padding(padding: padding, child: child),
            ],
          ),
        ),
      ),
    );
  }
}
