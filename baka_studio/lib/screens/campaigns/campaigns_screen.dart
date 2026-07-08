import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/campaign.dart';
import '../../state/app_state.dart';
import '../../widgets/cosmic_section_header.dart';
import '../../widgets/empty_constellation_state.dart';
import '../../widgets/forms/form_sheet_scaffold.dart';
import '../../widgets/stellar_card.dart';
import 'campaign_detail_screen.dart';
import 'campaign_form_sheet.dart';

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
          CosmicSectionHeader(
            title: 'Sistemas',
            subtitle: 'Campanhas',
            trailing: FilledButton.icon(
              onPressed: () => showBakaFormSheet(context, builder: (_) => const CampaignFormSheet()),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Nova campanha'),
            ),
          ),
          const SizedBox(height: BakaSpacing.lg),
          if (state.campaigns.isEmpty)
            EmptyConstellationState(
              message: 'Nenhum sistema criado ainda.',
              actionLabel: 'Criar campanha',
              onAction: () => showBakaFormSheet(context, builder: (_) => const CampaignFormSheet()),
            )
          else
            for (final campaign in state.campaigns)
              Padding(
                padding: const EdgeInsets.only(bottom: BakaSpacing.md),
                child: _CampaignCard(campaign: campaign),
              ),
        ],
      ),
    );
  }
}

class _CampaignCard extends StatelessWidget {
  const _CampaignCard({required this.campaign});

  final Campaign campaign;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final channel = state.channelById(campaign.primaryChannelId);

    return StellarCard(
      accentColor: channel?.color,
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => CampaignDetailScreen(campaignId: campaign.id))),
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
                    if (campaign.description.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(campaign.description, style: Theme.of(context).textTheme.bodySmall, maxLines: 2, overflow: TextOverflow.ellipsis),
                    ],
                  ],
                ),
              ),
              if (channel != null) ...[
                const SizedBox(width: BakaSpacing.sm),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: channel.color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(BakaRadii.pill)),
                  child: Text(channel.name, style: TextStyle(color: channel.color, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ],
              const SizedBox(width: BakaSpacing.sm),
              _StatusChip(status: campaign.status),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final CampaignStatus status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      CampaignStatus.planning => BakaColors.warning,
      CampaignStatus.active => BakaColors.stellarBlue,
      CampaignStatus.paused => BakaColors.textTertiary,
      CampaignStatus.completed => BakaColors.success,
      CampaignStatus.archived => BakaColors.textTertiary,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(BakaRadii.pill)),
      child: Text(status.label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}
