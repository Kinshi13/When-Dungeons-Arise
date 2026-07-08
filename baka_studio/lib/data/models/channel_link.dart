enum ChannelRelationType { sharedProject, sharedCampaign, contentDerivation, strategic, custom }

extension ChannelRelationTypeLabel on ChannelRelationType {
  String get label => switch (this) {
    ChannelRelationType.sharedProject => 'Projeto compartilhado',
    ChannelRelationType.sharedCampaign => 'Campanha compartilhada',
    ChannelRelationType.contentDerivation => 'Conteúdo derivado',
    ChannelRelationType.strategic => 'Vínculo estratégico',
    ChannelRelationType.custom => 'Conexão manual',
  };
}

/// A real relationship between two channels — never decorative. Relations
/// of type [ChannelRelationType.sharedProject]/[sharedCampaign] are derived
/// automatically by the repository from real shared projects/campaigns;
/// [strategic]/[custom] ones are stored as-is (manually curated).
class ChannelLink {
  const ChannelLink({
    this.id,
    required this.channelIdA,
    required this.channelIdB,
    required this.type,
    this.relation,
  });

  final String? id;
  final String channelIdA;
  final String channelIdB;
  final ChannelRelationType type;

  /// Short, honest description of the real link (e.g. "Baka Studio
  /// documenta o processo de criação musical da Stella7"). Falls back to
  /// [ChannelRelationType.label] when not set.
  final String? relation;

  String get description => relation ?? type.label;

  bool involves(String channelId) => channelIdA == channelId || channelIdB == channelId;

  String? other(String channelId) {
    if (channelIdA == channelId) return channelIdB;
    if (channelIdB == channelId) return channelIdA;
    return null;
  }
}
