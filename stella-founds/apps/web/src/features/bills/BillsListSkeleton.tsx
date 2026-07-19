import { StellaCard, StellaSkeleton } from '@stella-founds/stella-ui';
import './BillsListSkeleton.css';

/** Mirrors FinanceEntryCard's shape (title/date left, amount/status right) so the shimmer doesn't jump once real entries land. */
export function BillsListSkeleton() {
  return (
    <ul className="bills-list-skeleton" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <StellaCard as="li" className="bills-list-skeleton__row" key={i}>
          <div className="bills-list-skeleton__info">
            <StellaSkeleton width="55%" height={15} />
            <StellaSkeleton width={90} height={12} />
          </div>
          <StellaSkeleton width={70} height={18} />
        </StellaCard>
      ))}
    </ul>
  );
}
