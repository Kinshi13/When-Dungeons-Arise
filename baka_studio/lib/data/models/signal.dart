enum SignalType { ideia, bug, conteudo, musica, nota, link, imagem, voz }

extension SignalTypeLabel on SignalType {
  String get label => switch (this) {
    SignalType.ideia => 'Ideia',
    SignalType.bug => 'Bug',
    SignalType.conteudo => 'Conteúdo',
    SignalType.musica => 'Música',
    SignalType.nota => 'Nota',
    SignalType.link => 'Link',
    SignalType.imagem => 'Imagem',
    SignalType.voz => 'Voz',
  };
}

/// A "sinal" — a raw, unclassified capture waiting to be processed into a
/// channel, project, or content item.
class Signal {
  Signal({
    required this.id,
    required this.workspaceId,
    required this.type,
    required this.title,
    this.body = '',
    this.source,
    this.channelId,
    this.processed = false,
    this.processedAt,
    this.convertedEntityType,
    this.convertedEntityId,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String workspaceId;
  final SignalType type;
  final String title;
  final String body;
  final String? source;
  final String? channelId;
  bool processed;
  DateTime? processedAt;

  /// What the signal became once processed — "content", "task", "project" —
  /// so the conversion stays traceable instead of just vanishing.
  String? convertedEntityType;
  String? convertedEntityId;
  final DateTime createdAt;
  DateTime updatedAt;

  DateTime get receivedAt => createdAt;
}
