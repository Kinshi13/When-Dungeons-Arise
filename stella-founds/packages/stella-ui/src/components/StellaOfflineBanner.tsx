import { useOnlineStatus } from '../hooks/useOnlineStatus';
import './StellaOfflineBanner.css';

/**
 * A small persistent-until-resolved strip — distinct from StellaToast,
 * which is transient and for one-off feedback. The app works fully
 * offline (local-first via IndexedDB), so this is purely informational:
 * it never blocks anything, just sets expectations ahead of the future
 * sync layer (see packages/core/src/sync).
 */
export function StellaOfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="stella-offline-banner" role="status">
      <span className="stella-offline-banner__dot" aria-hidden="true" />
      Você está offline — suas alterações continuam sendo salvas neste dispositivo.
    </div>
  );
}
