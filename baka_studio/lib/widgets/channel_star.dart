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
    this.onHover,
    this.muted = false,
  });

  final Channel channel;
  final bool selected;
  final VoidCallback onTap;
  final double size;
  final bool showLabel;

  /// Fires on desktop mouse enter/exit — used by the network map to drive
  /// the "hover a star to highlight its connections" behavior.
  final ValueChanged<bool>? onHover;

  /// True when another star is focused (hovered/selected) and this one
  /// isn't related to it — dims it further without hiding it.
  final bool muted;

  @override
  Widget build(BuildContext context) {
    final pausedDim = channel.status == ChannelStatus.paused;
    final emphasized = selected;

    final star = Semantics(
      button: true,
      selected: selected,
      label: '${channel.name}, ${channel.status.label}',
      child: Tooltip(
        message: '${channel.name} — ${channel.niche}\n${channel.objective}',
        waitDuration: const Duration(milliseconds: 400),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(BakaRadii.md),
          child: AnimatedContainer(
            duration: BakaMotion.fast,
            curve: BakaMotion.standard,
            constraints: const BoxConstraints(minHeight: 40),
            padding: const EdgeInsets.symmetric(horizontal: BakaSpacing.sm, vertical: BakaSpacing.sm),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(BakaRadii.md),
              color: emphasized ? channel.color.withValues(alpha: 0.12) : Colors.transparent,
              border: Border.all(
                color: emphasized ? channel.color : Colors.transparent,
                width: 1,
              ),
              boxShadow: emphasized ? BakaShadows.focusGlow(channel.color, opacity: 0.3) : null,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Opacity(
                  opacity: pausedDim ? 0.4 : 1,
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
                      color: pausedDim ? BakaColors.textTertiary : BakaColors.starWhite,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );

    final animatedStar = AnimatedOpacity(
      duration: BakaMotion.fast,
      opacity: muted ? 0.35 : 1,
      child: star,
    );

    if (onHover == null) return animatedStar;
    return MouseRegion(
      onEnter: (_) => onHover!(true),
      onExit: (_) => onHover!(false),
      child: animatedStar,
    );
  }
}
