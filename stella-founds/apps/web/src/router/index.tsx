import { lazy } from 'react';

// Lazy-loaded so the initial bundle only pays for the Hoje dashboard; every
// other route (still a shared placeholder page) code-splits into its own chunk.
export const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
export const PlaceholderPage = lazy(() =>
  import('../features/placeholder/PlaceholderPage').then((m) => ({ default: m.PlaceholderPage })),
);
