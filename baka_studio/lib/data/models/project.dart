/// Visual/logical state of a single item inside a constellation (project).
enum ProjectItemState { done, inProgress, planned, blocked, future }

class ProjectItem {
  const ProjectItem({
    required this.id,
    required this.title,
    required this.state,
    this.dependsOn = const [],
    this.linkedContentId,
  });

  final String id;
  final String title;
  final ProjectItemState state;

  /// IDs of other [ProjectItem]s this one depends on — drawn as
  /// constellation lines.
  final List<String> dependsOn;

  /// When set, this node represents a real [ContentItem] instead of a
  /// free-standing milestone — title/state are then derived from it.
  final String? linkedContentId;
}

enum ProjectStatus { idea, planned, active, paused, completed, archived }

extension ProjectStatusLabel on ProjectStatus {
  String get label => switch (this) {
    ProjectStatus.idea => 'Ideia',
    ProjectStatus.planned => 'Planejado',
    ProjectStatus.active => 'Em andamento',
    ProjectStatus.paused => 'Pausado',
    ProjectStatus.completed => 'Concluído',
    ProjectStatus.archived => 'Arquivado',
  };
}

enum ProjectPriority { low, medium, high, critical }

extension ProjectPriorityLabel on ProjectPriority {
  String get label => switch (this) {
    ProjectPriority.low => 'Baixa',
    ProjectPriority.medium => 'Média',
    ProjectPriority.high => 'Alta',
    ProjectPriority.critical => 'Crítica',
  };
}

/// A project is a "constellation" — a group of related items with
/// dependencies between them.
class Project {
  const Project({
    required this.id,
    required this.workspaceId,
    required this.name,
    required this.description,
    required this.channelIds,
    required this.status,
    required this.priority,
    required this.items,
    this.startDate,
    this.targetDate,
    required this.createdAt,
    required this.updatedAt,
    this.archivedAt,
  });

  final String id;
  final String workspaceId;
  final String name;
  final String description;
  final List<String> channelIds;
  final ProjectStatus status;
  final ProjectPriority priority;
  final List<ProjectItem> items;
  final DateTime? startDate;
  final DateTime? targetDate;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? archivedAt;

  bool get isArchived => archivedAt != null;

  double get progress {
    if (items.isEmpty) return 0;
    final done = items.where((i) => i.state == ProjectItemState.done).length;
    return done / items.length;
  }
}
