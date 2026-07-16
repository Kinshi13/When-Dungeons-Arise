import type { ReactNode } from 'react';
import { useBreakpoint } from './useBreakpoint';

/**
 * Picks exactly one of `desktop` / `tablet` / `mobile` based on the current
 * Stella shell breakpoint and renders it — no layout is ever mounted twice,
 * so there is nothing to keep in sync between breakpoints beyond the shared
 * `items`/data passed into each slot by the caller.
 */
export function ResponsiveContainer({
  desktop,
  tablet,
  mobile,
}: {
  desktop: ReactNode;
  tablet: ReactNode;
  mobile: ReactNode;
}) {
  const breakpoint = useBreakpoint();

  if (breakpoint === 'desktop') return <>{desktop}</>;
  if (breakpoint === 'tablet') return <>{tablet}</>;
  return <>{mobile}</>;
}
