import { StellaCard, StellaSkeleton } from '@stella-founds/stella-ui';
import './DashboardSkeleton.css';

/** Mirrors DashboardPage's real layout (hero card + 3 compact cards, two list cards) so the shimmer never jumps once real data lands. */
export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-hidden="true">
      <div className="dashboard-skeleton__hero">
        <StellaSkeleton width={110} height={13} />
        <StellaSkeleton width={160} height={30} />
      </div>

      <div className="dashboard-page__grid">
        <StellaCard className="dashboard-skeleton__amount-card stella-amount-card--hero">
          <StellaSkeleton width={90} height={13} />
          <StellaSkeleton width={140} height={34} />
        </StellaCard>
        <StellaCard className="dashboard-skeleton__amount-card">
          <StellaSkeleton width={70} height={13} />
          <StellaSkeleton width={90} height={22} />
        </StellaCard>
        <StellaCard className="dashboard-skeleton__amount-card">
          <StellaSkeleton width={80} height={13} />
          <StellaSkeleton width={90} height={22} />
        </StellaCard>
        <StellaCard className="dashboard-skeleton__amount-card">
          <StellaSkeleton width={100} height={13} />
          <StellaSkeleton width={90} height={22} />
        </StellaCard>
      </div>

      <StellaCard className="dashboard-skeleton__list">
        <StellaSkeleton width={140} height={15} />
        {[0, 1, 2].map((i) => (
          <div className="dashboard-skeleton__row" key={i}>
            <StellaSkeleton width="60%" height={14} />
            <StellaSkeleton width={70} height={14} />
          </div>
        ))}
      </StellaCard>
    </div>
  );
}
