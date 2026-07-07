import 'package:flutter/material.dart';

import '../core/theme/theme.dart';
import '../data/models/channel.dart';
import 'star_node.dart';

/// A channel represented as a star, used inside "Minha Rede" and the
/// channel network map. Tapping selects/deselects the channel.
class ChannelStar extends StatelessWidget {
  const ChannelStar({
    super.key,
    required this.channel,
    required this.selected,
    required this.onTap,
    this.size = 16,
    this.showLabel = true,
  });

  final Channel channel;
  final bool selected;
  final VoidCallback onTap;
  final double size;
  final bool showLabel;

  @override
  Widget build(BuildContext context) {
    final dimmed = channel.status == ChannelStatus.paused;

    return Semantics(
      button: true,
      selected: selected,
      label: '${channel.name}, ${channel.status.label}',
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(BakaRadii.md),
        child: AnimatedContainer(
          duration: BakaMotion.fast,
          curve: BakaMotion.standard,
          padding: const EdgeInsets.symmetric(horizontal: BakaSpacing.sm, vertical: BakaSpacing.xs),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(BakaRadii.md),
            color: selected ? channel.color.withValues(alpha: 0.12) : Colors.transparent,
            border: Border.all(
              color: selected ? channel.color : Colors.transparent,
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Opacity(
                opacity: dimmed ? 0.4 : 1,
                child: StarNode(
                  color: channel.color,
                  size: size,
                  state: channel.status == ChannelStatus.active
                      ? StarNodeState.inProgress
                      : StarNodeState.planned,
                ),
              ),
              if (showLabel) ...[
                const SizedBox(width: BakaSpacing.xs),
                Text(
                  channel.name,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: dimmed ? BakaColors.textTertiary : BakaColors.starWhite,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
