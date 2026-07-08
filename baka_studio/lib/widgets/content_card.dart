import 'package:flutter/material.dart';

import '../core/date_utils.dart';
import '../core/theme/theme.dart';
import '../data/models/content_item.dart';
import 'star_node.dart';
import 'stellar_card.dart';

Color colorForPriority(ContentPriority priority) => switch (priority) {
  ContentPriority.low => BakaColors.textTertiary,
  ContentPriority.medium => BakaColors.warning,
  ContentPriority.high => BakaColors.danger,
};

/// Maps a production's pipeline stage onto the shared star-node vocabulary,
/// so a card visually "lights up" the same way a finished project item
/// does once it's published.
StarNodeState _starStateForStage(ContentStage stage) => switch (stage) {
  ContentStage.publicado => StarNodeState.done,
  ContentStage.prontoParaGravar ||
  ContentStage.gravando ||
  ContentStage.editando ||
  ContentStage.thumb ||
  ContentStage.revisao ||
  ContentStage.agendado => StarNodeState.inProgress,
  ContentStage.inbox || ContentStage.ideia || ContentStage.pesquisa || ContentStage.roteiro => StarNodeState.planned,
  ContentStage.arquivado => StarNodeState.future,
};

/// A single production card — shown in list, card-grid, and Kanban layouts.
class ContentCard extends StatelessWidget {
  const ContentCard({
    super.key,
    required this.item,
    required this.channelName,
    required this.channelColor,
    this.projectName,
    required this.onTap,
    this.dense = false,
  });

  final ContentItem item;
  final String channelName;
  final Color channelColor;
  final String? projectName;
  final VoidCallback onTap;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final isLate = item.dueDate != null &&
        isBeforeToday(item.dueDate!) &&
        item.stage != ContentStage.publicado &&
        item.stage != ContentStage.arquivado;

    return StellarCard(
      accentColor: channelColor,
      onTap: onTap,
      padding: const EdgeInsets.all(BakaSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(item.title, style: textTheme.titleMedium, maxLines: 2, overflow: TextOverflow.ellipsis),
          const SizedBox(height: BakaSpacing.xs),
          Row(
            children: [
              AnimatedSwitcher(
                duration: BakaMotion.base,
                transitionBuilder: (child, animation) => ScaleTransition(
                  scale: animation,
                  child: FadeTransition(opacity: animation, child: child),
                ),
                child: StarNode(
                  key: ValueKey(item.stage),
                  color: channelColor,
                  size: 12,
                  state: _starStateForStage(item.stage),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(child: Text(channelName, style: textTheme.bodySmall, overflow: TextOverflow.ellipsis)),
            ],
          ),
          if (projectName != null) ...[
            const SizedBox(height: 2),
            Text(projectName!, style: textTheme.bodySmall?.copyWith(color: BakaColors.textTertiary)),
          ],
          const SizedBox(height: BakaSpacing.sm),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _Tag(label: item.format.label, color: BakaColors.nebulaSlateHigh, textColor: BakaColors.starWhite),
              _Tag(label: item.priority.label, color: colorForPriority(item.priority).withValues(alpha: 0.16), textColor: colorForPriority(item.priority)),
              if (item.platform != null) _Tag(label: item.platform!, color: BakaColors.nebulaSlateHigh, textColor: BakaColors.textSecondary),
            ],
          ),
          if (item.dueDate != null) ...[
            const SizedBox(height: BakaSpacing.xs),
            Row(
              children: [
                Icon(Icons.schedule, size: 13, color: isLate ? BakaColors.danger : BakaColors.textTertiary),
                const SizedBox(width: 4),
                Text(
                  _formatDate(item.dueDate!),
                  style: textTheme.bodySmall?.copyWith(color: isLate ? BakaColors.danger : BakaColors.textTertiary),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(DateTime date) => '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}';
}

class _Tag extends StatelessWidget {
  const _Tag({required this.label, required this.color, required this.textColor});

  final String label;
  final Color color;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(BakaRadii.pill)),
      child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: textColor)),
    );
  }
}
