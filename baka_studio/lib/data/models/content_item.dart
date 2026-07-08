enum ContentStage {
  inbox,
  ideia,
  pesquisa,
  roteiro,
  prontoParaGravar,
  gravando,
  editando,
  thumb,
  revisao,
  agendado,
  publicado,
  arquivado,
}

extension ContentStageLabel on ContentStage {
  String get label => switch (this) {
    ContentStage.inbox => 'Inbox',
    ContentStage.ideia => 'Ideia',
    ContentStage.pesquisa => 'Pesquisa',
    ContentStage.roteiro => 'Roteiro',
    ContentStage.prontoParaGravar => 'Pronto p/ gravar',
    ContentStage.gravando => 'Gravando',
    ContentStage.editando => 'Editando',
    ContentStage.thumb => 'Thumb',
    ContentStage.revisao => 'Revisão',
    ContentStage.agendado => 'Agendado',
    ContentStage.publicado => 'Publicado',
    ContentStage.arquivado => 'Arquivado',
  };
}

enum ContentPriority { low, medium, high }

extension ContentPriorityLabel on ContentPriority {
  String get label => switch (this) {
    ContentPriority.low => 'Baixa',
    ContentPriority.medium => 'Média',
    ContentPriority.high => 'Alta',
  };
}

enum ContentFormat { video, short, post, thumbnail, musica, roteiro, documento }

extension ContentFormatLabel on ContentFormat {
  String get label => switch (this) {
    ContentFormat.video => 'Vídeo',
    ContentFormat.short => 'Short',
    ContentFormat.post => 'Post',
    ContentFormat.thumbnail => 'Thumbnail',
    ContentFormat.musica => 'Música',
    ContentFormat.roteiro => 'Roteiro',
    ContentFormat.documento => 'Documento',
  };
}

/// A "produção" — a piece of content moving through the editorial pipeline.
/// Can belong to more than one channel (N:N via [channelIds]) — e.g. a
/// collaboration between Baka Code and Baka Phone.
class ContentItem {
  const ContentItem({
    required this.id,
    required this.workspaceId,
    required this.title,
    this.description = '',
    required this.channelIds,
    required this.format,
    required this.stage,
    required this.priority,
    this.projectId,
    this.dueDate,
    this.publishedAt,
    this.platform,
    this.notes = '',
    required this.createdAt,
    required this.updatedAt,
    this.archivedAt,
  });

  final String id;
  final String workspaceId;
  final String title;
  final String description;
  final List<String> channelIds;
  final String? projectId;
  final ContentFormat format;
  final ContentStage stage;
  final ContentPriority priority;
  final DateTime? dueDate;
  final DateTime? publishedAt;
  final String? platform;
  final String notes;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? archivedAt;

  bool get isArchived => archivedAt != null;

  /// First channel — used where the UI only has room for one badge.
  String get primaryChannelId => channelIds.first;

  ContentItem copyWith({
    String? title,
    String? description,
    List<String>? channelIds,
    ContentFormat? format,
    ContentStage? stage,
    ContentPriority? priority,
    String? projectId,
    DateTime? dueDate,
    DateTime? publishedAt,
    String? platform,
    String? notes,
    DateTime? updatedAt,
    DateTime? archivedAt,
  }) {
    return ContentItem(
      id: id,
      workspaceId: workspaceId,
      title: title ?? this.title,
      description: description ?? this.description,
      channelIds: channelIds ?? this.channelIds,
      format: format ?? this.format,
      stage: stage ?? this.stage,
      priority: priority ?? this.priority,
      projectId: projectId ?? this.projectId,
      dueDate: dueDate ?? this.dueDate,
      publishedAt: publishedAt ?? this.publishedAt,
      platform: platform ?? this.platform,
      notes: notes ?? this.notes,
      createdAt: createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
      archivedAt: archivedAt ?? this.archivedAt,
    );
  }
}
