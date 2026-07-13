import type { ReactNode } from 'react';
import './AmountCard.css';

export type AmountCardTone = 'neutral' | 'success' | 'warning' | 'danger';

export function AmountCard({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: AmountCardTone;
}) {
  return (
    <div className={`amount-card amount-card--${tone}`}>
      <span className="amount-card__label">{label}</span>
      <span className="amount-card__value">{value}</span>
      {detail && <span className="amount-card__detail">{detail}</span>}
    </div>
  );
}
