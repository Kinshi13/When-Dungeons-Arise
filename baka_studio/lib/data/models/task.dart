/// A lightweight action item surfaced on the Observatório dashboard —
/// distinct from a full [ContentItem], for quick day-to-day follow-ups.
class DailyTask {
  DailyTask({
    required this.id,
    required this.title,
    required this.dueDate,
    this.channelId,
    this.done = false,
  });

  final String id;
  final String title;
  final DateTime dueDate;
  final String? channelId;
  bool done;

  bool get isLate => !done && dueDate.isBefore(DateTime.now());
}
