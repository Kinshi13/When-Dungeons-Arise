import {
  ScreenShell,
  StellaAmountCard,
  EntryListCard,
  StellaConstellationDivider,
  StellaEmptyState,
  StellaButton,
  PageTransition,
} from '@stella-founds/stella-ui';
import { formatCurrency, toDateOnly, todayIso } from '@stella-founds/core';
import { useDashboardSummary } from './DashboardSummaryContext';
import { DashboardHero } from './DashboardHero';
import { DashboardSkeleton } from './DashboardSkeleton';
import './DashboardPage.css';

export function DashboardPage() {
  const { summary, isLoading, error, reload } = useDashboardSummary();
  const today = todayIso();

  if (isLoading) {
    return (
      <ScreenShell title="Hoje" hideHeader>
        <DashboardSkeleton />
      </ScreenShell>
    );
  }

  if (error || !summary) {
    return (
      <ScreenShell title="Hoje" hideHeader>
        <div className="dashboard-page__error">
          <StellaEmptyState
            title="Não foi possível carregar seu céu financeiro"
            message="Verifique sua conexão e tente novamente."
          />
          <StellaButton variant="primary" onClick={reload}>
            Tentar novamente
          </StellaButton>
        </div>
      </ScreenShell>
    );
  }

  const proximaContaDetail = summary.proximaConta
    ? `${summary.proximaConta.title} · vence ${toDateOnly(summary.proximaConta.dueDate ?? today)}`
    : 'Nenhuma conta pendente';

  const dueTodayCount = summary.proximosVencimentos.filter(
    (entry) => toDateOnly(entry.dueDate ?? entry.createdAt) === today,
  ).length;

  return (
    <div className="dashboard-page__content">
      <ScreenShell title="Hoje" hideHeader>
        <DashboardHero dueTodayCount={dueTodayCount} previstoAposContas={summary.previstoAposContas} />

        <PageTransition transitionKey="dashboard">
          <div className="dashboard-page__grid">
            <StellaAmountCard
              size="hero"
              label="Saldo previsto"
              value={formatCurrency(summary.previstoAposContas)}
              tone={summary.previstoAposContas >= 0 ? 'success' : 'danger'}
            />
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
    </div>
  );
}
