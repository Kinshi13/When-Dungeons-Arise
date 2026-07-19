import { useEffect, useState } from 'react';

/**
 * Tracks browser connectivity. The app is local-first (IndexedDB via Core),
 * so this never blocks anything — it only drives a small "offline" hint so
 * the user knows changes are staying on-device until they're back online,
 * ahead of the future sync layer (see packages/core/src/sync).
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
