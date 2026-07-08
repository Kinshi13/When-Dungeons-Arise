import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart' show Color;

import '../core/date_utils.dart';
import '../data/db/app_database.dart';
import '../data/models/campaign.dart';
import '../data/models/channel.dart';
import '../data/models/channel_link.dart';
import '../data/models/content_item.dart';
import '../data/models/orbit_event.dart';
import '../data/models/project.dart';
import '../data/models/signal.dart';
import '../data/models/task.dart';
import '../data/models/workspace.dart';
import '../data/repositories/campaign_repository.dart';
import '../data/repositories/channel_repository.dart';
import '../data/repositories/content_repository.dart';
import '../data/repositories/project_repository.dart';
import '../data/repositories/signal_repository.dart';
import '../data/repositories/task_repository.dart';
import '../data/repositories/workspace_repository.dart';
import '../data/seed/database_seeder.dart';

/// Single source of truth for the Baka Studio workspace.
///
/// Backed by real local persistence (see [AppDatabase]) through a
/// repository per entity — this class never touches the database directly,
/// it only subscribes to each repository's reactive `Stream` and republishes
/// the latest snapshot to the UI via [ChangeNotifier]. Screens read through
/// here so the storage layer can change (or grow a remote counterpart)
/// without touching widgets.
class AppState extends ChangeNotifier {
  AppState() {
    _initialize();
  }

  final AppDatabase db = AppDatabase();

  late final WorkspaceRepository workspaceRepo = WorkspaceRepository(db);
  late final ChannelRepository channelRepo = ChannelRepository(db);
  late final ProjectRepository projectRepo = ProjectRepository(db);
  late final ContentRepository contentRepo = ContentRepository(db);
  late final TaskRepository taskRepo = TaskRepository(db);
  late final SignalRepository signalRepo = SignalRepository(db);
  late final CampaignRepository campaignRepo = CampaignRepository(db);

  bool isReady = false;
  late Workspace workspace;

  List<Channel> channels = [];
  List<Project> projects = [];
  List<ContentItem> contentItems = [];
  List<DailyTask> dailyTasks = [];
  List<Signal> signals = [];
  List<Campaign> campaigns = [];
  List<ChannelLink> channelRelations = [];

  final List<StreamSubscription> _subscriptions = [];

  Future<void> _initialize() async {
    workspace = await workspaceRepo.ensureDefault();

    final seeder = DatabaseSeeder(
      channelRepository: channelRepo,
      projectRepository: projectRepo,
      contentRepository: contentRepo,
      taskRepository: taskRepo,
      signalRepository: signalRepo,
      campaignRepository: campaignRepo,
    );
    await seeder.seedIfEmpty(workspace.id);
    await channelRepo.syncSharedProjectRelations(workspace.id);

    _subscriptions.addAll([
      channelRepo.watchAll().listen((v) {
        channels = v;
        notifyListeners();
      }),
      projectRepo.watchAll().listen((v) {
        projects = v;
        notifyListeners();
      }),
      contentRepo.watchAll().listen((v) {
        contentItems = v;
        notifyListeners();
      }),
      taskRepo.watchAll().listen((v) {
        dailyTasks = v;
        notifyListeners();
      }),
      signalRepo.watchAll().listen((v) {
        signals = v;
        notifyListeners();
      }),
      campaignRepo.watchAll().listen((v) {
        campaigns = v;
        notifyListeners();
      }),
      channelRepo.watchRelations(workspace.id).listen((v) {
        channelRelations = v;
        notifyListeners();
      }),
    ]);

    isReady = true;
    notifyListeners();
  }

  @override
  void dispose() {
    for (final sub in _subscriptions) {
      sub.cancel();
    }
    db.close();
    super.dispose();
  }

  // UI-only state ------------------------------------------------------------

  String? selectedChannelId;
  bool showStarfield = true;

  void selectChannel(String? id) {
    selectedChannelId = selectedChannelId == id ? null : id;
    notifyListeners();
  }

  void setShowStarfield(bool value) {
    showStarfield = value;
    notifyListeners();
  }

  // Lookups ------------------------------------------------------------

  Channel? channelById(String? id) {
    if (id == null) return null;
    for (final c in channels) {
      if (c.id == id) return c;
    }
    return null;
  }

  List<Project> projectsForChannel(String channelId) {
    return projects.where((p) => p.channelIds.contains(channelId)).toList();
  }

  List<ContentItem> contentForChannel(String channelId) {
    return contentItems.where((c) => c.channelIds.contains(channelId)).toList();
  }

  int sharedProjectsCount(String channelIdA, String channelIdB) {
    return projects.where((p) => p.channelIds.contains(channelIdA) && p.channelIds.contains(channelIdB)).length;
  }

  /// Title of the next scheduled production for a channel — computed from
  /// real [ContentItem]s (stage `agendado` with a due date), never stored.
  String? nextPublicationForChannel(String channelId) {
    final upcoming = contentItems.where((c) => c.channelIds.contains(channelId) && c.stage == ContentStage.agendado && c.dueDate != null).toList()
      ..sort((a, b) => a.dueDate!.compareTo(b.dueDate!));
    return upcoming.isEmpty ? null : upcoming.first.title;
  }

  int pendingSignalsForChannel(String channelId) {
    return signals.where((s) => !s.processed && s.channelId == channelId).length;
  }

  int get pendingSignalsCount => signals.where((s) => !s.processed).length;

  /// Tasks due strictly today (not late, not done) — distinct from
  /// [lateTasks], which covers anything already past its due date.
  List<DailyTask> get todayTasks {
    final now = DateTime.now();
    return dailyTasks.where((t) {
      if (t.done || t.dueDate == null) return false;
      final d = t.dueDate!;
      return d.year == now.year && d.month == now.month && d.day == now.day;
    }).toList();
  }

  List<DailyTask> get lateTasks => dailyTasks.where((t) => t.isLate).toList();

  /// Productions with a past due date that haven't been published or
  /// archived yet — the "produção" half of "Atrasadas".
  List<ContentItem> get lateContent => contentItems.where((c) =>
      c.dueDate != null &&
      isBeforeToday(c.dueDate!) &&
      c.stage != ContentStage.publicado &&
      c.stage != ContentStage.arquivado).toList();

  /// Productions actively moving through the pipeline — excludes the
  /// unclassified Inbox stage and terminal stages (publicado/arquivado).
  int get contentInProduction => contentItems.where((c) =>
      c.stage != ContentStage.inbox &&
      c.stage != ContentStage.publicado &&
      c.stage != ContentStage.arquivado).length;

  /// Calendar events computed live from real dated entities — never stored,
  /// so Órbita/Observatório always reflect the current production/task/
  /// campaign dates without a separate table to keep in sync.
  List<OrbitEvent> get orbitEvents {
    final events = <OrbitEvent>[];
    for (final c in contentItems) {
      if (c.isArchived || c.dueDate == null) continue;
      final type = (c.stage == ContentStage.agendado || c.stage == ContentStage.publicado)
          ? OrbitEventType.publicacao
          : OrbitEventType.prazo;
      events.add(OrbitEvent(id: 'content_${c.id}', title: c.title, channelId: c.primaryChannelId, date: c.dueDate!, type: type));
    }
    for (final t in dailyTasks) {
      if (t.dueDate == null || t.channelId == null || t.done) continue;
      events.add(OrbitEvent(id: 'task_${t.id}', title: t.title, channelId: t.channelId!, date: t.dueDate!, type: OrbitEventType.prazo));
    }
    for (final campaign in campaigns) {
      if (campaign.isArchived || campaign.primaryChannelId == null) continue;
      if (campaign.startDate != null) {
        events.add(OrbitEvent(
          id: 'campaign_start_${campaign.id}',
          title: '${campaign.name} (início)',
          channelId: campaign.primaryChannelId!,
          date: campaign.startDate!,
          type: OrbitEventType.campanha,
        ));
      }
      if (campaign.endDate != null) {
        events.add(OrbitEvent(
          id: 'campaign_end_${campaign.id}',
          title: '${campaign.name} (fim)',
          channelId: campaign.primaryChannelId!,
          date: campaign.endDate!,
          type: OrbitEventType.campanha,
        ));
      }
    }
    return events;
  }

  // Channels ------------------------------------------------------------

  Future<Channel> createChannel({
    required String name,
    required Color color,
    String? handle,
    String niche = '',
    String objective = '',
    String description = '',
    ChannelStatus status = ChannelStatus.planning,
  }) {
    return channelRepo.create(
      workspaceId: workspace.id,
      name: name,
      color: color,
      handle: handle,
      niche: niche,
      objective: objective,
      description: description,
      status: status,
    );
  }

  Future<void> updateChannel(Channel channel) => channelRepo.update(channel);

  Future<void> archiveChannel(String id) => channelRepo.archive(id);

  Future<void> addChannelRelation({
    required String channelIdA,
    required String channelIdB,
    required String label,
    ChannelRelationType type = ChannelRelationType.strategic,
  }) {
    return channelRepo.addManualRelation(
      workspaceId: workspace.id,
      channelIdA: channelIdA,
      channelIdB: channelIdB,
      label: label,
      type: type,
    );
  }

  Future<void> removeChannelRelation(String id) => channelRepo.removeRelation(id);

  // Projects ------------------------------------------------------------

  Future<Project> createProject({
    required String name,
    String description = '',
    List<String> channelIds = const [],
    ProjectStatus status = ProjectStatus.idea,
    ProjectPriority priority = ProjectPriority.medium,
    DateTime? startDate,
    DateTime? targetDate,
  }) {
    return projectRepo.create(
      workspaceId: workspace.id,
      name: name,
      description: description,
      channelIds: channelIds,
      status: status,
      priority: priority,
      startDate: startDate,
      targetDate: targetDate,
    ).then((p) async {
      await channelRepo.syncSharedProjectRelations(workspace.id);
      return p;
    });
  }

  Future<void> updateProject(
    String id, {
    String? name,
    String? description,
    ProjectStatus? status,
    ProjectPriority? priority,
    List<String>? channelIds,
    DateTime? startDate,
    DateTime? targetDate,
  }) async {
    await projectRepo.update(
      id,
      name: name,
      description: description,
      status: status,
      priority: priority,
      channelIds: channelIds,
      startDate: startDate,
      targetDate: targetDate,
    );
    if (channelIds != null) await channelRepo.syncSharedProjectRelations(workspace.id);
  }

  Future<void> archiveProject(String id) => projectRepo.archive(id);

  Future<String> addProjectNode({
    required String projectId,
    required String title,
    ProjectItemState state = ProjectItemState.planned,
    List<String> dependsOn = const [],
    String? linkedContentId,
  }) {
    return projectRepo.addNode(
      projectId: projectId,
      title: title,
      state: state,
      dependsOn: dependsOn,
      linkedContentId: linkedContentId,
    );
  }

  Future<void> updateProjectNodeState(String nodeId, ProjectItemState state) =>
      projectRepo.updateNodeState(nodeId, state);

  Future<void> removeProjectNode(String nodeId) => projectRepo.removeNode(nodeId);

  // Content items (produções) ------------------------------------------------------------

  Future<ContentItem> createContent({
    required String title,
    required List<String> channelIds,
    required ContentFormat format,
    ContentStage stage = ContentStage.inbox,
    ContentPriority priority = ContentPriority.medium,
    String? projectId,
    DateTime? dueDate,
    String? platform,
    String description = '',
  }) {
    return contentRepo.create(
      workspaceId: workspace.id,
      title: title,
      description: description,
      channelIds: channelIds,
      format: format,
      stage: stage,
      priority: priority,
      projectId: projectId,
      dueDate: dueDate,
      platform: platform,
    );
  }

  Future<void> updateContent(
    String id, {
    String? title,
    String? description,
    List<String>? channelIds,
    ContentFormat? format,
    ContentPriority? priority,
    String? projectId,
    bool clearProjectId = false,
    DateTime? dueDate,
    String? platform,
  }) {
    return contentRepo.update(
      id,
      title: title,
      description: description,
      channelIds: channelIds,
      format: format,
      priority: priority,
      projectId: projectId,
      clearProjectId: clearProjectId,
      dueDate: dueDate,
      platform: platform,
    );
  }

  Future<void> moveContent(String contentId, ContentStage newStage) => contentRepo.moveStage(contentId, newStage);

  Future<void> archiveContent(String id) => contentRepo.archive(id);

  // Tasks ------------------------------------------------------------

  Future<DailyTask> createTask({
    required String title,
    String description = '',
    TaskPriority priority = TaskPriority.medium,
    DateTime? dueDate,
    String? channelId,
    String? projectId,
    String? contentItemId,
    String? campaignId,
  }) {
    return taskRepo.create(
      workspaceId: workspace.id,
      title: title,
      description: description,
      priority: priority,
      dueDate: dueDate,
      channelId: channelId,
      projectId: projectId,
      contentItemId: contentItemId,
      campaignId: campaignId,
    );
  }

  Future<void> updateTask(
    String id, {
    String? title,
    String? description,
    TaskPriority? priority,
    DateTime? dueDate,
  }) {
    return taskRepo.update(id, title: title, description: description, priority: priority, dueDate: dueDate);
  }

  Future<void> setTaskStatus(String id, TaskStatus status) => taskRepo.setStatus(id, status);

  Future<void> toggleTask(String id) => taskRepo.toggleDone(id);

  Future<void> rescheduleTask(String id, DateTime newDate) => taskRepo.update(id, dueDate: newDate);

  Future<void> deleteTask(String id) => taskRepo.delete(id);

  // Signals ------------------------------------------------------------

  Future<Signal> addSignal({
    required SignalType type,
    required String title,
    String body = '',
    String? channelId,
    String? source,
  }) {
    return signalRepo.create(
      workspaceId: workspace.id,
      type: type,
      title: title,
      body: body,
      channelId: channelId,
      source: source,
    );
  }

  Future<void> archiveSignal(String id) => signalRepo.archive(id);

  /// Converts a signal into a new production in the Inbox stage, preserving
  /// the origin via `convertedEntityType`/`convertedEntityId`.
  Future<void> convertSignalToContent(String signalId) async {
    final signal = signals.firstWhere((s) => s.id == signalId);
    final channelId = signal.channelId ?? channels.first.id;
    final content = await contentRepo.create(
      workspaceId: workspace.id,
      title: signal.title,
      channelIds: [channelId],
      format: ContentFormat.video,
      stage: ContentStage.inbox,
      priority: ContentPriority.medium,
    );
    await signalRepo.markProcessed(signalId, convertedEntityType: 'content', convertedEntityId: content.id);
  }

  Future<void> convertSignalToTask(String signalId) async {
    final signal = signals.firstWhere((s) => s.id == signalId);
    final task = await taskRepo.create(
      workspaceId: workspace.id,
      title: signal.title,
      channelId: signal.channelId,
    );
    await signalRepo.markProcessed(signalId, convertedEntityType: 'task', convertedEntityId: task.id);
  }

  Future<void> convertSignalToProject(String signalId) async {
    final signal = signals.firstWhere((s) => s.id == signalId);
    final project = await createProject(
      name: signal.title,
      channelIds: signal.channelId == null ? [] : [signal.channelId!],
    );
    await signalRepo.markProcessed(signalId, convertedEntityType: 'project', convertedEntityId: project.id);
  }

  Future<void> linkSignalToChannel(String signalId, String channelId) async {
    await signalRepo.markProcessed(signalId, convertedEntityType: 'channel', convertedEntityId: channelId);
  }

  // Campaigns ------------------------------------------------------------

  Future<Campaign> createCampaign({
    required String name,
    String description = '',
    CampaignStatus status = CampaignStatus.planning,
    String? primaryChannelId,
    DateTime? startDate,
    DateTime? endDate,
  }) {
    return campaignRepo.create(
      workspaceId: workspace.id,
      name: name,
      description: description,
      status: status,
      primaryChannelId: primaryChannelId,
      startDate: startDate,
      endDate: endDate,
    );
  }

  Future<void> updateCampaign(
    String id, {
    String? name,
    String? description,
    CampaignStatus? status,
    String? primaryChannelId,
    DateTime? startDate,
    DateTime? endDate,
  }) {
    return campaignRepo.update(
      id,
      name: name,
      description: description,
      status: status,
      primaryChannelId: primaryChannelId,
      startDate: startDate,
      endDate: endDate,
    );
  }

  Future<void> archiveCampaign(String id) => campaignRepo.archive(id);

  Stream<List<CampaignItem>> watchCampaignItems(String campaignId) => campaignRepo.watchItems(campaignId);

  Future<void> addCampaignItem(String campaignId, CampaignItemEntityType type, String entityId) =>
      campaignRepo.addItem(campaignId, type, entityId);

  Future<void> removeCampaignItem(String itemId) => campaignRepo.removeItem(itemId);
}
