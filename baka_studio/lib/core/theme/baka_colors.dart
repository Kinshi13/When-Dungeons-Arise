import 'package:flutter/material.dart';

/// Baka Studio color tokens — "Cosmic Constellation Workspace".
///
/// Base palette lives here; never hardcode hex values elsewhere in the app.
abstract final class BakaColors {
  // Backgrounds ------------------------------------------------------------
  static const Color midnightVoid = Color(0xFF080D1A);
  static const Color deepOrbit = Color(0xFF111A2D);
  static const Color nebulaSlate = Color(0xFF18243B);

  /// One step above [nebulaSlate], for hover/pressed states on elevated surfaces.
  static const Color nebulaSlateHigh = Color(0xFF20304C);

  // Accents ------------------------------------------------------------
  static const Color stellarBlue = Color(0xFF6EA8FF);
  static const Color signalCyan = Color(0xFF70E1F5);
  static const Color nebulaViolet = Color(0xFF9B8CFF);
  static const Color stellaRose = Color(0xFFFF8CCF);

  /// Amber/burnt-red, reserved for the Robsonso channel and warning accents.
  static const Color emberAmber = Color(0xFFFFA35C);

  // Semantic status ------------------------------------------------------------
  static const Color success = Color(0xFF6EE7B7);
  static const Color warning = Color(0xFFFFC96E);
  static const Color danger = Color(0xFFFF7A85);

  // Text ------------------------------------------------------------
  static const Color starWhite = Color(0xFFEEF4FF);

  /// Cool blue-gray secondary text — never pure white on large areas.
  static const Color textSecondary = Color(0xFFA9B6D3);
  static const Color textTertiary = Color(0xFF6E7B9B);
  static const Color textDisabled = Color(0xFF4A5470);

  // Structural ------------------------------------------------------------
  static const Color divider = Color(0xFF243050);
  static const Color borderSubtle = Color(0x1AEEF4FF); // starWhite @ 10%
  static const Color borderFocus = stellarBlue;

  /// Star-field particle color, kept extremely low-alpha by the painter.
  static const Color starDust = Color(0xFFCBD9FF);

  // Channel colors ------------------------------------------------------------
  static const Color channelBakaCode = stellarBlue;
  static const Color channelBakaPhone = signalCyan;
  static const Color channelCodeNoSekai = nebulaViolet;
  static const Color channelStella7 = stellaRose;
  static const Color channelRobsonso = emberAmber;

  static const List<Color> channelPalette = [
    channelBakaCode,
    channelBakaPhone,
    channelCodeNoSekai,
    channelStella7,
    channelRobsonso,
  ];
}
