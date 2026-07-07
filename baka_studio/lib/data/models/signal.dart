enum SignalType { ideia, bug, conteudo, musica, nota, link }

extension SignalTypeLabel on SignalType {
  String get label => switch (this) {
    SignalType.ideia => 'Ideia',
    SignalType.bug => 'Bug',
    SignalType.conteudo => 'Conteúdo',
    SignalType.musica => 'Música',
    SignalType.nota => 'Nota',
    SignalType.link => 'Link',
  };
}

/// A "sinal" — a raw, unclassified capture waiting to be processed into a
/// channel, project, or content item.
class Signal {
  Signal({
    required this.id,
    required this.type,
    required this.text,
    required this.receivedAt,
    this.channelId,
    this.processed = false,
  });

  final String id;
  final SignalType type;
  final String text;
  final DateTime receivedAt;
  final String? channelId;
  bool processed;
}
