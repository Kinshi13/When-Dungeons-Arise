import 'package:flutter/material.dart';

import 'baka_colors.dart';

/// Typography tokens.
///
/// Baka Studio intentionally uses each platform's native, highly legible
/// system font (Roboto / San Francisco / Segoe UI) for all product UI — the
/// brief prioritizes clarity over decorative branding. A distinct display
/// treatment is reserved for the Baka Studio wordmark only (see
/// [wordmark]), expressed through weight and tracking rather than a
/// separate typeface, so no extra font assets need to ship or be fetched at
/// runtime.
abstract final class BakaTypography {
  static TextTheme textTheme(Color onSurface) {
    return TextTheme(
      displayLarge: TextStyle(
        fontSize: 34,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.4,
        height: 1.2,
        color: onSurface,
      ),
      displayMedium: TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
        height: 1.22,
        color: onSurface,
      ),
      headlineLarge: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.2,
        height: 1.25,
        color: onSurface,
      ),
      headlineMedium: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.1,
        height: 1.3,
        color: onSurface,
      ),
      headlineSmall: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        height: 1.3,
        color: onSurface,
      ),
      titleLarge: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        height: 1.35,
        color: onSurface,
      ),
      titleMedium: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        height: 1.4,
        color: onSurface,
      ),
      titleSmall: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        height: 1.4,
        color: onSurface,
      ),
      bodyLarge: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        height: 1.5,
        color: onSurface,
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.5,
        color: onSurface,
      ),
      bodySmall: TextStyle(
        fontSize: 12.5,
        fontWeight: FontWeight.w400,
        height: 1.45,
        color: BakaColors.textSecondary,
      ),
      labelLarge: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.1,
        color: onSurface,
      ),
      labelMedium: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.2,
        color: BakaColors.textSecondary,
      ),
      labelSmall: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.4,
        color: BakaColors.textTertiary,
      ),
    );
  }

  /// Wordmark style for "Baka Studio" — used only in the sidebar header and
  /// splash screen, never in body UI.
  static const TextStyle wordmark = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w800,
    letterSpacing: 0.2,
    color: BakaColors.starWhite,
  );

  static const TextStyle overline = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w700,
    letterSpacing: 1.2,
    color: BakaColors.textTertiary,
  );
}
