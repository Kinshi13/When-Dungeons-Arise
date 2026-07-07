import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/content_item.dart';
import '../../state/app_state.dart';
import '../../widgets/content_card.dart';
import '../../widgets/cosmic_section_header.dart';
import '../../widgets/empty_constellation_state.dart';

enum _ContentView { list, cards, kanban }

class ContentScreen extends StatefulWidget {
  const ContentScreen({super.key});

  @override
  State<ContentScreen> createState() => _ContentScreenState();
}

class _ContentScreenState extends State<ContentScreen> {
  _ContentView _view = _ContentView.kanban;
  String? _channelFilter;
  String _query = '';

  void _openStagePicker(BuildContext context, ContentItem item) {
    final state = context.read<AppState>();
    showModalBottomSheet(
      context: context,
      backgroundColor: BakaColors.nebulaSlate,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(BakaRadii.xl))),
      builder: (sheetContext) => SafeArea(
        child: RadioGroup<ContentStage>(
          groupValue: item.stage,
          onChanged: (value) {
            state.moveContent(item.id, value!);
            Navigator.of(sheetContext).pop();
          },
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.symmetric(vertical: BakaSpacing.md),
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: BakaSpacing.lg),
                child: Text('Mover "${item.title}" para…', style: Theme.of(sheetContext).textTheme.titleMedium),
              ),
              const SizedBox(height: BakaSpacing.sm),
              for (final stage in ContentStage.values)
                RadioListTile<ContentStage>(
                  value: stage,
                  title: Text(stage.label),
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    var items = state.contentItems.where((c) {
      final matchesChannel = _channelFilter == null || c.channelId == _channelFilter;
      final matchesQuery = _query.isEmpty || c.title.toLowerCase().contains(_query.toLowerCase());
      return matchesChannel && matchesQuery;
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(BakaSpacing.lg, BakaSpacing.lg, BakaSpacing.lg, 0),
          child: CosmicSectionHeader(
            title: 'Produções',
            subtitle: 'Conteúdos',
            trailing: SegmentedButton<_ContentView>(
              segments: const [
                ButtonSegment(value: _ContentView.list, icon: Icon(Icons.view_list_outlined), label: Text('Lista')),
                ButtonSegment(value: _ContentView.cards, icon: Icon(Icons.grid_view_rounded), label: Text('Cards')),
                ButtonSegment(value: _ContentView.kanban, icon: Icon(Icons.view_column_outlined), label: Text('Kanban')),
              ],
              selected: {_view},
              onSelectionChanged: (s) => setState(() => _view = s.first),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(BakaSpacing.lg, BakaSpacing.md, BakaSpacing.lg, BakaSpacing.sm),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(isDense: true, hintText: 'Buscar produções…', prefixIcon: Icon(Icons.search, size: 18)),
                  onChanged: (v) => setState(() => _query = v),
                ),
              ),
              const SizedBox(width: BakaSpacing.sm),
              _ChannelFilterMenu(
                selected: _channelFilter,
                onChanged: (v) => setState(() => _channelFilter = v),
              ),
            ],
          ),
        ),
        Expanded(
          child: items.isEmpty
              ? const EmptyConstellationState(message: 'Nenhuma produção encontrada com esses filtros.')
              : switch (_view) {
                  _ContentView.list => _ContentList(items: items, onTap: (i) => _openStagePicker(context, i)),
                  _ContentView.cards => _ContentGrid(items: items, onTap: (i) => _openStagePicker(context, i)),
                  _ContentView.kanban => _ContentKanban(items: items, onTap: (i) => _openStagePicker(context, i)),
                },
        ),
      ],
    );
  }
}

class _ChannelFilterMenu extends StatelessWidget {
  const _ChannelFilterMenu({required this.selected, required this.onChanged});

  final String? selected;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return PopupMenuButton<String?>(
      tooltip: 'Filtrar por canal',
      icon: Icon(Icons.filter_alt_outlined, color: selected != null ? BakaColors.stellarBlue : BakaColors.textSecondary),
      color: BakaColors.nebulaSlate,
      onSelected: onChanged,
      itemBuilder: (context) => [
        const PopupMenuItem(value: null, child: Text('Todos os canais')),
        for (final channel in state.channels) PopupMenuItem(value: channel.id, child: Text(channel.name)),
      ],
    );
  }
}

class _ContentList extends StatelessWidget {
  const _ContentList({required this.items, required this.onTap});

  final List<ContentItem> items;
  final ValueChanged<ContentItem> onTap;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(BakaSpacing.lg, 0, BakaSpacing.lg, BakaSpacing.lg),
      itemCount: items.length,
      separatorBuilder: (_, _) => const SizedBox(height: BakaSpacing.sm),
      itemBuilder: (context, index) {
        final item = items[index];
        final channel = state.channelById(item.channelId);
        final project = item.projectId == null
            ? null
            : state.projects.where((p) => p.id == item.projectId).firstOrNull;
        return ContentCard(
          item: item,
          channelName: channel?.name ?? '—',
          channelColor: channel?.color ?? BakaColors.textTertiary,
          projectName: project?.name,
          onTap: () => onTap(item),
        );
      },
    );
  }
}

class _ContentGrid extends StatelessWidget {
  const _ContentGrid({required this.items, required this.onTap});

  final List<ContentItem> items;
  final ValueChanged<ContentItem> onTap;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(BakaSpacing.lg, 0, BakaSpacing.lg, BakaSpacing.lg),
      child: LayoutBuilder(builder: (context, constraints) {
        final columns = constraints.maxWidth >= 900 ? 3 : (constraints.maxWidth >= 560 ? 2 : 1);
        final cardWidth = (constraints.maxWidth - (columns - 1) * BakaSpacing.md) / columns;
        return Wrap(
          spacing: BakaSpacing.md,
          runSpacing: BakaSpacing.md,
          children: [
            for (final item in items)
              SizedBox(
                width: cardWidth,
                child: ContentCard(
                  item: item,
                  channelName: state.channelById(item.channelId)?.name ?? '—',
                  channelColor: state.channelById(item.channelId)?.color ?? BakaColors.textTertiary,
                  projectName: state.projects.where((p) => p.id == item.projectId).firstOrNull?.name,
                  onTap: () => onTap(item),
                ),
              ),
          ],
        );
      }),
    );
  }
}

class _ContentKanban extends StatelessWidget {
  const _ContentKanban({required this.items, required this.onTap});

  final List<ContentItem> items;
  final ValueChanged<ContentItem> onTap;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final width = MediaQuery.sizeOf(context).width;
    final allowDragDrop = width >= 1000;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(BakaSpacing.lg, 0, BakaSpacing.lg, BakaSpacing.lg),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final stage in ContentStage.values)
            Padding(
              padding: const EdgeInsets.only(right: BakaSpacing.md),
              child: _KanbanColumn(
                stage: stage,
                items: items.where((i) => i.stage == stage).toList(),
                allowDragDrop: allowDragDrop,
                onTap: onTap,
                onDrop: (item) => state.moveContent(item.id, stage),
                channelName: (id) => state.channelById(id)?.name ?? '—',
                channelColor: (id) => state.channelById(id)?.color ?? BakaColors.textTertiary,
              ),
            ),
        ],
      ),
    );
  }
}

class _KanbanColumn extends StatelessWidget {
  const _KanbanColumn({
    required this.stage,
    required this.items,
    required this.allowDragDrop,
    required this.onTap,
    required this.onDrop,
    required this.channelName,
    required this.channelColor,
  });

  final ContentStage stage;
  final List<ContentItem> items;
  final bool allowDragDrop;
  final ValueChanged<ContentItem> onTap;
  final ValueChanged<ContentItem> onDrop;
  final String Function(String) channelName;
  final Color Function(String) channelColor;

  @override
  Widget build(BuildContext context) {
    Widget column = Container(
      width: 260,
      padding: const EdgeInsets.all(BakaSpacing.sm),
      decoration: BoxDecoration(
        color: BakaColors.deepOrbit,
        borderRadius: BorderRadius.circular(BakaRadii.lg),
        border: Border.all(color: BakaColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: BakaSpacing.xs, vertical: BakaSpacing.xs),
            child: Row(
              children: [
                Expanded(child: Text(stage.label, style: Theme.of(context).textTheme.titleSmall)),
                Text('${items.length}', style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          Expanded(
            child: items.isEmpty
                ? Center(child: Text('Vazio', style: Theme.of(context).textTheme.bodySmall))
                : ListView.separated(
                    itemCount: items.length,
                    separatorBuilder: (_, _) => const SizedBox(height: BakaSpacing.xs),
                    itemBuilder: (context, index) {
                      final item = items[index];
                      final card = ContentCard(
                        item: item,
                        channelName: channelName(item.channelId),
                        channelColor: channelColor(item.channelId),
                        onTap: () => onTap(item),
                      );
                      if (!allowDragDrop) return card;
                      return Draggable<ContentItem>(
                        data: item,
                        feedback: SizedBox(width: 232, child: Opacity(opacity: 0.9, child: card)),
                        childWhenDragging: Opacity(opacity: 0.3, child: card),
                        child: card,
                      );
                    },
                  ),
          ),
        ],
      ),
    );

    if (!allowDragDrop) return column;

    return DragTarget<ContentItem>(
      onWillAcceptWithDetails: (details) => details.data.stage != stage,
      onAcceptWithDetails: (details) => onDrop(details.data),
      builder: (context, candidateData, rejectedData) {
        final highlighted = candidateData.isNotEmpty;
        return AnimatedContainer(
          duration: BakaMotion.instant,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(BakaRadii.lg),
            border: highlighted ? Border.all(color: BakaColors.stellarBlue, width: 1.5) : null,
          ),
          child: column,
        );
      },
    );
  }
}
