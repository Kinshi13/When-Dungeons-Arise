import type { ReactNode } from 'react';
import { StellaCard } from '../components/StellaCard';
import { CardConstellation, constellationSeedFromString } from '../components/CardConstellation';
import { useFlashOnChange } from '../hooks/useFlashOnChange';
import './StellaAmountCard.css';

export type StellaAmountCardTone = 'neutral' | 'success' | 'warning' | 'danger';
export type StellaAmountCardSize = 'default' | 'hero';

export function StellaAmountCard({
  label,
  value,
  detail,
  tone = 'neutral',
  size = 'default',
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: StellaAmountCardTone;
  /** 'hero' gives the card more weight (larger value, more padding) — for the one figure that matters most in a composition, not for uniform grids. */
  size?: StellaAmountCardSize;
}) {
  const isUpdating = useFlashOnChange(value);

  return (
    <StellaCard
      className={`stella-amount-card stella-amount-card--${tone} stella-amount-card--${size}`}
    >
      <CardConstellation variant={constellationSeedFromString(label)} />
      <span className="stella-amount-card__label">{label}</span>
      <span className={`stella-amount-card__value${isUpdating ? ' is-updating' : ''}`}>{value}</span>
      {detail && <span className="stella-amount-card__detail">{detail}</span>}
    </StellaCard>
  );
}
