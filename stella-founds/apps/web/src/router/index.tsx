import { lazy } from 'react';

// Lazy-loaded so the initial bundle only pays for the route actually
// visited; every other route code-splits into its own chunk.
export const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
export const BillsPage = lazy(() =>
  import('../features/bills/BillsPage').then((m) => ({ default: m.BillsPage })),
);
export const PlaceholderPage = lazy(() =>
  import('../features/placeholder/PlaceholderPage').then((m) => ({ default: m.PlaceholderPage })),
);
