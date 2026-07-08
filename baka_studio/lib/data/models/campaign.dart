enum CampaignStatus { planning, active, paused, completed, archived }

extension CampaignStatusLabel on CampaignStatus {
  String get label => switch (this) {
    CampaignStatus.planning => 'Planejamento',
    CampaignStatus.active => 'Ativa',
    CampaignStatus.paused => 'Pausada',
    CampaignStatus.completed => 'Concluída',
    CampaignStatus.archived => 'Arquivada',
  };
}

enum CampaignItemEntityType { content, task, project }

/// A campaign is a "sistema" — a bundle of related entities driving a
/// single push (a launch, a series). The entities themselves (productions,
/// tasks, projects) are linked via [CampaignItem], not duplicated here.
class Campaign {
  const Campaign({
    required this.id,
    required this.workspaceId,
    required this.name,
    this.description = '',
    required this.status,
    this.startDate,
    this.endDate,
    this.primaryChannelId,
    required this.createdAt,
    required this.updatedAt,
    this.archivedAt,
  });

  final String id;
  final String workspaceId;
  final String name;
  final String description;
  final CampaignStatus status;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? primaryChannelId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? archivedAt;

  bool get isArchived => archivedAt != null;
}

/// One entity attached to a [Campaign] — a production, a task, or a project.
class CampaignItem {
  const CampaignItem({
    required this.id,
    required this.campaignId,
    required this.entityType,
    required this.entityId,
    this.sortOrder = 0,
  });

  final String id;
  final String campaignId;
  final CampaignItemEntityType entityType;
  final String entityId;
  final int sortOrder;
}
