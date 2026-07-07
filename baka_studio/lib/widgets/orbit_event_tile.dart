import 'package:flutter/material.dart';

import '../core/theme/theme.dart';
import '../data/models/orbit_event.dart';

IconData iconForOrbitEventType(OrbitEventType type) => switch (type) {
  OrbitEventType.gravacao => Icons.videocam_outlined,
  OrbitEventType.publicacao => Icons.send_outlined,
  OrbitEventType.prazo => Icons.flag_outlined,
  OrbitEventType.campanha => Icons.hub_outlined,
};

/// A compact chip representing one event, used in the monthly grid and the
/// per-channel orbit lanes.
class OrbitEventTile extends StatelessWidget {
  const OrbitEventTile({super.key, required this.event, required this.color, this.dense = false});

  final OrbitEvent event;
  final Color color;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    if (dense) {
      return Tooltip(
        message: '${event.type.label} — ${event.title}',
        child: Container(
          width: 6,
          height: 6,
          margin: const EdgeInsets.symmetric(horizontal: 1),
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: BakaSpacing.xs, vertical: 4),
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(BakaRadii.sm),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(iconForOrbitEventType(event.type), size: 12, color: color),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              event.title,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(color: BakaColors.starWhite),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
