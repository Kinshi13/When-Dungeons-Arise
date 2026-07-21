import { useEffect, useState } from 'react';
import type { SyncEngine } from './SyncEngine';
import type { SyncStatusSnapshot } from './SyncTypes';

/** The only way a screen ever touches the SyncEngine — read-only status,
 * never the engine itself. */
export function useSyncStatus(engine: SyncEngine): SyncStatusSnapshot {
  const [snapshot, setSnapshot] = useState(() => engine.getSnapshot());

  useEffect(() => {
    setSnapshot(engine.getSnapshot());
    return engine.subscribe(setSnapshot);
  }, [engine]);

  return snapshot;
}
