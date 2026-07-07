/// Visual/logical state of a single item inside a constellation (project).
enum ProjectItemState { done, inProgress, planned, blocked, future }

class ProjectItem {
  const ProjectItem({
    required this.id,
    required this.title,
    required this.state,
    this.dependsOn = const [],
  });

  final String id;
  final String title;
  final ProjectItemState state;

  /// IDs of other [ProjectItem]s this one depends on — drawn as
  /// constellation lines.
  final List<String> dependsOn;
}

enum ProjectStatus { active, planning, blocked, done }

extension ProjectStatusLabel on ProjectStatus {
  String get label => switch (this) {
    ProjectStatus.active => 'Em andamento',
    ProjectStatus.planning => 'Planejamento',
    ProjectStatus.blocked => 'Bloqueado',
    ProjectStatus.done => 'Concluído',
  };
}

/// A project is a "constellation" — a group of related items with
/// dependencies between them.
class Project {
  const Project({
    required this.id,
    required this.name,
    required this.description,
    required this.channelIds,
    required this.status,
    required this.items,
  });

  final String id;
  final String name;
  final String description;
  final List<String> channelIds;
  final ProjectStatus status;
  final List<ProjectItem> items;

  double get progress {
    if (items.isEmpty) return 0;
    final done = items.where((i) => i.state == ProjectItemState.done).length;
    return done / items.length;
  }
}
