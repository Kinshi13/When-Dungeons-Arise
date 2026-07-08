import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/date_utils.dart';
import '../../core/theme/theme.dart';
import '../../data/models/campaign.dart';
import '../../data/models/content_item.dart';
import '../../data/models/project.dart';
import '../../state/app_state.dart';
import '../../widgets/forms/form_sheet_scaffold.dart';
import '../../widgets/star_node.dart';
import '../../widgets/stellar_card.dart';
import 'campaign_form_sheet.dart';

class _ResolvedItem {
  const _ResolvedItem({required this.item, required this.title, required this.done, required this.date});

  final CampaignItem item;
  final String title;
  final bool done;
  final DateTime? date;

  bool get late => !done && date != null && isBeforeToday(date!);
}

/// Detail view for a campaign ("sistema") — where real entities (produções,
/// tarefas, projetos) are attached via [CampaignItem], and progress/timeline
/// are computed live from those entities' own dates and statuses instead of
/// being stored or hardcoded.
class CampaignDetailScreen extends StatelessWidget {
  const CampaignDetailScreen({super.key, required this.campaignId});

  final String campaignId;

  _ResolvedItem? _resolve(CampaignItem item, AppState state) {
    switch (item.entityType) {
      case CampaignItemEntityType.content:
        final content = state.contentItems.where((c) => c.id == item.entityId).firstOrNull;
        if (content == null) return null;
        return _ResolvedItem(
          item: item,
          title: content.title,
          done: content.stage == ContentStage.publicado,
          date: content.dueDate ?? content.publishedAt,
        );
      case CampaignItemEntityType.task:
        final task = state.dailyTasks.where((t) => t.id == item.entityId).firstOrNull;
        if (task == null) return null;
        return _ResolvedItem(item: item, title: task.title, done: task.done, date: task.dueDate);
      case CampaignItemEntityType.project:
        final project = state.projects.where((p) => p.id == item.entityId).firstOrNull;
        if (project == null) return null;
        return _ResolvedItem(
          item: item,
          title: project.name,
          done: project.status == ProjectStatus.completed,
          date: project.targetDate,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final campaign = state.campaigns.where((c) => c.id == campaignId).firstOrNull;
    if (campaign == null) {
      return const Scaffold(body: Center(child: Text('Esta campanha foi arquivada ou removida.')));
    }
    final channel = state.channelById(campaign.primaryChannelId);

    return Scaffold(
      appBar: AppBar(
        title: Text(campaign.name),
        actions: [
          IconButton(
            tooltip: 'Editar campanha',
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => showBakaFormSheet(context, builder: (_) => CampaignFormSheet(existing: campaign)).then((changed) {
              if (changed == true && context.mounted && state.campaigns.where((c) => c.id == campaignId).firstOrNull == null) {
                Navigator.of(context).pop();
              }
            }),
          ),
        ],
      ),
      body: StreamBuilder<List<CampaignItem>>(
        stream: state.watchCampaignItems(campaignId),
        builder: (context, snapshot) {
          final items = snapshot.data ?? const <CampaignItem>[];
          final resolved = items.map((i) => _resolve(i, state)).whereType<_ResolvedItem>().toList();
          final done = resolved.where((r) => r.done).length;
          final late = resolved.where((r) => r.late).length;
          final progress = resolved.isEmpty ? 0.0 : done / resolved.length;
          final dated = resolved.where((r) => r.date != null).toList()..sort((a, b) => a.date!.compareTo(b.date!));

          return SingleChildScrollView(
            padding: const EdgeInsets.all(BakaSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                StellarCard(
                  accentColor: channel?.color,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(campaign.name, style: Theme.of(context).textTheme.headlineSmall),
                      if (campaign.description.isNotEmpty) ...[
                        const SizedBox(height: BakaSpacing.xs),
                        Text(campaign.description, style: Theme.of(context).textTheme.bodyMedium),
                      ],
                      const SizedBox(height: BakaSpacing.sm),
                      Wrap(spacing: BakaSpacing.md, runSpacing: BakaSpacing.xs, children: [
                        _MiniStat(label: 'Status', value: campaign.status.label),
                        if (channel != null) _MiniStat(label: 'Canal', value: channel.name),
                      ]),
                    ],
                  ),
                ),
                const SizedBox(height: BakaSpacing.lg),
                if (resolved.isEmpty)
                  const StellarCard(child: Text('Nenhum item vinculado ainda — sem itens não há progresso a medir.'))
                else ...[
                  Row(
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(BakaRadii.pill),
                          child: LinearProgressIndicator(
                            value: progress,
                            minHeight: 8,
                            backgroundColor: BakaColors.nebulaSlateHigh,
                            valueColor: AlwaysStoppedAnimation(channel?.color ?? BakaColors.stellarBlue),
                          ),
                        ),
                      ),
                      const SizedBox(width: BakaSpacing.sm),
                      Text('${(progress * 100).round()}%', style: Theme.of(context).textTheme.titleSmall),
                    ],
                  ),
                  const SizedBox(height: BakaSpacing.xs),
                  Wrap(spacing: BakaSpacing.md, runSpacing: 4, children: [
                    _InlineStat(label: 'concluídos', value: done, color: BakaColors.success),
                    _InlineStat(label: 'pendentes', value: resolved.length - done - late, color: BakaColors.textSecondary),
                    if (late > 0) _InlineStat(label: 'atrasados', value: late, color: BakaColors.danger),
                  ]),
                  if (dated.isEmpty) ...[
                    const SizedBox(height: BakaSpacing.md),
                    const StellarCard(child: Text('Nenhum item tem data — sem datas suficientes para montar uma linha do tempo.')),
                  ] else ...[
                    const SizedBox(height: BakaSpacing.md),
                    Text('Linha do tempo', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: BakaSpacing.sm),
                    StellarCard(child: _Timeline(items: dated, color: channel?.color ?? BakaColors.stellarBlue)),
                  ],
                ],
                const SizedBox(height: BakaSpacing.lg),
                Row(
                  children: [
                    Text('Itens (${resolved.length})', style: Theme.of(context).textTheme.titleLarge),
                    const Spacer(),
                    OutlinedButton.icon(
                      onPressed: () => _addItem(context, state),
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('Adicionar item'),
                    ),
                  ],
                ),
                const SizedBox(height: BakaSpacing.sm),
                for (final r in resolved)
                  Padding(
                    padding: const EdgeInsets.only(bottom: BakaSpacing.xs),
                    child: StellarCard(
                      child: Row(
                        children: [
                          StarNode(
                            color: channel?.color ?? BakaColors.stellarBlue,
                            size: 14,
                            state: r.done ? StarNodeState.done : (r.late ? StarNodeState.blocked : StarNodeState.planned),
                          ),
                          const SizedBox(width: BakaSpacing.sm),
                          Expanded(child: Text(r.title)),
                          IconButton(
                            tooltip: 'Remover do sistema',
                            icon: const Icon(Icons.close, size: 18),
                            onPressed: () => state.removeCampaignItem(r.item.id),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _addItem(BuildContext context, AppState state) async {
    await showBakaFormSheet(context, builder: (_) => _AddCampaignItemSheet(campaignId: campaignId));
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

class _Timeline extends StatelessWidget {
  const _Timeline({required this.items, required this.color});

  final List<_ResolvedItem> items;
  final Color color;

  @override
  Widget build(BuildContext context) {
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            StarNode(color: color, size: 10, state: items[i].done ? StarNodeState.done : StarNodeState.planned),
            const SizedBox(width: 4),
            Text('${items[i].date!.day} ${months[items[i].date!.month - 1]}', style: Theme.of(context).textTheme.labelSmall),
            const SizedBox(width: 4),
            Text(items[i].title, style: Theme.of(context).textTheme.bodySmall, overflow: TextOverflow.ellipsis),
            if (i != items.length - 1) ...[
              const SizedBox(width: 8),
              Container(width: 24, height: 1, color: BakaColors.divider),
              const SizedBox(width: 8),
            ],
          ],
        ],
      ),
    );
  }
}

class _AddCampaignItemSheet extends StatefulWidget {
  const _AddCampaignItemSheet({required this.campaignId});

  final String campaignId;

  @override
  State<_AddCampaignItemSheet> createState() => _AddCampaignItemSheetState();
}

class _AddCampaignItemSheetState extends State<_AddCampaignItemSheet> {
  CampaignItemEntityType _type = CampaignItemEntityType.content;
  String? _entityId;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final options = switch (_type) {
      CampaignItemEntityType.content => [for (final c in state.contentItems) (id: c.id, label: c.title)],
      CampaignItemEntityType.task => [for (final t in state.dailyTasks) (id: t.id, label: t.title)],
      CampaignItemEntityType.project => [for (final p in state.projects) (id: p.id, label: p.name)],
    };

    return FormSheetScaffold(
      title: 'Adicionar item ao sistema',
      saveLabel: 'Adicionar',
      onSave: () async {
        if (_entityId == null) throw 'Selecione um item';
        await state.addCampaignItem(widget.campaignId, _type, _entityId!);
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SegmentedButton<CampaignItemEntityType>(
            segments: const [
              ButtonSegment(value: CampaignItemEntityType.content, label: Text('Produção')),
              ButtonSegment(value: CampaignItemEntityType.task, label: Text('Tarefa')),
              ButtonSegment(value: CampaignItemEntityType.project, label: Text('Projeto')),
            ],
            selected: {_type},
            onSelectionChanged: (s) => setState(() {
              _type = s.first;
              _entityId = null;
            }),
          ),
          const SizedBox(height: BakaSpacing.md),
          if (options.isEmpty)
            const Text('Nada disponível para este tipo ainda.')
          else
            DropdownButtonFormField<String>(
              initialValue: _entityId,
              decoration: const InputDecoration(labelText: 'Item'),
              dropdownColor: BakaColors.nebulaSlate,
              items: [for (final o in options) DropdownMenuItem(value: o.id, child: Text(o.label))],
              onChanged: (v) => setState(() => _entityId = v),
            ),
        ],
      ),
    );
  }
}
