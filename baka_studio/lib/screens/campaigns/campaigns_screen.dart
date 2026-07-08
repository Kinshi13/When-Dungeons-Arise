import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/campaign.dart';
import '../../data/models/content_item.dart';
import '../../state/app_state.dart';
import '../../widgets/constellation_line.dart';
import '../../widgets/cosmic_section_header.dart';
import '../../widgets/empty_constellation_state.dart';
import '../../widgets/star_node.dart';
import '../../widgets/stellar_card.dart';

enum _CampaignsView { cards, list }

class _CampaignStats {
  const _CampaignStats({required this.items, required this.done, required this.late});

  final List<ContentItem> items;
  final int done;
  final int late;

  int get pending => items.length - done - late;
  double get progress => items.isEmpty ? 0 : done / items.length;
}

_CampaignStats _statsFor(Campaign campaign, AppState state) {
  final items = state.contentItems.where((c) => campaign.relatedContentIds.contains(c.id)).toList();
  final done = items.where((c) => c.stage == ContentStage.publicado).length;
  final late = items.where((c) =>
      c.stage != ContentStage.publicado &&
      c.stage != ContentStage.arquivado &&
      c.dueDate != null &&
      c.dueDate!.isBefore(DateTime.now())).length;
  return _CampaignStats(items: items, done: done, late: late);
}

class CampaignsScreen extends StatefulWidget {
  const CampaignsScreen({super.key});

  @override
  State<CampaignsScreen> createState() => _CampaignsScreenState();
}

class _CampaignsScreenState extends State<CampaignsScreen> {
  _CampaignsView _view = _CampaignsView.cards;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(BakaSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CosmicSectionHeader(
            title: 'Sistemas',
            subtitle: 'Campanhas',
            trailing: state.campaigns.isEmpty
                ? null
                : SegmentedButton<_CampaignsView>(
                    segments: const [
                      ButtonSegment(value: _CampaignsView.cards, icon: Icon(Icons.hub_outlined), label: Text('Cards')),
                      ButtonSegment(value: _CampaignsView.list, icon: Icon(Icons.view_list_outlined), label: Text('Lista')),
                    ],
                    selected: {_view},
                    onSelectionChanged: (s) => setState(() => _view = s.first),
                  ),
          ),
          const SizedBox(height: BakaSpacing.lg),
          if (state.campaigns.isEmpty)
            const EmptyConstellationState(
              message: 'Nenhum sistema criado ainda.',
              actionLabel: 'Criar campanha',
            )
          else
            for (final campaign in state.campaigns)
              Padding(
                padding: const EdgeInsets.only(bottom: BakaSpacing.md),
                child: _view == _CampaignsView.cards
                    ? _CampaignCard(campaign: campaign)
                    : _CampaignListRow(campaign: campaign),
              ),
        ],
      ),
    );
  }
}

class _CampaignListRow extends StatelessWidget {
  const _CampaignListRow({required this.campaign});

  final Campaign campaign;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final channel = state.channelById(campaign.channelId);
    final stats = _statsFor(campaign, state);

    return StellarCard(
      accentColor: channel?.color,
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(campaign.name, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 2),
                Text(channel?.name ?? '—', style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(BakaRadii.pill),
                  child: LinearProgressIndicator(
                    value: stats.progress,
                    minHeight: 6,
                    backgroundColor: BakaColors.nebulaSlateHigh,
                    valueColor: AlwaysStoppedAnimation(channel?.color ?? BakaColors.stellarBlue),
                  ),
                ),
                const SizedBox(height: 4),
                Text('${(stats.progress * 100).round()}% concluído', style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          const SizedBox(width: BakaSpacing.md),
          _CountBadge(label: 'Concluídos', value: stats.done, color: BakaColors.success),
          const SizedBox(width: BakaSpacing.sm),
          _CountBadge(label: 'Pendentes', value: stats.pending, color: BakaColors.textSecondary),
          const SizedBox(width: BakaSpacing.sm),
          _CountBadge(label: 'Atrasados', value: stats.late, color: BakaColors.danger),
        ],
      ),
    );
  }
}

class _CountBadge extends StatelessWidget {
  const _CountBadge({required this.label, required this.value, required this.color});

  final String label;
  final int value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('$value', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: color)),
        Text(label, style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}

class _CampaignCard extends StatelessWidget {
  const _CampaignCard({required this.campaign});

  final Campaign campaign;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final channel = state.channelById(campaign.channelId);
    final stats = _statsFor(campaign, state);

    return StellarCard(
      accentColor: channel?.color,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(campaign.name, style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 2),
                    Text(campaign.description, style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
              if (channel != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: channel.color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(BakaRadii.pill)),
                  child: Text(channel.name, style: TextStyle(color: channel.color, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
            ],
          ),
          const SizedBox(height: BakaSpacing.md),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(BakaRadii.pill),
                  child: LinearProgressIndicator(
                    value: stats.progress,
                    minHeight: 6,
                    backgroundColor: BakaColors.nebulaSlateHigh,
                    valueColor: AlwaysStoppedAnimation(channel?.color ?? BakaColors.stellarBlue),
                  ),
                ),
              ),
              const SizedBox(width: BakaSpacing.sm),
              Text('${(stats.progress * 100).round()}%', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: BakaSpacing.xs),
          Wrap(spacing: BakaSpacing.md, runSpacing: 4, children: [
            _InlineStat(label: 'Concluídos', value: stats.done, color: BakaColors.success),
            _InlineStat(label: 'Pendentes', value: stats.pending, color: BakaColors.textSecondary),
            if (stats.late > 0) _InlineStat(label: 'Atrasados', value: stats.late, color: BakaColors.danger),
          ]),
          if (stats.items.any((i) => i.dueDate != null)) ...[
            const SizedBox(height: BakaSpacing.md),
            _CampaignTimeline(items: stats.items, color: channel?.color ?? BakaColors.stellarBlue),
          ],
          const SizedBox(height: BakaSpacing.md),
          _SystemDiagram(color: channel?.color ?? BakaColors.stellarBlue, items: stats.items.map((c) => c.title).toList()),
        ],
      ),
    );
  }
}

class _InlineStat extends StatelessWidget {
  const _InlineStat({required this.label, required this.value, required this.color});

  final String label;
  final int value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text('$value $label', style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _CampaignTimeline extends StatelessWidget {
  const _CampaignTimeline({required this.items, required this.color});

  final List<ContentItem> items;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final dates = items.where((i) => i.dueDate != null).map((i) => i.dueDate!).toSet().toList()..sort();
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

    return Row(
      children: [
        for (var i = 0; i < dates.length; i++) ...[
          StarNode(color: color, size: 10, state: dates[i].isBefore(DateTime.now()) ? StarNodeState.done : StarNodeState.planned),
          const SizedBox(width: 4),
          Text('${dates[i].day} ${months[dates[i].month - 1]}', style: Theme.of(context).textTheme.labelSmall),
          if (i != dates.length - 1) ...[
            const SizedBox(width: 4),
            Expanded(child: Container(height: 1, color: BakaColors.divider)),
            const SizedBox(width: 4),
          ],
        ],
      ],
    );
  }
}

class _SystemDiagram extends StatelessWidget {
  const _SystemDiagram({required this.color, required this.items});

  final Color color;
  final List<String> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    const rowHeight = 40.0;
    final height = items.length * rowHeight + 20;
    const centerX = 70.0;
    const itemX = 220.0;

    return LayoutBuilder(builder: (context, constraints) {
      final centerY = height / 2;
      final positions = [for (var i = 0; i < items.length; i++) Offset(itemX, 20 + i * rowHeight + rowHeight / 2)];

      return SizedBox(
        height: height,
        child: Stack(
          children: [
            Positioned.fill(
              child: ConstellationLine(
                edges: [for (final p in positions) ConstellationEdge(start: Offset(centerX, centerY), end: p, color: color)],
              ),
            ),
            Positioned(
              left: centerX - 12,
              top: centerY - 12,
              child: StarNode(color: color, size: 24, state: StarNodeState.inProgress, label: 'Campanha'),
            ),
            for (var i = 0; i < items.length; i++)
              Positioned(
                left: itemX - 8,
                top: positions[i].dy - 8,
                child: Row(
                  children: [
                    StarNode(color: color, size: 16, state: StarNodeState.planned),
                    const SizedBox(width: BakaSpacing.xs),
                    Text(items[i], style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
          ],
        ),
      );
    });
  }
}
