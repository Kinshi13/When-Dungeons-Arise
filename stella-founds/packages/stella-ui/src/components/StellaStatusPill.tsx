import type { FinanceStatus } from '@stella-founds/core';
import './StellaStatusPill.css';

const labels: Record<FinanceStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  received: 'Recebido',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
};

export function StellaStatusPill({ status }: { status: FinanceStatus }) {
  return <span className={`stella-status-pill stella-status-pill--${status}`}>{labels[status]}</span>;
}
