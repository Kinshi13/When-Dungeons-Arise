import {
  ScreenShell,
  StellaAmountCard,
  EntryListCard,
  StellaConstellationDivider,
  PageTransition,
} from '@stella-founds/stella-ui';
import { formatCurrency, toDateOnly, todayIso } from '@stella-founds/core';
import { useDashboardSummary } from './useDashboardSummary';
import './DashboardPage.css';

export function DashboardPage() {
  const summary = useDashboardSummary();
  const today = todayIso();

  if (!summary) {
    return (
      <ScreenShell title="Hoje">
        <p>Carregando seu céu financeiro…</p>
      </ScreenShell>
    );
  }

  const proximaContaDetail = summary.proximaConta
    ? `${summary.proximaConta.title} · vence ${toDateOnly(summary.proximaConta.dueDate ?? today)}`
    : 'Nenhuma conta pendente';

  return (
    <ScreenShell title="Hoje">
      <PageTransition transitionKey="dashboard">
        <div className="dashboard-page__grid">
          <StellaAmountCard
            label="Gasto hoje"
            value={formatCurrency(summary.gastoHoje)}
            tone={summary.gastoHoje > 0 ? 'warning' : 'neutral'}
          />
          <StellaAmountCard
            label="Próxima conta"
            value={summary.proximaConta ? formatCurrency(summary.proximaConta.amount) : '—'}
            detail={proximaContaDetail}
          />
          <StellaAmountCard label="Assinaturas do mês" value={formatCurrency(summary.assinaturasMes)} />
          <StellaAmountCard
            label="Saldo previsto"
            value={formatCurrency(summary.previstoAposContas)}
            tone={summary.previstoAposContas >= 0 ? 'success' : 'danger'}
          />
        </div>

        <StellaConstellationDivider />

        <EntryListCard
          title="Próximos vencimentos"
          entries={summary.proximosVencimentos}
          emptyTitle="Nenhum vencimento por enquanto"
          emptyMessage="Seu céu financeiro está limpo."
          referenceIso={today}
        />

        <EntryListCard
          title="Últimos lançamentos"
          entries={summary.ultimosLancamentos}
          emptyTitle="Nenhum lançamento ainda"
          emptyMessage="Adicione um gasto, conta ou recebimento pelo Stella Core."
          referenceIso={today}
        />
      </PageTransition>
    </ScreenShell>
  );
}
