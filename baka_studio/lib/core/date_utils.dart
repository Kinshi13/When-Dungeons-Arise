/// Whether [date] falls on a calendar day strictly before today — used for
/// every "atrasado" check in the app so a deadline due today at 00:00 never
/// reads as late just because some hours have already passed.
bool isBeforeToday(DateTime date) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  return DateTime(date.year, date.month, date.day).isBefore(today);
}
