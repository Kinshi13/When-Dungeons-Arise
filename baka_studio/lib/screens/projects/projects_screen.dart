import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/project.dart';
import '../../state/app_state.dart';
import '../../widgets/cosmic_section_header.dart';
import '../../widgets/empty_constellation_state.dart';
import '../../widgets/forms/form_sheet_scaffold.dart';
import '../../widgets/project_constellation_view.dart';
import '../../widgets/stellar_card.dart';
import 'project_form_sheet.dart';
import 'project_node_form_sheet.dart';

enum _ProjectsView { list, cards, map }

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});

  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  _ProjectsView _view = _ProjectsView.cards;
  String? _mapProjectId;
  final List<String> _recentProjectIds = [];

  void _selectMapProject(String id) {
    setState(() {
      _mapProjectId = id;
      _recentProjectIds.remove(id);
      _recentProjectIds.insert(0, id);
      if (_recentProjectIds.length > 4) _recentProjectIds.removeLast();
    });
  }

  Future<void> _createProject() async {
    final created = await showBakaFormSheet(context, builder: (_) => const ProjectFormSheet());
    if (created == true && mounted) {
      final state = context.read<AppState>();
      if (state.projects.isNotEmpty) _selectMapProject(state.projects.last.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final projects = state.projects;

    if (projects.isEmpty) {
      return EmptyConstellationState(
        message: 'Nenhuma constelação foi formada ainda.',
        actionLabel: 'Criar projeto',
        onAction: _createProject,
      );
    }

    if (_mapProjectId == null || !projects.any((p) => p.id == _mapProjectId)) {
      _mapProjectId = projects.first.id;
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(BakaSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CosmicSectionHeader(
            title: 'Constelações',
            subtitle: 'Projetos',
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SegmentedButton<_ProjectsView>(
                  segments: const [
                    ButtonSegment(value: _ProjectsView.list, icon: Icon(Icons.view_list_outlined), label: Text('Lista')),
                    ButtonSegment(value: _ProjectsView.cards, icon: Icon(Icons.grid_view_rounded), label: Text('Cards')),
                    ButtonSegment(value: _ProjectsView.map, icon: Icon(Icons.hub_outlined), label: Text('Mapa')),
                  ],
                  selected: {_view},
                  onSelectionChanged: (s) => setState(() => _view = s.first),
                ),
                const SizedBox(width: BakaSpacing.sm),
                FilledButton.icon(
                  onPressed: _createProject,
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Novo projeto'),
                ),
              ],
            ),
          ),
          const SizedBox(height: BakaSpacing.lg),
          if (_view == _ProjectsView.list) _ProjectsList(projects: projects, state: state),
          if (_view == _ProjectsView.cards) _ProjectsGrid(projects: projects, state: state),
          if (_view == _ProjectsView.map)
            _ProjectsMap(
              projects: projects,
              selectedId: _mapProjectId!,
              recentIds: _recentProjectIds,
              onSelect: _selectMapProject,
              onCreate: _createProject,
              state: state,
            ),
        ],
      ),
    );
  }
}

void _editProject(BuildContext context, Project project) {
  showBakaFormSheet(context, builder: (_) => ProjectFormSheet(existing: project));
}

class _ProjectsList extends StatelessWidget {
  const _ProjectsList({required this.projects, required this.state});

  final List<Project> projects;
  final AppState state;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (final project in projects)
          Padding(
            padding: const EdgeInsets.only(bottom: BakaSpacing.sm),
            child: StellarCard(
              accentColor: _channelColor(project, state),
              onTap: () => _editProject(context, project),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(project.name, style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 2),
                        Text(project.description, style: Theme.of(context).textTheme.bodySmall, maxLines: 2, overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                  const SizedBox(width: BakaSpacing.md),
                  _ProgressRing(progress: project.progress),
                  const SizedBox(width: BakaSpacing.md),
                  _StatusChip(status: project.status),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _ProjectsGrid extends StatelessWidget {
  const _ProjectsGrid({required this.projects, required this.state});

  final List<Project> projects;
  final AppState state;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      final columns = constraints.maxWidth >= 900 ? 3 : (constraints.maxWidth >= 560 ? 2 : 1);
      final cardWidth = (constraints.maxWidth - (columns - 1) * BakaSpacing.md) / columns;
      return Wrap(
        spacing: BakaSpacing.md,
        runSpacing: BakaSpacing.md,
        children: [
          for (final project in projects)
            SizedBox(
              width: cardWidth,
              child: StellarCard(
                accentColor: _channelColor(project, state),
                onTap: () => _editProject(context, project),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(child: Text(project.name, style: Theme.of(context).textTheme.titleLarge)),
                        _StatusChip(status: project.status),
                      ],
                    ),
                    const SizedBox(height: BakaSpacing.xs),
                    Text(project.description, style: Theme.of(context).textTheme.bodySmall, maxLines: 3, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: BakaSpacing.md),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(BakaRadii.pill),
                      child: LinearProgressIndicator(
                        value: project.progress,
                        minHeight: 6,
                        backgroundColor: BakaColors.nebulaSlateHigh,
                        valueColor: AlwaysStoppedAnimation(_channelColor(project, state)),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${project.items.length} ${project.items.length == 1 ? 'item' : 'itens'} · ${(project.progress * 100).round()}% concluído',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),
        ],
      );
    });
  }
}

class _ProjectsMap extends StatelessWidget {
  const _ProjectsMap({
    required this.projects,
    required this.selectedId,
    required this.recentIds,
    required this.onSelect,
    required this.onCreate,
    required this.state,
  });

  final List<Project> projects;
  final String selectedId;
  final List<String> recentIds;
  final ValueChanged<String> onSelect;
  final VoidCallback onCreate;
  final AppState state;

  @override
  Widget build(BuildContext context) {
    final selected = projects.firstWhere((p) => p.id == selectedId);
    final recents = [
      for (final id in recentIds) if (id != selectedId) projects.where((p) => p.id == id).firstOrNull,
    ].whereType<Project>().take(4).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: BakaSpacing.sm,
          runSpacing: BakaSpacing.sm,
          children: [
            SizedBox(
              width: 260,
              child: DropdownMenu<String>(
                initialSelection: selectedId,
                enableFilter: true,
                enableSearch: true,
                hintText: 'Selecionar constelação',
                leadingIcon: const Icon(Icons.hub_outlined, size: 18),
                inputDecorationTheme: InputDecorationTheme(
                  isDense: true,
                  filled: true,
                  fillColor: BakaColors.nebulaSlate,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(BakaRadii.md)),
                ),
                menuStyle: MenuStyle(backgroundColor: WidgetStateProperty.all(BakaColors.nebulaSlate)),
                dropdownMenuEntries: [
                  for (final project in projects) DropdownMenuEntry(value: project.id, label: project.name),
                ],
                onSelected: (value) {
                  if (value != null) onSelect(value);
                },
              ),
            ),
            OutlinedButton.icon(
              onPressed: onCreate,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Nova constelação'),
            ),
            OutlinedButton.icon(
              onPressed: () => _editProject(context, selected),
              icon: const Icon(Icons.edit_outlined, size: 18),
              label: const Text('Editar'),
            ),
            OutlinedButton.icon(
              onPressed: () => showBakaFormSheet(context, builder: (_) => ProjectNodeFormSheet(project: selected)),
              icon: const Icon(Icons.add_circle_outline, size: 18),
              label: const Text('Novo item'),
            ),
          ],
        ),
        if (recents.isNotEmpty) ...[
          const SizedBox(height: BakaSpacing.sm),
          Row(
            children: [
              Text('Recentes', style: Theme.of(context).textTheme.labelSmall),
              const SizedBox(width: BakaSpacing.sm),
              Expanded(
                child: Wrap(
                  spacing: BakaSpacing.xs,
                  runSpacing: BakaSpacing.xs,
                  children: [
                    for (final project in recents)
                      ActionChip(label: Text(project.name), onPressed: () => onSelect(project.id)),
                  ],
                ),
              ),
            ],
          ),
        ],
        const SizedBox(height: BakaSpacing.md),
        StellarCard(
          child: ProjectConstellationView(project: selected, accentColor: _channelColor(selected, state)),
        ),
      ],
    );
  }
}

class _ProgressRing extends StatelessWidget {
  const _ProgressRing({required this.progress});

  final double progress;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 36,
      height: 36,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CircularProgressIndicator(
            value: progress,
            strokeWidth: 3,
            backgroundColor: BakaColors.nebulaSlateHigh,
            valueColor: const AlwaysStoppedAnimation(BakaColors.stellarBlue),
          ),
          Text('${(progress * 100).round()}', style: const TextStyle(fontSize: 10)),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final ProjectStatus status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      ProjectStatus.idea => BakaColors.textTertiary,
      ProjectStatus.planned => BakaColors.warning,
      ProjectStatus.active => BakaColors.stellarBlue,
      ProjectStatus.paused => BakaColors.textTertiary,
      ProjectStatus.completed => BakaColors.success,
      ProjectStatus.archived => BakaColors.textTertiary,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(BakaRadii.pill)),
      child: Text(status.label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}

Color _channelColor(Project project, AppState state) {
  if (project.channelIds.isEmpty) return BakaColors.stellarBlue;
  return state.channelById(project.channelIds.first)?.color ?? BakaColors.stellarBlue;
}
