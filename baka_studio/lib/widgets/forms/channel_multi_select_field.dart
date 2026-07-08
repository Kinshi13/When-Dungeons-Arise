import 'package:flutter/material.dart';

import '../../core/theme/theme.dart';
import '../../data/models/channel.dart';

/// Multi-select chip field used everywhere a production or project needs
/// to pick one or more real channels (N:N) instead of a single hardcoded
/// `channelId`.
class ChannelMultiSelectField extends StatelessWidget {
  const ChannelMultiSelectField({
    super.key,
    required this.channels,
    required this.selectedIds,
    required this.onChanged,
    this.label = 'Canais',
  });

  final List<Channel> channels;
  final Set<String> selectedIds;
  final ValueChanged<Set<String>> onChanged;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelMedium),
        const SizedBox(height: BakaSpacing.xs),
        Wrap(
          spacing: BakaSpacing.xs,
          runSpacing: BakaSpacing.xs,
          children: [
            for (final channel in channels)
              FilterChip(
                avatar: Container(width: 10, height: 10, decoration: BoxDecoration(color: channel.color, shape: BoxShape.circle)),
                label: Text(channel.name),
                selected: selectedIds.contains(channel.id),
                onSelected: (checked) {
                  final next = Set<String>.from(selectedIds);
                  if (checked) {
                    next.add(channel.id);
                  } else {
                    next.remove(channel.id);
                  }
                  onChanged(next);
                },
              ),
          ],
        ),
      ],
    );
  }
}
