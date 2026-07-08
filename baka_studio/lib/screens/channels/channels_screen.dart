import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/channel.dart';
import '../../data/models/content_item.dart';
import '../../state/app_state.dart';
import '../../widgets/channel_context_panel.dart';
import '../../widgets/channel_network_map.dart';
import '../../widgets/cosmic_section_header.dart';
import '../../widgets/forms/form_sheet_scaffold.dart';
import '../../widgets/star_node.dart';
import '../../widgets/stellar_card.dart';
import 'channel_detail_screen.dart';
import 'channel_form_sheet.dart';

enum _ChannelsView { cards, map }

class ChannelsScreen extends StatefulWidget {
  const ChannelsScreen({super.key});

  @override
  State<ChannelsScreen> createState() => _ChannelsScreenState();
}

class _ChannelsScreenState extends State<ChannelsScreen> {
  _ChannelsView _view = _ChannelsView.cards;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(BakaSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CosmicSectionHeader(
            title: 'Canais',
            subtitle: 'Seus canais',
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SegmentedButton<_ChannelsView>(
                  segments: const [
                    ButtonSegment(value: _ChannelsView.cards, icon: Icon(Icons.grid_view_rounded), label: Text('Cards')),
                    ButtonSegment(value: _ChannelsView.map, icon: Icon(Icons.hub_outlined), label: Text('Mapa')),
                  ],
                  selected: {_view},
                  onSelectionChanged: (s) => setState(() => _view = s.first),
                ),
                const SizedBox(width: BakaSpacing.sm),
                FilledButton.icon(
                  onPressed: () => showBakaFormSheet(context, builder: (_) => const ChannelFormSheet()),
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Novo canal'),
                ),
              ],
            ),
          ),
          const SizedBox(height: BakaSpacing.lg),
          if (state.channels.isEmpty)
            StellarCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Nenhum canal ainda', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: BakaSpacing.xs),
                  Text('Crie seu primeiro canal para começar a organizar produções.', style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: BakaSpacing.md),
                  FilledButton.icon(
                    onPressed: () => showBakaFormSheet(context, builder: (_) => const ChannelFormSheet()),
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Novo canal'),
                  ),
                ],
              ),
            )
          else if (_view == _ChannelsView.cards)
            _ChannelsGrid(channels: state.channels)
          else ...[
            StellarCard(
              child: ChannelNetworkMap(
                height: 320,
                channels: state.channels,
                links: state.channelRelations,
                selectedChannelId: state.selectedChannelId,
                onSelect: state.selectChannel,
              ),
            ),
            if (state.selectedChannelId != null) ...[
              const SizedBox(height: BakaSpacing.sm),
              ChannelContextPanel(channelId: state.selectedChannelId!),
            ],
          ],
        ],
      ),
    );
  }
}

class _ChannelsGrid extends StatelessWidget {
  const _ChannelsGrid({required this.channels});

  final List<Channel> channels;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      final columns = constraints.maxWidth >= 900 ? 3 : (constraints.maxWidth >= 560 ? 2 : 1);
      final cardWidth = (constraints.maxWidth - (columns - 1) * BakaSpacing.md) / columns;
      return Wrap(
        spacing: BakaSpacing.md,
        runSpacing: BakaSpacing.md,
        children: [
          for (final channel in channels)
            SizedBox(width: cardWidth, child: _ChannelCard(channel: channel)),
        ],
      );
    });
  }
}

class _ChannelCard extends StatelessWidget {
  const _ChannelCard({required this.channel});

  final Channel channel;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final activeContent = state.contentForChannel(channel.id).where(
      (c) => c.stage != ContentStage.publicado && c.stage != ContentStage.arquivado,
    ).length;

    return StellarCard(
      accentColor: channel.color,
      onTap: () {
        state.selectChannel(channel.id);
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => ChannelDetailScreen(channelId: channel.id)));
      },
      selected: state.selectedChannelId == channel.id,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              StarNode(color: channel.color, size: 20, state: channel.status == ChannelStatus.active ? StarNodeState.inProgress : StarNodeState.planned),
              const SizedBox(width: BakaSpacing.sm),
              Expanded(child: Text(channel.name, style: Theme.of(context).textTheme.titleLarge)),
              _StatusChip(status: channel.status),
            ],
          ),
          const SizedBox(height: BakaSpacing.sm),
          Text(channel.niche, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 2),
          Text(channel.objective, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: BakaSpacing.md),
          const Divider(),
          const SizedBox(height: BakaSpacing.xs),
          _InfoRow(icon: Icons.movie_creation_outlined, label: 'Conteúdos ativos', value: '$activeContent'),
          _InfoRow(
            icon: Icons.event_outlined,
            label: 'Próxima publicação',
            value: state.nextPublicationForChannel(channel.id) ?? 'Nenhuma agendada',
          ),
          _InfoRow(icon: Icons.graphic_eq, label: 'Sinais pendentes', value: '${state.pendingSignalsForChannel(channel.id)}'),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final ChannelStatus status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      ChannelStatus.active => BakaColors.success,
      ChannelStatus.paused => BakaColors.textTertiary,
      ChannelStatus.planning => BakaColors.warning,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(BakaRadii.pill)),
      child: Text(status.label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 14, color: BakaColors.textTertiary),
          const SizedBox(width: BakaSpacing.xs),
          SizedBox(
            width: 118,
            child: Text(label, style: Theme.of(context).textTheme.bodySmall),
          ),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: BakaColors.starWhite),
            ),
          ),
        ],
      ),
    );
  }
}
