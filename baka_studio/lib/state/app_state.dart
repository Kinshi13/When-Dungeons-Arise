import 'package:flutter/foundation.dart';

import '../data/models/campaign.dart';
import '../data/models/channel.dart';
import '../data/models/channel_link.dart';
import '../data/models/content_item.dart';
import '../data/models/orbit_event.dart';
import '../data/models/project.dart';
import '../data/models/signal.dart';
import '../data/models/task.dart';
import '../data/seed/seed_data.dart';

/// Single in-memory source of truth for the Baka Studio workspace.
///
/// This is a first design phase without a backend — everything lives in
/// memory, seeded from [SeedData]. Screens read through this notifier so the
/// data layer can later be swapped for persistence without touching UI.
class AppState extends ChangeNotifier {
  AppState()
    : channels = List.of(SeedData.channels),
      projects = List.of(SeedData.projects),
      contentItems = List.of(SeedData.contentItems),
      signals = List.of(SeedData.signals),
      orbitEvents = List.of(SeedData.orbitEvents),
      campaigns = List.of(SeedData.campaigns),
      dailyTasks = List.of(SeedData.dailyTasks);

  final List<Channel> channels;
  final List<Project> projects;
  final List<ContentItem> contentItems;
  final List<Signal> signals;
  final List<OrbitEvent> orbitEvents;
  final List<Campaign> campaigns;
  final List<DailyTask> dailyTasks;

  String? selectedChannelId;

  bool showStarfield = true;

  void setShowStarfield(bool value) {
    showStarfield = value;
    notifyListeners();
  }

  Channel? channelById(String? id) {
    if (id == null) return null;
    for (final c in channels) {
      if (c.id == id) return c;
    }
    return null;
  }

  void selectChannel(String? id) {
    selectedChannelId = selectedChannelId == id ? null : id;
    notifyListeners();
  }

  List<Project> projectsForChannel(String channelId) {
    return projects.where((p) => p.channelIds.contains(channelId)).toList();
  }

  /// Real count of projects shared between two channels — used to back up a
  /// [ChannelLink] with actual numbers instead of a decorative line.
  int sharedProjectsCount(String channelIdA, String channelIdB) {
    return projects
        .where((p) => p.channelIds.contains(channelIdA) && p.channelIds.contains(channelIdB))
        .length;
  }

  List<ContentItem> contentForChannel(String channelId) {
    return contentItems.where((c) => c.channelId == channelId).toList();
  }

  int get pendingSignalsCount => signals.where((s) => !s.processed).length;

  List<DailyTask> get todayTasks =>
      dailyTasks.where((t) => !t.done && !t.isLate).toList();

  List<DailyTask> get lateTasks => dailyTasks.where((t) => t.isLate).toList();

  void toggleTask(String id) {
    final task = dailyTasks.firstWhere((t) => t.id == id);
    task.done = !task.done;
    notifyListeners();
  }

  void rescheduleTask(String id, DateTime newDate) {
    final task = dailyTasks.firstWhere((t) => t.id == id);
    task.dueDate = newDate;
    notifyListeners();
  }

  void moveContent(String contentId, ContentStage newStage) {
    final index = contentItems.indexWhere((c) => c.id == contentId);
    if (index == -1) return;
    contentItems[index] = contentItems[index].copyWith(stage: newStage);
    notifyListeners();
  }

  void archiveSignal(String id) {
    final signal = signals.firstWhere((s) => s.id == id);
    signal.processed = true;
    notifyListeners();
  }

  /// Converts a signal into a new content item in the Inbox stage.
  void convertSignalToContent(String signalId) {
    final signal = signals.firstWhere((s) => s.id == signalId);
    contentItems.insert(
      0,
      ContentItem(
        id: 'from_$signalId',
        title: signal.text,
        channelId: signal.channelId ?? channels.first.id,
        format: ContentFormat.video,
        stage: ContentStage.inbox,
        priority: ContentPriority.medium,
      ),
    );
    signal.processed = true;
    notifyListeners();
  }

  void addSignal(Signal signal) {
    signals.insert(0, signal);
    notifyListeners();
  }

  /// Creates a new, empty constellation — the "+ Nova constelação" action.
  Project createProject(String name) {
    final project = Project(
      id: 'proj_${DateTime.now().microsecondsSinceEpoch}',
      name: name,
      description: 'Constelação recém-criada.',
      channelIds: const [],
      status: ProjectStatus.planning,
      items: const [],
    );
    projects.add(project);
    notifyListeners();
    return project;
  }
}
