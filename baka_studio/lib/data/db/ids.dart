import 'package:uuid/uuid.dart';

const _uuid = Uuid();

/// Every entity in the app gets one of these instead of a list index, a
/// title, or a temporary hash — stable across renames and ready for a
/// future remote sync (where the same id becomes the sync key).
String newId() => _uuid.v4();
