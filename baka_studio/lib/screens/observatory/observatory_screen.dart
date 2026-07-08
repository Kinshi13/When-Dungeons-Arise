import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/navigation.dart';
import '../../core/theme/theme.dart';
import '../../data/models/content_item.dart';
import '../../data/models/project.dart';
import '../../data/models/signal.dart';
import '../../data/models/task.dart';
import '../../data/seed/seed_data.dart';
import '../../state/app_state.dart';
import '../../widgets/channel_network_map.dart';
import '../../widgets/widgets.dart';

enum _AttentionKind { lateTask, lateContent, todayTask, upcomingPublication, importantSignal, blockedItem }

class _AttentionEntry {
  const _AttentionEntry({required this.kind, required this.title, required this.detail, this.task});

  final _AttentionKind kind;
  final String title;
  final String detail;
  final DailyTask? task;
}

/// "O que precisa da minha atenção agora?" — the home dashboard.
class ObservatoryScreen extends StatelessWidget {
  const ObservatoryScreen({super.key, required this.onNavigate});

  final ValueChanged<AppSection> onNavigate;

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
    final soonPublications = upcomingPublications.where((e) => e.date.difference(DateTime.now()).inHours <= 48).toList();
    final importantSignals = state.signals.where((s) => !s.processed && s.type == SignalType.bug).toList();
    final blockedItems = <(Project, ProjectItem)>[
      for (final project in state.projects)
        if (project.status != ProjectStatus.done)
          for (final item in project.items)
            if (item.state == ProjectItemState.blocked) (project, item),
    ];

    final entries = <_AttentionEntry>[
      for (final task in lateTasks) _AttentionEntry(kind: _AttentionKind.lateTask, title: task.title, detail: 'Atrasada', task: task),
      for (final content in lateContent)
        _AttentionEntry(kind: _AttentionKind.lateContent, title: content.title, detail: 'Produção atrasada · ${content.stage.label}'),
      for (final signal in importantSignals) _AttentionEntry(kind: _AttentionKind.importantSignal, title: signal.text, detail: 'Sinal importante · Bug'),
      for (final (project, item) in blockedItems)
        _AttentionEntry(kind: _AttentionKind.blockedItem, title: item.title, detail: 'Bloqueado em "${project.name}"'),
      for (final task in todayTasks) _AttentionEntry(kind: _AttentionKind.todayTask, title: task.title, detail: 'Hoje', task: task),
      for (final event in soonPublications)
        _AttentionEntry(kind: _AttentionKind.upcomingPublication, title: event.title, detail: 'Publicação em breve'),
    ];

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
          if (entries.isEmpty)
            const StellarCard(child: Text('Tudo em dia — nenhuma pendência urgente.'))
          else
            Column(
              children: [
                for (final entry in entries)
                  _AttentionRow(entry: entry, onNavigate: onNavigate),
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
            ChannelContextPanel(channelId: selectedChannel.id),
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

Color _colorForAttentionKind(_AttentionKind kind) => switch (kind) {
  _AttentionKind.lateTask => BakaColors.danger,
  _AttentionKind.lateContent => BakaColors.danger,
  _AttentionKind.importantSignal => BakaColors.stellaRose,
  _AttentionKind.blockedItem => BakaColors.warning,
  _AttentionKind.todayTask => BakaColors.stellarBlue,
  _AttentionKind.upcomingPublication => BakaColors.signalCyan,
};

IconData _iconForAttentionKind(_AttentionKind kind) => switch (kind) {
  _AttentionKind.lateTask => Icons.event_busy,
  _AttentionKind.lateContent => Icons.movie_creation_outlined,
  _AttentionKind.importantSignal => Icons.bug_report_outlined,
  _AttentionKind.blockedItem => Icons.block,
  _AttentionKind.todayTask => Icons.today_outlined,
  _AttentionKind.upcomingPublication => Icons.send_outlined,
};

class _AttentionRow extends StatelessWidget {
  const _AttentionRow({required this.entry, required this.onNavigate});

  final _AttentionEntry entry;
  final ValueChanged<AppSection> onNavigate;

  Future<void> _reschedule(BuildContext context) async {
    final state = context.read<AppState>();
    final task = entry.task!;
    final picked = await showDatePicker(
      context: context,
      initialDate: task.dueDate.isBefore(DateTime.now()) ? DateTime.now() : task.dueDate,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) state.rescheduleTask(task.id, picked);
  }

  @override
  Widget build(BuildContext context) {
    final color = _colorForAttentionKind(entry.kind);
    final state = context.read<AppState>();

    final menuItems = <PopupMenuEntry<String>>[
      switch (entry.kind) {
        _AttentionKind.lateTask || _AttentionKind.todayTask => const PopupMenuItem(value: 'reschedule', child: Text('Reagendar')),
        _AttentionKind.lateContent => const PopupMenuItem(value: 'open_content', child: Text('Abrir em Produções')),
        _AttentionKind.importantSignal => const PopupMenuItem(value: 'open_signals', child: Text('Abrir em Sinais')),
        _AttentionKind.blockedItem => const PopupMenuItem(value: 'open_projects', child: Text('Abrir em Constelações')),
        _AttentionKind.upcomingPublication => const PopupMenuItem(value: 'open_orbit', child: Text('Ver na Órbita')),
      },
    ];

    return Padding(
      padding: const EdgeInsets.only(bottom: BakaSpacing.xs),
      child: StellarCard(
        padding: const EdgeInsets.symmetric(horizontal: BakaSpacing.md, vertical: BakaSpacing.sm),
        child: Row(
          children: [
            Icon(_iconForAttentionKind(entry.kind), size: 18, color: color),
            const SizedBox(width: BakaSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(entry.detail, style: BakaTypography.overline.copyWith(color: color)),
                  Text(entry.title, style: Theme.of(context).textTheme.bodyLarge),
                ],
              ),
            ),
            if (entry.task != null)
              Checkbox(value: entry.task!.done, onChanged: (_) => state.toggleTask(entry.task!.id)),
            PopupMenuButton<String>(
              tooltip: 'Mais ações',
              icon: const Icon(Icons.more_vert, size: 18, color: BakaColors.textSecondary),
              color: BakaColors.nebulaSlate,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(BakaRadii.md)),
              itemBuilder: (context) => menuItems,
              onSelected: (value) {
                switch (value) {
                  case 'reschedule':
                    _reschedule(context);
                  case 'open_content':
                    onNavigate(AppSection.content);
                  case 'open_signals':
                    onNavigate(AppSection.signals);
                  case 'open_projects':
                    onNavigate(AppSection.projects);
                  case 'open_orbit':
                    onNavigate(AppSection.orbit);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
