import 'package:flutter/animation.dart';

/// Motion tokens. Every interaction should land inside the 150–500ms window —
/// discreet, fast, and never blocking input.
abstract final class BakaMotion {
  static const Duration instant = Duration(milliseconds: 120);
  static const Duration fast = Duration(milliseconds: 200);
  static const Duration base = Duration(milliseconds: 300);
  static const Duration slow = Duration(milliseconds: 450);

  static const Curve standard = Curves.easeOutCubic;
  static const Curve enter = Curves.easeOut;
  static const Curve exit = Curves.easeIn;

  /// Gentle pulse used for "in progress" star nodes — subtle, never distracting.
  static const Duration pulse = Duration(milliseconds: 1800);
}
