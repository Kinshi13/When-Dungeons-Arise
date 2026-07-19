import { ScreenShell, StellaEmptyState, PageTransition } from '@stella-founds/stella-ui';

/** Shared stand-in for every area besides Hoje — Web Fase 2 builds only the dashboard; the other screens arrive in a later phase. */
export function PlaceholderPage({ title, transitionKey }: { title: string; transitionKey?: string }) {
  return (
    <ScreenShell title={title}>
      <PageTransition transitionKey={transitionKey}>
        <StellaEmptyState title="Em construção" message="Esta área chega em uma próxima fase da Web." />
      </PageTransition>
    </ScreenShell>
  );
}
