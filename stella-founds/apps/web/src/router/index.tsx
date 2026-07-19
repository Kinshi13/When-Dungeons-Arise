import { lazy } from 'react';

// Lazy-loaded so the initial bundle only pays for the route actually
// visited; every other route code-splits into its own chunk. Dashboard is
// NOT here — it's a static import in AppShell.tsx, since it's the first
// route almost everyone lands on and shouldn't cost an extra chunk fetch
// before first paint (Web Fase 6.5).
export const BillsPage = lazy(() =>
  import('../features/bills/BillsPage').then((m) => ({ default: m.BillsPage })),
);
export const PlaceholderPage = lazy(() =>
  import('../features/placeholder/PlaceholderPage').then((m) => ({ default: m.PlaceholderPage })),
);
