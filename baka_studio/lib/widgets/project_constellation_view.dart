import 'package:flutter/material.dart';

import '../core/theme/baka_colors.dart';
import '../data/models/project.dart';
import 'constellation_line.dart';
import 'star_node.dart';

StarNodeState _starStateFor(ProjectItemState state) => switch (state) {
  ProjectItemState.done => StarNodeState.done,
  ProjectItemState.inProgress => StarNodeState.inProgress,
  ProjectItemState.planned => StarNodeState.planned,
  ProjectItemState.blocked => StarNodeState.blocked,
  ProjectItemState.future => StarNodeState.future,
};

/// Renders a single project as a dependency-ordered constellation: items
/// with no dependencies sit in the leftmost column, dependents extend to
/// the right, connected by [ConstellationLine]s.
class ProjectConstellationView extends StatelessWidget {
  const ProjectConstellationView({super.key, required this.project, this.accentColor = BakaColors.stellarBlue});

  final Project project;
  final Color accentColor;

  Map<String, int> _computeLevels() {
    final levels = <String, int>{};
    int levelOf(String id) {
      if (levels.containsKey(id)) return levels[id]!;
      final item = project.items.firstWhere((i) => i.id == id);
      if (item.dependsOn.isEmpty) {
        levels[id] = 0;
        return 0;
      }
      final level = 1 + item.dependsOn.map(levelOf).reduce((a, b) => a > b ? a : b);
      levels[id] = level;
      return level;
    }

    for (final item in project.items) {
      levelOf(item.id);
    }
    return levels;
  }

  @override
  Widget build(BuildContext context) {
    if (project.items.isEmpty) {
      return const SizedBox(height: 120, child: Center(child: Text('Sem itens ainda.')));
    }

    final levels = _computeLevels();
    final maxLevel = levels.values.reduce((a, b) => a > b ? a : b);
    final itemsByLevel = <int, List<String>>{};
    for (final entry in levels.entries) {
      itemsByLevel.putIfAbsent(entry.value, () => []).add(entry.key);
    }

    const columnWidth = 168.0;
    const rowHeight = 64.0;
    final maxRows = itemsByLevel.values.map((l) => l.length).reduce((a, b) => a > b ? a : b);
    final height = maxRows * rowHeight + 40;
    final width = (maxLevel + 1) * columnWidth;

    final positions = <String, Offset>{};
    itemsByLevel.forEach((level, ids) {
      final totalHeight = ids.length * rowHeight;
      final startY = (height - totalHeight) / 2;
      for (var i = 0; i < ids.length; i++) {
        positions[ids[i]] = Offset(
          level * columnWidth + columnWidth / 2,
          startY + i * rowHeight + rowHeight / 2,
        );
      }
    });

    final edges = <ConstellationEdge>[
      for (final item in project.items)
        for (final depId in item.dependsOn)
          if (positions[depId] != null && positions[item.id] != null)
            ConstellationEdge(
              start: positions[depId]!,
              end: positions[item.id]!,
              dashed: item.state == ProjectItemState.future,
            ),
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SizedBox(
        width: width,
        height: height,
        child: Stack(
          children: [
            Positioned.fill(child: ConstellationLine(edges: edges)),
            for (final item in project.items)
              Positioned(
                left: positions[item.id]!.dx - columnWidth / 2 + 8,
                top: positions[item.id]!.dy - 20,
                width: columnWidth - 16,
                child: Column(
                  children: [
                    StarNode(
                      color: accentColor,
                      size: 18,
                      state: _starStateFor(item.state),
                      label: item.title,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.title,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(color: BakaColors.starWhite),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
