import type { ReactNode } from 'react';
import { StellaCard } from '../components/StellaCard';
import './StellaAmountCard.css';

export type StellaAmountCardTone = 'neutral' | 'success' | 'warning' | 'danger';

export function StellaAmountCard({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: StellaAmountCardTone;
}) {
  return (
    <StellaCard className={`stella-amount-card stella-amount-card--${tone}`}>
      <span className="stella-amount-card__label">{label}</span>
      <span className="stella-amount-card__value">{value}</span>
      {detail && <span className="stella-amount-card__detail">{detail}</span>}
    </StellaCard>
  );
}
