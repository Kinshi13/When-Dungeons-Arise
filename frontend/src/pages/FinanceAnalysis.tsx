import { useEffect, useMemo, useState } from "react";
import { api, type Bill, type DailySummary, type Expense } from "../api";
import {
  compareWeek,
  compareMonth,
  findFrequentExpenses,
  superficialTotal,
  forecastMonthEndBalance,
  type PeriodComparison,
} from "../core/domain/financeAnalysis";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ComparisonCard({ title, comparison }: { title: string; comparison: PeriodComparison }) {
  const rounded = comparison.percentChange === null ? null : Math.round(comparison.percentChange);
  const up = rounded !== null && rounded > 0;
  return (
    <div className="analysis-card">
      <span className="summary-label">{title}</span>
      <strong className="summary-value">{formatBRL(comparison.currentTotal)}</strong>
      <p className="hint">
        Período anterior: {formatBRL(comparison.previousTotal)}
        {rounded !== null && rounded !== 0 && (
          <span className={`summary-delta ${up ? "up" : "down"}`}>
            {" "}
            {up ? "▲" : "▼"} {Math.abs(rounded)}% {up ? "a mais" : "a menos"}
          </span>
        )}
        {rounded === 0 && <span className="summary-delta neutral"> = que antes</span>}
      </p>
    </div>
  );
}

export default function FinanceAnalysis() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    Promise.all([api.expenses.list(), api.dailySummaries.list(), api.bills.list(), api.wallet.getBalance()]).then(
      ([e, s, b, balance]) => {
        setExpenses(e);
        setDailySummaries(s);
        setBills(b);
        setWalletBalance(balance);
      }
    );
  }, []);

  const today = new Date();
  const weekComparison = useMemo(() => compareWeek(dailySummaries, today), [dailySummaries]);
  const monthComparison = useMemo(() => compareMonth(dailySummaries, today), [dailySummaries]);
  const forecast = useMemo(() => forecastMonthEndBalance(walletBalance, bills, today), [walletBalance, bills]);

  const monthStart = useMemo(() => {
    const d = new Date(today);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const frequentExpenses = useMemo(() => {
    const since = new Date(today);
    since.setDate(since.getDate() - 30);
    return findFrequentExpenses(expenses, since);
  }, [expenses]);
  const savingsPotential = useMemo(() => superficialTotal(expenses, monthStart, today), [expenses]);

  return (
    <div className="page">
      <h1>Análises</h1>
      <p className="hint">
        Compare seus gastos, veja o que se repete com frequência e quanto dá pra economizar cortando
        os itens marcados como supérfluos.
      </p>

      <div className="analysis-grid">
        <ComparisonCard title="Esta semana" comparison={weekComparison} />
        <ComparisonCard title="Este mês" comparison={monthComparison} />
      </div>

      <section className="mission-section">
        <h2>Previsão de saldo</h2>
        <div className={`analysis-savings-card${forecast.projectedBalance < 0 ? " warning" : ""}`}>
          <strong className="summary-value">{formatBRL(forecast.projectedBalance)}</strong>
          <p className="hint">
            Saldo atual {formatBRL(forecast.currentBalance)}
            {forecast.pendingOut > 0 && <> − {formatBRL(forecast.pendingOut)} em contas a pagar este mês</>}
            {forecast.pendingIn > 0 && <> + {formatBRL(forecast.pendingIn)} a receber este mês</>}.
          </p>
          {forecast.projectedBalance < 0 && (
            <p className="error">Atenção: suas contas pendentes ultrapassam o saldo disponível.</p>
          )}
        </div>
      </section>

      <section className="mission-section">
        <h2>Potencial de economia</h2>
        <div className="analysis-savings-card">
          <strong className="summary-value">{formatBRL(savingsPotential)}</strong>
          <p className="hint">
            {savingsPotential > 0
              ? "É quanto você economizaria este mês cortando os gastos marcados como supérfluos."
              : "Marque um gasto como \"Superficial\" na aba Movimentos pra começar a acompanhar seu potencial de economia."}
          </p>
        </div>
      </section>

      <section className="mission-section">
        <h2>Gastos frequentes (últimos 30 dias)</h2>
        {frequentExpenses.length === 0 && (
          <p className="hint">Nenhum gasto se repetiu 3 vezes ou mais nos últimos 30 dias.</p>
        )}
        <div className="list">
          {frequentExpenses.map((item) => (
            <div key={item.description} className="reminder-item">
              <div>
                <strong>{item.description}</strong>
                <div className="meta">{item.count}x no período</div>
              </div>
              <strong>{formatBRL(item.total)}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
