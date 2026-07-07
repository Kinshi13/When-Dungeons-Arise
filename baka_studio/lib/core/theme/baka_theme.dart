import 'package:flutter/material.dart';

import 'baka_colors.dart';
import 'baka_spacing.dart';
import 'baka_typography.dart';

/// Assembles the single Baka Studio theme (dark — see design brief, the
/// product is deliberately night-toned) from the design tokens.
abstract final class BakaTheme {
  static ThemeData get dark {
    final colorScheme = const ColorScheme.dark(
      brightness: Brightness.dark,
      primary: BakaColors.stellarBlue,
      onPrimary: BakaColors.midnightVoid,
      secondary: BakaColors.signalCyan,
      onSecondary: BakaColors.midnightVoid,
      tertiary: BakaColors.nebulaViolet,
      onTertiary: BakaColors.starWhite,
      error: BakaColors.danger,
      onError: BakaColors.midnightVoid,
      surface: BakaColors.deepOrbit,
      onSurface: BakaColors.starWhite,
      surfaceContainerHighest: BakaColors.nebulaSlate,
      outline: BakaColors.divider,
      outlineVariant: BakaColors.borderSubtle,
    );

    final textTheme = BakaTypography.textTheme(BakaColors.starWhite);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: BakaColors.midnightVoid,
      colorScheme: colorScheme,
      textTheme: textTheme,
      canvasColor: BakaColors.midnightVoid,
      dividerColor: BakaColors.divider,
      splashFactory: InkSparkle.splashFactory,
      visualDensity: VisualDensity.standard,
      focusColor: BakaColors.stellarBlue.withValues(alpha: 0.35),
      hoverColor: BakaColors.starWhite.withValues(alpha: 0.04),
      highlightColor: BakaColors.starWhite.withValues(alpha: 0.06),
      splashColor: BakaColors.stellarBlue.withValues(alpha: 0.12),
      appBarTheme: const AppBarTheme(
        backgroundColor: BakaColors.midnightVoid,
        foregroundColor: BakaColors.starWhite,
        elevation: 0,
        centerTitle: false,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
        color: BakaColors.deepOrbit,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(BakaRadii.lg),
          side: const BorderSide(color: BakaColors.borderSubtle),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: BakaColors.nebulaSlate,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(BakaRadii.xl),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: BakaColors.nebulaSlate,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(BakaRadii.xl)),
        ),
      ),
      navigationRailTheme: const NavigationRailThemeData(
        backgroundColor: BakaColors.deepOrbit,
        selectedIconTheme: IconThemeData(color: BakaColors.stellarBlue),
        unselectedIconTheme: IconThemeData(color: BakaColors.textSecondary),
        selectedLabelTextStyle: TextStyle(color: BakaColors.stellarBlue, fontWeight: FontWeight.w600),
        unselectedLabelTextStyle: TextStyle(color: BakaColors.textSecondary),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: BakaColors.deepOrbit,
        surfaceTintColor: Colors.transparent,
        indicatorColor: BakaColors.stellarBlue.withValues(alpha: 0.16),
        height: 64,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      ),
      dividerTheme: const DividerThemeData(color: BakaColors.divider, thickness: 1, space: 1),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: BakaColors.nebulaSlateHigh,
          borderRadius: BorderRadius.circular(BakaRadii.sm),
        ),
        textStyle: textTheme.bodySmall?.copyWith(color: BakaColors.starWhite),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: BakaColors.nebulaSlate,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(BakaRadii.md),
          borderSide: const BorderSide(color: BakaColors.borderSubtle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(BakaRadii.md),
          borderSide: const BorderSide(color: BakaColors.borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(BakaRadii.md),
          borderSide: const BorderSide(color: BakaColors.stellarBlue, width: 1.5),
        ),
        hintStyle: const TextStyle(color: BakaColors.textTertiary),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: BakaColors.stellarBlue,
          foregroundColor: BakaColors.midnightVoid,
          disabledBackgroundColor: BakaColors.nebulaSlateHigh,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(BakaRadii.md)),
          textStyle: textTheme.labelLarge,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: BakaColors.starWhite,
          side: const BorderSide(color: BakaColors.borderSubtle),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(BakaRadii.md)),
          textStyle: textTheme.labelLarge,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: BakaColors.stellarBlue,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          textStyle: textTheme.labelLarge,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: BakaColors.nebulaSlate,
        labelStyle: textTheme.labelMedium!.copyWith(color: BakaColors.starWhite),
        side: const BorderSide(color: BakaColors.borderSubtle),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(BakaRadii.pill)),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      ),
      iconTheme: const IconThemeData(color: BakaColors.starWhite, size: 20),
      scrollbarTheme: ScrollbarThemeData(
        thumbColor: WidgetStateProperty.all(BakaColors.textTertiary.withValues(alpha: 0.4)),
      ),
    );
  }
}
