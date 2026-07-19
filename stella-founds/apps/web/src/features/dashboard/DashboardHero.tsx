import { greetingForHour, longDateFormatter } from '../../lib/greeting';
import './DashboardHero.css';

function contextLine(dueTodayCount: number): string {
  if (dueTodayCount === 0) return 'Nenhuma conta vence hoje.';
  if (dueTodayCount === 1) return 'Hoje você possui 1 movimentação planejada.';
  return `Hoje você possui ${dueTodayCount} movimentações planejadas.`;
}

/**
 * The Dashboard's own top-of-page hero — replaces the plain "Hoje" title
 * with a greeting, date and a short human sentence about the day. Only
 * used here (not the shared Header, which stays the compact desktop/tablet
 * shell bar) since mobile has no Header at all and still needs this.
 */
export function DashboardHero({ dueTodayCount }: { dueTodayCount: number }) {
  const now = new Date();

  return (
    <div className="dashboard-hero">
      <span className="dashboard-hero__eyebrow">✦ Hoje</span>
      <h1 className="dashboard-hero__greeting">{greetingForHour(now.getHours())}</h1>
      <div className="dashboard-hero__meta">
        <span className="dashboard-hero__date">{longDateFormatter.format(now)}</span>
        <span className="dashboard-hero__context">{contextLine(dueTodayCount)}</span>
      </div>
    </div>
  );
}
