/// The write operation a queued sync entry represents.
enum SyncOperationType { create, update, delete }

/// Local processing state of a queued sync operation. `pending` entries are
/// picked up by the next push; `failed` entries had a permanent error (RLS
/// denial, bad payload) and are surfaced to the user instead of retried
/// forever — see the sync engine's retry policy.
enum SyncQueueStatus { pending, failed }
