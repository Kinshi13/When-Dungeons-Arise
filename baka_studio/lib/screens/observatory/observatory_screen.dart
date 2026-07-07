import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/content_item.dart';
import '../../data/seed/seed_data.dart';
import '../../state/app_state.dart';
import '../../widgets/channel_network_map.dart';
import '../../widgets/widgets.dart';

/// "O que precisa da minha atenção agora?" — the home dashboard.
class ObservatoryScreen extends StatelessWidget {
  const ObservatoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final lateTasks = state.lateTasks;
    final todayTasks = state.todayTasks;
    final lateContent = state.contentItems.where((c) =>
        c.dueDate != null &&
        c.dueDate!.isBefore(DateTime.now()) &&
        c.stage != ContentStage.publicado &&
        c.stage != ContentStage.arquivado).toList();
    final inProduction = state.contentItems.where((c) =>
        c.stage != ContentStage.publicado &&
        c.stage != ContentStage.arquivado &&
        c.stage != ContentStage.inbox).length;
    final upcomingPublications = state.orbitEvents
        .where((e) => e.type.name == 'publicacao' && e.date.isAfter(DateTime.now()))
        .toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final selectedChannel = state.channelById(state.selectedChannelId);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(BakaSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const CosmicSectionHeader(title: 'Observatório', subtitle: 'Visão geral'),
          const SizedBox(height: BakaSpacing.lg),
          _StatsRow(
            lateCount: lateTasks.length + lateContent.length,
            todayCount: todayTasks.length,
            pendingSignals: state.pendingSignalsCount,
            inProduction: inProduction,
          ),
          const SizedBox(height: BakaSpacing.xl),
          Text('Precisa da sua atenção', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: BakaSpacing.sm),
          if (lateTasks.isEmpty && lateContent.isEmpty && todayTasks.isEmpty)
            const StellarCard(child: Text('Tudo em dia — nenhuma pendência urgente.'))
          else
            Column(
              children: [
                for (final task in lateTasks)
                  _AttentionRow(
                    color: BakaColors.danger,
                    label: 'Atrasada',
                    title: task.title,
                    trailing: Checkbox(value: task.done, onChanged: (_) => state.toggleTask(task.id)),
                  ),
                for (final content in lateContent)
                  _AttentionRow(
                    color: BakaColors.danger,
                    label: 'Produção atrasada · ${content.stage.label}',
                    title: content.title,
                  ),
                for (final task in todayTasks)
                  _AttentionRow(
                    color: BakaColors.stellarBlue,
                    label: 'Hoje',
                    title: task.title,
                    trailing: Checkbox(value: task.done, onChanged: (_) => state.toggleTask(task.id)),
                  ),
              ],
            ),
          const SizedBox(height: BakaSpacing.xl),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Minha Rede', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(width: BakaSpacing.xs),
              Tooltip(
                message: 'Toque em uma estrela para ver os detalhes do canal',
                child: Icon(Icons.info_outline, size: 16, color: BakaColors.textTertiary),
              ),
            ],
          ),
          const SizedBox(height: BakaSpacing.sm),
          StellarCard(
            child: ChannelNetworkMap(
              channels: state.channels,
              links: SeedData.channelLinks,
              selectedChannelId: state.selectedChannelId,
              onSelect: state.selectChannel,
            ),
          ),
          if (selectedChannel != null) ...[
            const SizedBox(height: BakaSpacing.sm),
            _ChannelContextPanel(channelId: selectedChannel.id),
          ],
          const SizedBox(height: BakaSpacing.xl),
          Text('Próximas publicações', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: BakaSpacing.sm),
          if (upcomingPublications.isEmpty)
            const StellarCard(child: Text('Nenhuma publicação agendada.'))
          else
            StellarCard(
              padding: const EdgeInsets.symmetric(vertical: BakaSpacing.xs),
              child: Column(
                children: [
                  for (final event in upcomingPublications.take(5))
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: BakaSpacing.xs),
                      child: Row(
                        children: [
                          Icon(iconForOrbitEventType(event.type), size: 16, color: BakaColors.signalCyan),
                          const SizedBox(width: BakaSpacing.sm),
                          Expanded(child: Text(event.title, style: Theme.of(context).textTheme.bodyLarge)),
                          Text(_formatDate(event.date), style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    const weekdays = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
    return '${weekdays[date.weekday - 1]} · ${date.day}/${date.month}';
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({
    required this.lateCount,
    required this.todayCount,
    required this.pendingSignals,
    required this.inProduction,
  });

  final int lateCount;
  final int todayCount;
  final int pendingSignals;
  final int inProduction;

  @override
  Widget build(BuildContext context) {
    final stats = [
      (label: 'Atrasadas', value: lateCount, color: BakaColors.danger),
      (label: 'Hoje', value: todayCount, color: BakaColors.stellarBlue),
      (label: 'Sinais pendentes', value: pendingSignals, color: BakaColors.signalCyan),
      (label: 'Em produção', value: inProduction, color: BakaColors.nebulaViolet),
    ];

    return LayoutBuilder(builder: (context, constraints) {
      final isNarrow = constraints.maxWidth < 560;
      final children = [
        for (final stat in stats)
          SizedBox(
            width: isNarrow ? (constraints.maxWidth - BakaSpacing.sm) / 2 : (constraints.maxWidth - 3 * BakaSpacing.sm) / 4,
            child: StellarCard(
              accentColor: stat.color,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${stat.value}', style: Theme.of(context).textTheme.displayMedium),
                  const SizedBox(height: 2),
                  Text(stat.label, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
          ),
      ];
      return Wrap(spacing: BakaSpacing.sm, runSpacing: BakaSpacing.sm, children: children);
    });
  }
}

class _AttentionRow extends StatelessWidget {
  const _AttentionRow({required this.color, required this.label, required this.title, this.trailing});

  final Color color;
  final String label;
  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: BakaSpacing.xs),
      child: StellarCard(
        padding: const EdgeInsets.symmetric(horizontal: BakaSpacing.md, vertical: BakaSpacing.sm),
        child: Row(
          children: [
            Container(width: 4, height: 32, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(BakaRadii.pill))),
            const SizedBox(width: BakaSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: BakaTypography.overline.copyWith(color: color)),
                  Text(title, style: Theme.of(context).textTheme.bodyLarge),
                ],
              ),
            ),
            ?trailing,
          ],
        ),
      ),
    );
  }
}

class _ChannelContextPanel extends StatelessWidget {
  const _ChannelContextPanel({required this.channelId});

  final String channelId;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final channel = state.channelById(channelId)!;
    final projects = state.projectsForChannel(channelId);
    final content = state.contentForChannel(channelId)
        .where((c) => c.stage != ContentStage.publicado && c.stage != ContentStage.arquivado)
        .toList();

    return StellarCard(
      accentColor: channel.color,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(channel.name, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 2),
          Text(channel.objective, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: BakaSpacing.sm),
          Wrap(spacing: BakaSpacing.md, runSpacing: BakaSpacing.xs, children: [
            _MiniStat(label: 'Projetos ativos', value: '${projects.length}'),
            _MiniStat(label: 'Em produção', value: '${content.length}'),
            if (channel.nextPublication != null)
              _MiniStat(label: 'Próxima publicação', value: channel.nextPublication!),
          ]),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelSmall),
        Text(value, style: Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }
}
