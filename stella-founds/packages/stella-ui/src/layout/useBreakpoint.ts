import { useEffect, useState } from 'react';
import { shellBreakpoints } from '../tokens/breakpoints';

export type StellaBreakpoint = 'mobile' | 'tablet' | 'desktop';

function resolveBreakpoint(width: number): StellaBreakpoint {
  if (width < parseInt(shellBreakpoints.tablet, 10)) return 'mobile';
  if (width < parseInt(shellBreakpoints.desktop, 10)) return 'tablet';
  return 'desktop';
}

/**
 * Tracks the current Stella breakpoint (mobile / tablet / desktop) from the
 * shared token thresholds, so layout decisions never hardcode a device size.
 * Desktop starts at 1440px per the Web App Shell spec; tablet covers
 * 768–1439px; mobile is anything below.
 */
export function useBreakpoint(): StellaBreakpoint {
  const [breakpoint, setBreakpoint] = useState<StellaBreakpoint>(() =>
    typeof window === 'undefined' ? 'desktop' : resolveBreakpoint(window.innerWidth),
  );

  useEffect(() => {
    function handleResize() {
      setBreakpoint(resolveBreakpoint(window.innerWidth));
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}
