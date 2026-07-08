import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/navigation.dart';
import '../../core/theme/theme.dart';
import '../../data/models/content_item.dart';
import '../../data/models/project.dart';
import '../../data/models/signal.dart';
import '../../data/models/task.dart';
import '../../state/app_state.dart';
import '../../widgets/channel_network_map.dart';
import '../../widgets/forms/form_sheet_scaffold.dart';
import '../../widgets/widgets.dart';
import '../tasks/task_form_sheet.dart';

enum _AttentionKind { blockedItem, lateTaskCritical, lateTask, lateContent, todayTask, upcomingPublication, importantSignal }

class _AttentionEntry {
  const _AttentionEntry({required this.kind, required this.title, required this.detail, this.task});

  final _AttentionKind kind;
  final String title;
  final String detail;
  final DailyTask? task;
}

/// "O que precisa da minha atenção agora?" — the home dashboard.
///
/// Every number here is computed live from real entities, never hardcoded:
/// - Atrasadas = tarefas/produções com prazo no passado que não estão
///   concluídas/publicadas.
/// - Hoje = tarefas com prazo hoje, não concluídas.
/// - Sinais pendentes = sinais ainda não processados.
/// - Em produção = produções fora do Inbox e ainda não publicadas/arquivadas.
class ObservatoryScreen extends StatefulWidget {
  const ObservatoryScreen({super.key, required this.onNavigate});

  final ValueChanged<AppSection> onNavigate;

  @override
  State<ObservatoryScreen> createState() => _ObservatoryScreenState();
}

class _ObservatoryScreenState extends State<ObservatoryScreen> {
  bool _showAllAttention = false;
  static const _collapsedLimit = 6;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final lateTasks = state.lateTasks;
    final todayTasks = state.todayTasks;
    final lateContent = state.lateContent;
    final inProduction = state.contentInProduction;
    final upcomingPublications = state.orbitEvents.where((e) => e.type.name == 'publicacao' && e.date.isAfter(DateTime.now())).toList()
      ..sort((a, b) => a.date.compareTo(b.date));
    final soonPublications = upcomingPublications.where((e) => e.date.difference(DateTime.now()).inHours <= 48).toList();
    final importantSignals = state.signals.where((s) => !s.processed && s.type == SignalType.bug).toList();
    final blockedItems = <(Project, ProjectItem)>[
      for (final project in state.projects)
        if (project.status != ProjectStatus.completed && project.status != ProjectStatus.archived)
          for (final item in project.items)
            if (item.state == ProjectItemState.blocked) (project, item),
    ];

    bool isCritical(TaskPriority p) => p == TaskPriority.high;
    final criticalLateTasks = lateTasks.where((t) => isCritical(t.priority)).toList();
    final regularLateTasks = lateTasks.where((t) => !isCritical(t.priority)).toList();
    final criticalLateContent = lateContent.where((c) => c.priority == ContentPriority.high).toList();
    final regularLateContent = lateContent.where((c) => c.priority != ContentPriority.high).toList();

    // Priority order: bloqueados → atrasados críticos → atrasados → hoje →
    // publicação próxima → sinais importantes.
    final entries = <_AttentionEntry>[
      for (final (project, item) in blockedItems)
        _AttentionEntry(kind: _AttentionKind.blockedItem, title: item.title, detail: 'Bloqueado em "${project.name}"'),
      for (final task in criticalLateTasks)
        _AttentionEntry(kind: _AttentionKind.lateTaskCritical, title: task.title, detail: 'Atrasada · prioridade alta', task: task),
      for (final content in criticalLateContent)
        _AttentionEntry(kind: _AttentionKind.lateTaskCritical, title: content.title, detail: 'Produção atrasada · prioridade alta · ${content.stage.label}'),
      for (final task in regularLateTasks) _AttentionEntry(kind: _AttentionKind.lateTask, title: task.title, detail: 'Atrasada', task: task),
      for (final content in regularLateContent)
        _AttentionEntry(kind: _AttentionKind.lateContent, title: content.title, detail: 'Produção atrasada · ${content.stage.label}'),
      for (final task in todayTasks) _AttentionEntry(kind: _AttentionKind.todayTask, title: task.title, detail: 'Hoje', task: task),
      for (final event in soonPublications)
        _AttentionEntry(kind: _AttentionKind.upcomingPublication, title: event.title, detail: 'Publicação em breve'),
      for (final signal in importantSignals) _AttentionEntry(kind: _AttentionKind.importantSignal, title: signal.title, detail: 'Sinal importante · Bug'),
    ];

    final visibleEntries = _showAllAttention ? entries : entries.take(_collapsedLimit).toList();
    final selectedChannel = state.channelById(state.selectedChannelId);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(BakaSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CosmicSectionHeader(
            title: 'Observatório',
            subtitle: 'Visão geral',
            trailing: FilledButton.icon(
              onPressed: () => showBakaFormSheet(context, builder: (_) => const TaskFormSheet()),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Nova tarefa'),
            ),
          ),
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
          else ...[
            Column(
              children: [
                for (final entry in visibleEntries) _AttentionRow(entry: entry, onNavigate: widget.onNavigate),
              ],
            ),
            if (entries.length > _collapsedLimit)
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton(
                  onPressed: () => setState(() => _showAllAttention = !_showAllAttention),
                  child: Text(_showAllAttention ? 'Ver menos' : 'Ver tudo (${entries.length})'),
                ),
              ),
          ],
          const SizedBox(height: BakaSpacing.xl),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Minha Rede', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(width: BakaSpacing.xs),
              const Tooltip(
                message: 'Toque em uma estrela para ver os detalhes do canal',
                child: Icon(Icons.info_outline, size: 16, color: BakaColors.textTertiary),
              ),
            ],
          ),
          const SizedBox(height: BakaSpacing.sm),
          LayoutBuilder(builder: (context, constraints) {
            final compact = constraints.maxWidth < 700;
            return compact
                ? _CompactChannelList(state: state)
                : StellarCard(
                    child: ChannelNetworkMap(
                      channels: state.channels,
                      links: state.channelRelations,
                      selectedChannelId: state.selectedChannelId,
                      onSelect: state.selectChannel,
                    ),
                  );
          }),
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

/// Compact substitute for the full network map on tablet/mobile — a
/// horizontally scrollable row of channel "stars" so the network identity
/// never disappears on narrow breakpoints, it just changes shape.
class _CompactChannelList extends StatelessWidget {
  const _CompactChannelList({required this.state});

  final AppState state;

  @override
  Widget build(BuildContext context) {
    return StellarCard(
      padding: const EdgeInsets.symmetric(vertical: BakaSpacing.sm, horizontal: BakaSpacing.xs),
      child: SizedBox(
        height: 84,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: BakaSpacing.sm),
          itemCount: state.channels.length,
          separatorBuilder: (_, _) => const SizedBox(width: BakaSpacing.md),
          itemBuilder: (context, index) {
            final channel = state.channels[index];
            final selected = channel.id == state.selectedChannelId;
            return InkWell(
              onTap: () => state.selectChannel(channel.id),
              borderRadius: BorderRadius.circular(BakaRadii.md),
              child: SizedBox(
                width: 72,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    StarNode(color: channel.color, size: 22, state: selected ? StarNodeState.inProgress : StarNodeState.planned),
                    const SizedBox(height: 4),
                    Text(
                      channel.name,
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
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
  _AttentionKind.blockedItem => BakaColors.warning,
  _AttentionKind.lateTaskCritical => BakaColors.danger,
  _AttentionKind.lateTask => BakaColors.danger,
  _AttentionKind.lateContent => BakaColors.danger,
  _AttentionKind.todayTask => BakaColors.stellarBlue,
  _AttentionKind.upcomingPublication => BakaColors.signalCyan,
  _AttentionKind.importantSignal => BakaColors.stellaRose,
};

IconData _iconForAttentionKind(_AttentionKind kind) => switch (kind) {
  _AttentionKind.blockedItem => Icons.block,
  _AttentionKind.lateTaskCritical => Icons.priority_high,
  _AttentionKind.lateTask => Icons.event_busy,
  _AttentionKind.lateContent => Icons.movie_creation_outlined,
  _AttentionKind.todayTask => Icons.today_outlined,
  _AttentionKind.upcomingPublication => Icons.send_outlined,
  _AttentionKind.importantSignal => Icons.bug_report_outlined,
};

class _AttentionRow extends StatelessWidget {
  const _AttentionRow({required this.entry, required this.onNavigate});

  final _AttentionEntry entry;
  final ValueChanged<AppSection> onNavigate;

  Future<void> _reschedule(BuildContext context) async {
    final state = context.read<AppState>();
    final task = entry.task!;
    final initial = task.dueDate == null || task.dueDate!.isBefore(DateTime.now()) ? DateTime.now() : task.dueDate!;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
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
        _AttentionKind.lateTaskCritical || _AttentionKind.lateTask || _AttentionKind.todayTask =>
          const PopupMenuItem(value: 'reschedule', child: Text('Reagendar')),
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
