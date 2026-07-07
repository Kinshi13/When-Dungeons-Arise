import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/campaign.dart';
import '../../state/app_state.dart';
import '../../widgets/constellation_line.dart';
import '../../widgets/cosmic_section_header.dart';
import '../../widgets/empty_constellation_state.dart';
import '../../widgets/star_node.dart';
import '../../widgets/stellar_card.dart';

class CampaignsScreen extends StatelessWidget {
  const CampaignsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(BakaSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const CosmicSectionHeader(title: 'Sistemas', subtitle: 'Campanhas'),
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
                child: _CampaignSystem(campaign: campaign),
              ),
        ],
      ),
    );
  }
}

class _CampaignSystem extends StatelessWidget {
  const _CampaignSystem({required this.campaign});

  final Campaign campaign;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final channel = state.channelById(campaign.channelId);
    final relatedItems = state.contentItems.where((c) => campaign.relatedContentIds.contains(c.id)).toList();

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
                  child: Text(channel.name, style: TextStyle(color: channel.color, fontSize: 11, fontWeight: FontWeight.w700)),
                ),
            ],
          ),
          const SizedBox(height: BakaSpacing.md),
          _SystemDiagram(color: channel?.color ?? BakaColors.stellarBlue, items: relatedItems.map((c) => c.title).toList()),
        ],
      ),
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
