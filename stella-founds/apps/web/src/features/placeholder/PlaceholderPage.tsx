import {
  ScreenShell,
  StellaEmptyState,
  PageTransition,
  CardConstellation,
  constellationSignature,
} from '@stella-founds/stella-ui';
import './PlaceholderPage.css';

// One signature per area, so a placeholder still carries the same identity
// its finished screen will have (Web Fase 6.9 section 16 — no screen may
// look undressed relative to the rest of the app).
const signatureByTitle: Record<string, number> = {
  Calendário: constellationSignature.calendario,
  Relatórios: constellationSignature.relatorios,
  Configurações: constellationSignature.configuracoes,
};

/** Shared stand-in for every area besides Hoje — Web Fase 2 builds only the dashboard; the other screens arrive in a later phase. */
export function PlaceholderPage({ title, transitionKey }: { title: string; transitionKey?: string }) {
  return (
    <ScreenShell title={title}>
      <PageTransition transitionKey={transitionKey}>
        <div className="placeholder-page__surface">
          <CardConstellation variant={signatureByTitle[title] ?? 0} />
          <StellaEmptyState title="Em construção" message="Esta área chega em uma próxima fase da Web." />
        </div>
      </PageTransition>
    </ScreenShell>
  );
}
