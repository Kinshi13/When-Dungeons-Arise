import { StellaCard, StellaSectionHeader, StellaEmptyState } from '@stella-founds/stella-ui';
import { formatCurrency, toDateOnly } from '@stella-founds/core';
import { useDashboardSummary } from './useDashboardSummary';
import './SummaryPanel.css';

/** Desktop right panel / tablet drawer content — no charts yet, just the four headline numbers. */
export function SummaryPanel() {
  const summary = useDashboardSummary();

  return (
    <div className="summary-panel">
      <StellaSectionHeader title="Resumo financeiro" />
      {!summary ? (
        <p>Carregando…</p>
      ) : (
        <div className="summary-panel__list">
          <StellaCard className="summary-panel__row">
            <span className="summary-panel__label">Saldo previsto</span>
            <span className="summary-panel__value">{formatCurrency(summary.previstoAposContas)}</span>
          </StellaCard>
          <StellaCard className="summary-panel__row">
            <span className="summary-panel__label">Entradas</span>
            <span className="summary-panel__value">{formatCurrency(summary.entradasMes)}</span>
          </StellaCard>
          <StellaCard className="summary-panel__row">
            <span className="summary-panel__label">Saídas</span>
            <span className="summary-panel__value">{formatCurrency(summary.saidasMes)}</span>
          </StellaCard>
          <StellaCard className="summary-panel__row">
            <span className="summary-panel__label">Próxima conta</span>
            {summary.proximaConta ? (
              <span className="summary-panel__value">
                {summary.proximaConta.title} · {formatCurrency(summary.proximaConta.amount)} ·{' '}
                {toDateOnly(summary.proximaConta.dueDate ?? summary.proximaConta.createdAt)}
              </span>
            ) : (
              <StellaEmptyState title="Sem contas" message="Nenhuma conta pendente." />
            )}
          </StellaCard>
        </div>
      )}
    </div>
  );
}
