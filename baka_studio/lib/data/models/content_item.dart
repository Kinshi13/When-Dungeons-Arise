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
class ContentItem {
  const ContentItem({
    required this.id,
    required this.title,
    required this.channelId,
    required this.format,
    required this.stage,
    required this.priority,
    this.projectId,
    this.dueDate,
    this.platform,
  });

  final String id;
  final String title;
  final String channelId;
  final String? projectId;
  final ContentFormat format;
  final ContentStage stage;
  final ContentPriority priority;
  final DateTime? dueDate;
  final String? platform;

  ContentItem copyWith({ContentStage? stage}) {
    return ContentItem(
      id: id,
      title: title,
      channelId: channelId,
      format: format,
      stage: stage ?? this.stage,
      priority: priority,
      projectId: projectId,
      dueDate: dueDate,
      platform: platform,
    );
  }
}
