import 'package:drift/drift.dart';

// Only the enums are imported here (via `show`) — the domain model classes
// (Channel, Project, ContentItem, Task, Signal, Campaign, Workspace) have
// the same names Drift would otherwise generate for each table's row class
// (Channels -> Channel, Projects -> Project, ...), so pulling them into this
// library's scope would collide with the generated code in
// app_database.g.dart.
import '../models/campaign.dart' show CampaignStatus, CampaignItemEntityType;
import '../models/channel.dart' show ChannelStatus;
import '../models/channel_link.dart' show ChannelRelationType;
import '../models/content_item.dart' show ContentFormat, ContentStage, ContentPriority;
import '../models/project.dart' show ProjectStatus, ProjectPriority, ProjectItemState;
import '../models/signal.dart' show SignalType;
import '../models/task.dart' show TaskStatus, TaskPriority;

// Re-exported (not just imported) so app_database.dart — which is the
// actual library app_database.g.dart's `part of` shares scope with — sees
// these enums too, without duplicating this import list there.
export '../models/campaign.dart' show CampaignStatus, CampaignItemEntityType;
export '../models/channel.dart' show ChannelStatus;
export '../models/channel_link.dart' show ChannelRelationType;
export '../models/content_item.dart' show ContentFormat, ContentStage, ContentPriority;
export '../models/project.dart' show ProjectStatus, ProjectPriority, ProjectItemState;
export '../models/signal.dart' show SignalType;
export '../models/task.dart' show TaskStatus, TaskPriority;

/// Schema notes (see final report for the full rationale):
///  - every table uses a client-generated UUID text `id` — never a list
///    index or a title — so rows stay stable across renames and are ready
///    for a future remote sync.
///  - `createdAt` / `updatedAt` are mandatory; `archivedAt` is nullable and
///    is how "important" entities (channel/project/content/campaign) are
///    soft-deleted — see [Channels], [Projects], [ContentItems], [Campaigns].
///  - junction tables ([ProjectChannels], [ContentChannels]) model real N:N
///    relationships instead of a single foreign key.
@DataClassName('WorkspaceEntry')
class Workspaces extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get description => text().withDefault(const Constant(''))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('ChannelEntry')
class Channels extends Table {
  TextColumn get id => text()();
  TextColumn get workspaceId => text()();
  TextColumn get name => text()();
  TextColumn get handle => text().nullable()();
  TextColumn get niche => text().withDefault(const Constant(''))();
  TextColumn get objective => text().withDefault(const Constant(''))();
  TextColumn get description => text().withDefault(const Constant(''))();
  IntColumn get color => integer()();
  TextColumn get audience => text().nullable()();
  TextColumn get desiredFrequency => text().nullable()();
  TextColumn get status => textEnum<ChannelStatus>()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get archivedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('ProjectEntry')
class Projects extends Table {
  TextColumn get id => text()();
  TextColumn get workspaceId => text()();
  TextColumn get name => text()();
  TextColumn get description => text().withDefault(const Constant(''))();
  TextColumn get status => textEnum<ProjectStatus>()();
  TextColumn get priority => textEnum<ProjectPriority>()();
  DateTimeColumn get startDate => dateTime().nullable()();
  DateTimeColumn get targetDate => dateTime().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get archivedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Project ⟷ Channel, N:N.
class ProjectChannels extends Table {
  TextColumn get projectId => text()();
  TextColumn get channelId => text()();
  TextColumn get role => text().nullable()();

  @override
  Set<Column> get primaryKey => {projectId, channelId};
}

/// A node in a project's constellation map. May stand alone (a milestone)
/// or represent a real [ContentItems] row via [linkedEntityId] — in which
/// case the UI derives the title/status from the linked content instead of
/// duplicating it.
class ProjectNodes extends Table {
  TextColumn get id => text()();
  TextColumn get projectId => text()();
  TextColumn get title => text()();
  TextColumn get state => textEnum<ProjectItemState>()();
  TextColumn get linkedEntityType => text().nullable()();
  TextColumn get linkedEntityId => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

/// A dependency edge between two [ProjectNodes] — drawn as a constellation
/// line. `dependency` is the only type used by the UI today; the others
/// are modeled so a future edit surface doesn't need a schema change.
class ProjectNodeRelations extends Table {
  TextColumn get id => text()();
  TextColumn get projectId => text()();
  TextColumn get sourceNodeId => text()();
  TextColumn get targetNodeId => text()();
  TextColumn get type => text().withDefault(const Constant('dependency'))();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('ContentItemEntry')
class ContentItems extends Table {
  TextColumn get id => text()();
  TextColumn get workspaceId => text()();
  TextColumn get title => text()();
  TextColumn get description => text().withDefault(const Constant(''))();
  TextColumn get format => textEnum<ContentFormat>()();
  TextColumn get stage => textEnum<ContentStage>()();
  TextColumn get priority => textEnum<ContentPriority>()();
  TextColumn get projectId => text().nullable()();
  DateTimeColumn get dueDate => dateTime().nullable()();
  DateTimeColumn get publishedAt => dateTime().nullable()();
  TextColumn get platform => text().nullable()();
  TextColumn get notes => text().withDefault(const Constant(''))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get archivedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

/// ContentItem ⟷ Channel, N:N (a collaboration between two channels).
class ContentChannels extends Table {
  TextColumn get contentItemId => text()();
  TextColumn get channelId => text()();
  TextColumn get role => text().nullable()();

  @override
  Set<Column> get primaryKey => {contentItemId, channelId};
}

@DataClassName('TaskEntry')
class Tasks extends Table {
  TextColumn get id => text()();
  TextColumn get workspaceId => text()();
  TextColumn get title => text()();
  TextColumn get description => text().withDefault(const Constant(''))();
  TextColumn get status => textEnum<TaskStatus>()();
  TextColumn get priority => textEnum<TaskPriority>()();
  DateTimeColumn get dueDate => dateTime().nullable()();
  DateTimeColumn get completedAt => dateTime().nullable()();
  TextColumn get channelId => text().nullable()();
  TextColumn get projectId => text().nullable()();
  TextColumn get contentItemId => text().nullable()();
  TextColumn get campaignId => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('SignalEntry')
class Signals extends Table {
  TextColumn get id => text()();
  TextColumn get workspaceId => text()();
  TextColumn get type => textEnum<SignalType>()();
  TextColumn get title => text()();
  TextColumn get body => text().withDefault(const Constant(''))();
  TextColumn get source => text().nullable()();
  TextColumn get channelId => text().nullable()();
  BoolColumn get processed => boolean().withDefault(const Constant(false))();
  DateTimeColumn get processedAt => dateTime().nullable()();
  TextColumn get convertedEntityType => text().nullable()();
  TextColumn get convertedEntityId => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('CampaignEntry')
class Campaigns extends Table {
  TextColumn get id => text()();
  TextColumn get workspaceId => text()();
  TextColumn get name => text()();
  TextColumn get description => text().withDefault(const Constant(''))();
  TextColumn get status => textEnum<CampaignStatus>()();
  DateTimeColumn get startDate => dateTime().nullable()();
  DateTimeColumn get endDate => dateTime().nullable()();
  TextColumn get primaryChannelId => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get archivedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('CampaignItemEntry')
class CampaignItems extends Table {
  TextColumn get id => text()();
  TextColumn get campaignId => text()();
  TextColumn get entityType => textEnum<CampaignItemEntityType>()();
  TextColumn get entityId => text()();
  IntColumn get sortOrder => integer().withDefault(const Constant(0))();

  @override
  Set<Column> get primaryKey => {id};
}

/// A relation between two channels. Rows of type `sharedProject` /
/// `sharedCampaign` are derived and rewritten by the repository whenever
/// project/campaign membership changes — see `ChannelRepository.
/// _syncDerivedRelations`. `strategic` / `custom` rows are curated by hand
/// and never touched by that sync.
class ChannelRelations extends Table {
  TextColumn get id => text()();
  TextColumn get workspaceId => text()();
  TextColumn get sourceChannelId => text()();
  TextColumn get targetChannelId => text()();
  TextColumn get type => textEnum<ChannelRelationType>()();
  TextColumn get label => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}
