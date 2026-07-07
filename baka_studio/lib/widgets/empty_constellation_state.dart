import 'package:flutter/material.dart';

import '../core/theme/theme.dart';
import 'star_node.dart';
import 'stellar_button.dart';

/// Shared empty state — clear, non-poetic copy plus an optional call to
/// action, dressed with a single dim star rather than a heavy illustration.
class EmptyConstellationState extends StatelessWidget {
  const EmptyConstellationState({
    super.key,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(BakaSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const StarNode(color: BakaColors.textTertiary, state: StarNodeState.planned, size: 28),
            const SizedBox(height: BakaSpacing.md),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: BakaColors.textSecondary),
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: BakaSpacing.lg),
              StellarButton(label: actionLabel!, onPressed: onAction, icon: Icons.add),
            ],
          ],
        ),
      ),
    );
  }
}
