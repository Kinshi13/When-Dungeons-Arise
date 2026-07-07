import 'package:flutter/material.dart';

import 'baka_colors.dart';

/// Elevation shadows. Kept subtle on purpose — this is a dark UI, so we lean
/// on soft black shadows for depth and reserve colored glow for a handful of
/// "active/selected" accents (never full-surface glow).
abstract final class BakaShadows {
  static const List<BoxShadow> card = [
    BoxShadow(color: Color(0x40000000), blurRadius: 12, offset: Offset(0, 4)),
  ];

  static const List<BoxShadow> elevated = [
    BoxShadow(color: Color(0x59000000), blurRadius: 24, offset: Offset(0, 8)),
  ];

  static const List<BoxShadow> modal = [
    BoxShadow(color: Color(0x73000000), blurRadius: 40, offset: Offset(0, 16)),
  ];

  /// A restrained halo for a selected star/nav item. Use sparingly.
  static List<BoxShadow> focusGlow(Color color, {double opacity = 0.35}) => [
    BoxShadow(
      color: color.withValues(alpha: opacity),
      blurRadius: 16,
      spreadRadius: 0.5,
    ),
  ];

  static List<BoxShadow> starGlow(Color color) => [
    BoxShadow(color: color.withValues(alpha: 0.55), blurRadius: 6, spreadRadius: 0.5),
  ];
}

/// Convenience border using [BakaColors.borderSubtle].
BoxBorder bakaSubtleBorder({Color? color, double width = 1}) {
  return Border.all(color: color ?? BakaColors.borderSubtle, width: width);
}
