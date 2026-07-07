enum OrbitEventType { gravacao, publicacao, prazo, campanha }

extension OrbitEventTypeLabel on OrbitEventType {
  String get label => switch (this) {
    OrbitEventType.gravacao => 'Gravação',
    OrbitEventType.publicacao => 'Publicação',
    OrbitEventType.prazo => 'Prazo',
    OrbitEventType.campanha => 'Campanha',
  };
}

/// A single dated event on the editorial calendar ("Órbita").
class OrbitEvent {
  const OrbitEvent({
    required this.id,
    required this.title,
    required this.channelId,
    required this.date,
    required this.type,
  });

  final String id;
  final String title;
  final String channelId;
  final DateTime date;
  final OrbitEventType type;
}
