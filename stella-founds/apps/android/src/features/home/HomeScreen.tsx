import {
  ScreenShell,
  StellaAmountCard,
  EntryListCard,
  StellaConstellationDivider,
  SyncIndicator,
} from '@stella-founds/stella-ui';
import { formatCurrency, toDateOnly, todayIso, useAppContainer, useSyncStatus } from '@stella-founds/core';
import { useHomeSummary } from './useHomeSummary';
import './HomeScreen.css';

export function HomeScreen() {
  const summary = useHomeSummary();
  const today = todayIso();
  const { syncEngine } = useAppContainer();
  const syncStatus = useSyncStatus(syncEngine);

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
    <ScreenShell title="Hoje" action={<SyncIndicator status={syncStatus} />}>
      <div className="home-screen__grid">
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
        <StellaAmountCard
          label="Assinaturas do mês"
          value={formatCurrency(summary.assinaturasMes)}
        />
        <StellaAmountCard
          label="Previsto após contas"
          value={formatCurrency(summary.previstoAposContas)}
          tone={summary.previstoAposContas >= 0 ? 'success' : 'danger'}
        />
      </div>

      <StellaConstellationDivider />

      {summary.alertas.length > 0 && (
        <EntryListCard
          title="Alertas financeiros"
          entries={summary.alertas}
          emptyTitle=""
          emptyMessage=""
          referenceIso={today}
        />
      )}

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
    </ScreenShell>
  );
}
