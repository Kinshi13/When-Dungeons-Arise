import { greetingForHour, longDateFormatter } from '../../lib/greeting';
import './DashboardHero.css';

/**
 * Builds the "Atlas observou" lines from data already on hand — no new
 * data source, just a different way of saying what the four cards below
 * already show. Web Fase 6.8: the Home stopped reading like a data table
 * and started reading like Atlas is actually looking at it with you.
 */
function buildObservations(dueTodayCount: number, previstoAposContas: number): string[] {
  const lines: string[] = [];
  lines.push(dueTodayCount === 0 ? 'Nenhuma conta vence hoje.' : `${dueTodayCount} movimentação(ões) vencem hoje.`);
  lines.push(previstoAposContas >= 0 ? 'Saldo previsto positivo.' : 'Saldo previsto negativo — vale atenção.');
  return lines;
}

/**
 * The Dashboard's own top-of-page hero — replaces the plain "Hoje" title
 * with a greeting, date and Atlas's short read of the day. Only used here
 * (not the shared Header, which stays the compact desktop/tablet shell
 * bar) since mobile has no Header at all and still needs this.
 */
export function DashboardHero({
  dueTodayCount,
  previstoAposContas,
}: {
  dueTodayCount: number;
  previstoAposContas: number;
}) {
  const now = new Date();
  const observations = buildObservations(dueTodayCount, previstoAposContas);

  return (
    <div className="dashboard-hero">
      <span className="dashboard-hero__eyebrow">✦ Hoje</span>
      <h1 className="dashboard-hero__greeting">{greetingForHour(now.getHours())}</h1>
      <span className="dashboard-hero__date">{longDateFormatter.format(now)}</span>

      <div className="dashboard-hero__atlas">
        <span className="dashboard-hero__atlas-label">Atlas observou</span>
        <ul className="dashboard-hero__atlas-list">
          {observations.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
