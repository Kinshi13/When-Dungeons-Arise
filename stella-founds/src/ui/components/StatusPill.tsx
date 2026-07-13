import type { FinanceStatus } from '../../core/models';
import './StatusPill.css';

const labels: Record<FinanceStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  received: 'Recebido',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
};

export function StatusPill({ status }: { status: FinanceStatus }) {
  return <span className={`status-pill status-pill--${status}`}>{labels[status]}</span>;
}
