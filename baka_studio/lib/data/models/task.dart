import '../../core/date_utils.dart';

enum TaskStatus { todo, doing, done, cancelled }

extension TaskStatusLabel on TaskStatus {
  String get label => switch (this) {
    TaskStatus.todo => 'A fazer',
    TaskStatus.doing => 'Em andamento',
    TaskStatus.done => 'Concluída',
    TaskStatus.cancelled => 'Cancelada',
  };
}

enum TaskPriority { low, medium, high }

extension TaskPriorityLabel on TaskPriority {
  String get label => switch (this) {
    TaskPriority.low => 'Baixa',
    TaskPriority.medium => 'Média',
    TaskPriority.high => 'Alta',
  };
}

/// A lightweight action item surfaced on the Observatório dashboard —
/// distinct from a full [ContentItem], for quick day-to-day follow-ups.
class DailyTask {
  DailyTask({
    required this.id,
    required this.workspaceId,
    required this.title,
    this.description = '',
    this.status = TaskStatus.todo,
    this.priority = TaskPriority.medium,
    this.dueDate,
    this.completedAt,
    this.channelId,
    this.projectId,
    this.contentItemId,
    this.campaignId,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String workspaceId;
  final String title;
  final String description;
  TaskStatus status;
  final TaskPriority priority;
  DateTime? dueDate;
  DateTime? completedAt;
  final String? channelId;
  final String? projectId;
  final String? contentItemId;
  final String? campaignId;
  final DateTime createdAt;
  DateTime updatedAt;

  bool get done => status == TaskStatus.done;

  /// Late means the due date's *calendar day* is strictly before today —
  /// a task due today at 00:00 is "Hoje", not "Atrasada", regardless of
  /// what time of day it currently is.
  bool get isLate => !done && status != TaskStatus.cancelled && dueDate != null && isBeforeToday(dueDate!);
}
