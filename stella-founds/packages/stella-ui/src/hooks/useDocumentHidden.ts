import { useEffect, useState } from 'react';

/** Tracks document.hidden (tab backgrounded / switched away) via the Page Visibility API. */
export function useDocumentHidden(): boolean {
  const [isHidden, setIsHidden] = useState(() => (typeof document === 'undefined' ? false : document.hidden));

  useEffect(() => {
    function handleVisibilityChange() {
      setIsHidden(document.hidden);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isHidden;
}
