import { ScreenShell } from '../../ui/components/ScreenShell';
import { AmountCard } from '../../ui/cards/AmountCard';
import { EntryListCard } from '../../ui/cards/EntryListCard';
import { formatCurrency } from '../../core/utils/currency';
import { toDateOnly, todayIso } from '../../core/utils/date';
import { useHomeSummary } from './useHomeSummary';
import './HomeScreen.css';

export function HomeScreen() {
  const summary = useHomeSummary();
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
      <div className="home-screen__grid">
        <AmountCard
          label="Gasto hoje"
          value={formatCurrency(summary.gastoHoje)}
          tone={summary.gastoHoje > 0 ? 'warning' : 'neutral'}
        />
        <AmountCard
          label="Próxima conta"
          value={summary.proximaConta ? formatCurrency(summary.proximaConta.amount) : '—'}
          detail={proximaContaDetail}
        />
        <AmountCard
          label="Assinaturas do mês"
          value={formatCurrency(summary.assinaturasMes)}
        />
        <AmountCard
          label="Previsto após contas"
          value={formatCurrency(summary.previstoAposContas)}
          tone={summary.previstoAposContas >= 0 ? 'success' : 'danger'}
        />
      </div>

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
