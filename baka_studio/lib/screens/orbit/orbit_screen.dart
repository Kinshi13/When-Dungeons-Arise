import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/theme.dart';
import '../../data/models/orbit_event.dart';
import '../../state/app_state.dart';
import '../../widgets/cosmic_section_header.dart';
import '../../widgets/orbit_event_tile.dart';
import '../../widgets/stellar_card.dart';

enum _OrbitView { monthly, orbit }

class OrbitScreen extends StatefulWidget {
  const OrbitScreen({super.key});

  @override
  State<OrbitScreen> createState() => _OrbitScreenState();
}

class _OrbitScreenState extends State<OrbitScreen> {
  _OrbitView _view = _OrbitView.monthly;
  DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(BakaSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CosmicSectionHeader(
            title: 'Órbita',
            subtitle: 'Calendário editorial',
            trailing: SegmentedButton<_OrbitView>(
              segments: const [
                ButtonSegment(value: _OrbitView.monthly, icon: Icon(Icons.calendar_view_month), label: Text('Mensal')),
                ButtonSegment(value: _OrbitView.orbit, icon: Icon(Icons.public_outlined), label: Text('Órbita')),
              ],
              selected: {_view},
              onSelectionChanged: (s) => setState(() => _view = s.first),
            ),
          ),
          const SizedBox(height: BakaSpacing.lg),
          if (_view == _OrbitView.monthly)
            _MonthlyCalendar(
              month: _month,
              events: state.orbitEvents,
              channelColor: (id) => state.channelById(id)?.color ?? BakaColors.textTertiary,
              onPrev: () => setState(() => _month = DateTime(_month.year, _month.month - 1)),
              onNext: () => setState(() => _month = DateTime(_month.year, _month.month + 1)),
            )
          else
            _OrbitTimeline(state: state),
        ],
      ),
    );
  }
}

const _weekdayLabels = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
const _monthLabels = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

class _MonthlyCalendar extends StatelessWidget {
  const _MonthlyCalendar({
    required this.month,
    required this.events,
    required this.channelColor,
    required this.onPrev,
    required this.onNext,
  });

  final DateTime month;
  final List<OrbitEvent> events;
  final Color Function(String) channelColor;
  final VoidCallback onPrev;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    final firstOfMonth = DateTime(month.year, month.month, 1);
    final daysInMonth = DateTime(month.year, month.month + 1, 0).day;
    final leadingEmpty = firstOfMonth.weekday - 1; // Monday = 1
    final totalCells = leadingEmpty + daysInMonth;
    final rows = (totalCells / 7).ceil();

    final eventsByDay = <int, List<OrbitEvent>>{};
    for (final event in events) {
      if (event.date.year == month.year && event.date.month == month.month) {
        eventsByDay.putIfAbsent(event.date.day, () => []).add(event);
      }
    }

    return StellarCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(onPressed: onPrev, icon: const Icon(Icons.chevron_left)),
              Expanded(
                child: Text(
                  '${_monthLabels[month.month - 1]} de ${month.year}',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
              IconButton(onPressed: onNext, icon: const Icon(Icons.chevron_right)),
            ],
          ),
          const SizedBox(height: BakaSpacing.sm),
          Row(
            children: [
              for (final label in _weekdayLabels)
                Expanded(child: Center(child: Text(label, style: Theme.of(context).textTheme.labelSmall))),
            ],
          ),
          const SizedBox(height: BakaSpacing.xs),
          for (var row = 0; row < rows; row++)
            Row(
              children: [
                for (var col = 0; col < 7; col++) _buildDayCell(context, row * 7 + col, leadingEmpty, daysInMonth, eventsByDay),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildDayCell(BuildContext context, int cellIndex, int leadingEmpty, int daysInMonth, Map<int, List<OrbitEvent>> eventsByDay) {
    final day = cellIndex - leadingEmpty + 1;
    if (day < 1 || day > daysInMonth) {
      return const Expanded(child: SizedBox(height: 68));
    }
    final isToday = DateTime.now().year == month.year && DateTime.now().month == month.month && DateTime.now().day == day;
    final dayEvents = eventsByDay[day] ?? [];

    return Expanded(
      child: Container(
        height: 68,
        margin: const EdgeInsets.all(2),
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: isToday ? BakaColors.stellarBlue.withValues(alpha: 0.10) : BakaColors.nebulaSlate.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(BakaRadii.sm),
          border: isToday ? Border.all(color: BakaColors.stellarBlue) : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$day', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: isToday ? BakaColors.stellarBlue : BakaColors.textSecondary)),
            const Spacer(),
            if (dayEvents.isNotEmpty)
              Wrap(
                children: [
                  for (final event in dayEvents.take(4)) OrbitEventTile(event: event, color: channelColor(event.channelId), dense: true),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _OrbitTimeline extends StatelessWidget {
  const _OrbitTimeline({required this.state});

  final AppState state;

  static const _windowDaysBefore = 3;
  static const _windowDaysAfter = 11;

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final windowStart = DateTime(today.year, today.month, today.day).subtract(const Duration(days: _windowDaysBefore));
    final totalDays = _windowDaysBefore + _windowDaysAfter;

    return StellarCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Distribuição por canal — próximos $_windowDaysAfter dias', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: BakaSpacing.xs),
          Text(
            'Identifique excesso de conteúdo, canais abandonados ou conflitos de data.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: BakaSpacing.md),
          for (final channel in state.channels)
            Padding(
              padding: const EdgeInsets.only(bottom: BakaSpacing.md),
              child: LayoutBuilder(builder: (context, constraints) {
                final trackWidth = constraints.maxWidth - 96;
                final channelEvents = state.orbitEvents.where((e) => e.channelId == channel.id).toList();
                final todayFraction = _windowDaysBefore / totalDays;

                return Row(
                  children: [
                    SizedBox(
                      width: 88,
                      child: Text(channel.name, style: Theme.of(context).textTheme.bodyMedium, overflow: TextOverflow.ellipsis),
                    ),
                    Expanded(
                      child: SizedBox(
                        height: 24,
                        child: Stack(
                          alignment: Alignment.centerLeft,
                          children: [
                            Container(height: 2, color: BakaColors.divider),
                            Positioned(
                              left: todayFraction * trackWidth - 0.5,
                              child: Container(width: 1, height: 24, color: BakaColors.stellarBlue.withValues(alpha: 0.5)),
                            ),
                            for (final event in channelEvents)
                              if (event.date.isAfter(windowStart.subtract(const Duration(days: 1))) &&
                                  event.date.isBefore(windowStart.add(Duration(days: totalDays + 1))))
                                Positioned(
                                  left: (event.date.difference(windowStart).inDays / totalDays) * trackWidth - 4,
                                  child: Tooltip(
                                    message: '${event.type.label} — ${event.title}',
                                    child: Container(
                                      width: 9,
                                      height: 9,
                                      decoration: BoxDecoration(color: channel.color, shape: BoxShape.circle),
                                    ),
                                  ),
                                ),
                          ],
                        ),
                      ),
                    ),
                  ],
                );
              }),
            ),
        ],
      ),
    );
  }
}
