import 'package:flutter/material.dart';

import '../core/theme/theme.dart';

/// Section header pairing a thematic name ("Constelações") with a plain
/// functional subtitle ("Projetos") so the user always understands where
/// they are, regardless of how metaphorical the main label reads.
class CosmicSectionHeader extends StatelessWidget {
  const CosmicSectionHeader({
    super.key,
    required this.title,
    required this.subtitle,
    this.trailing,
  });

  final String title;
  final String subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final titleBlock = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(title, style: textTheme.headlineLarge),
        const SizedBox(height: 2),
        Text(subtitle, style: textTheme.bodyMedium?.copyWith(color: BakaColors.textSecondary)),
      ],
    );

    if (trailing == null) return titleBlock;

    return LayoutBuilder(
      builder: (context, constraints) {
        // Below this width a Row would crush the title against the
        // trailing control (e.g. a multi-segment button) — stack instead.
        if (constraints.maxWidth < 480) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              titleBlock,
              const SizedBox(height: BakaSpacing.sm),
              trailing!,
            ],
          );
        }
        return Row(
          children: [
            Expanded(child: titleBlock),
            trailing!,
          ],
        );
      },
    );
  }
}
