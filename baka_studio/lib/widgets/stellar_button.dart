import 'package:flutter/material.dart';

enum StellarButtonVariant { primary, outlined, text }

/// Thin wrapper over the themed button set, adding a consistent optional
/// leading icon and loading state without duplicating style logic (that
/// lives in [BakaTheme]).
class StellarButton extends StatelessWidget {
  const StellarButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.variant = StellarButtonVariant.primary,
    this.loading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final StellarButtonVariant variant;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final child = loading
        ? const SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 8)],
              Text(label),
            ],
          );

    final effectiveOnPressed = loading ? null : onPressed;

    return switch (variant) {
      StellarButtonVariant.primary => ElevatedButton(onPressed: effectiveOnPressed, child: child),
      StellarButtonVariant.outlined => OutlinedButton(onPressed: effectiveOnPressed, child: child),
      StellarButtonVariant.text => TextButton(onPressed: effectiveOnPressed, child: child),
    };
  }
}
