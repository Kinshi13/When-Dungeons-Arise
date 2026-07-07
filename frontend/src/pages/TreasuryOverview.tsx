import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, type Bill, type DailySummary, type Expense } from "../api";
import { compareWeek, compareMonth, forecastMonthEndBalance, type PeriodComparison } from "../game/financeAnalysis";
import { buildPendingBillsSummary } from "../game/pendingSummary";
import { PlusIcon } from "../icons";

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ComparisonBadge({ comparison }: { comparison: PeriodComparison }) {
  if (comparison.percentChange === null) return null;
  const rounded = Math.round(comparison.percentChange);
  if (rounded === 0) return <span className="summary-delta neutral">= que antes</span>;
  const up = rounded > 0;
  return (
    <span className={`summary-delta ${up ? "up" : "down"}`}>
      {up ? "▲" : "▼"} {Math.abs(rounded)}% {up ? "a mais" : "a menos"}
    </span>
  );
}

// Retrato rápido das finanças: carteira, resumo hoje/semana/mês/total,
// previsão de saldo do mês e as próximas contas — tudo que hoje ficava
// disperso entre Finanças e Análises, num lugar só, antes de qualquer ação.
export default function TreasuryOverview() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [editingWallet, setEditingWallet] = useState(false);
  const [walletInput, setWalletInput] = useState("");

  async function load() {
    const [expenseItems, summaryItems, billItems, balance] = await Promise.all([
      api.expenses.list(),
      api.dailySummaries.list(),
      api.bills.list(),
      api.wallet.getBalance(),
    ]);
    setExpenses(expenseItems);
    setDailySummaries(summaryItems);
    setBills(billItems);
    setWalletBalance(balance);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSetWalletBase(e: FormEvent) {
    e.preventDefault();
    const value = Number(walletInput.replace(",", "."));
    if (Number.isNaN(value)) return;
    await api.wallet.setBase(value);
    setEditingWallet(false);
    setWalletInput("");
    await load();
  }

  const today = new Date();
  const todayKey = toDateKey(today);
  const todayTotal = useMemo(
    () => expenses.filter((e) => toDateKey(new Date(e.date)) === todayKey).reduce((sum, e) => sum + e.amount, 0),
    [expenses, todayKey]
  );
  const monthTotal = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const weekComparison = useMemo(() => compareWeek(dailySummaries, today), [dailySummaries]);
  const monthComparison = useMemo(() => compareMonth(dailySummaries, today), [dailySummaries]);
  const forecast = useMemo(
    () => forecastMonthEndBalance(walletBalance ?? 0, bills, today),
    [walletBalance, bills]
  );
  const pendingDays = useMemo(() => buildPendingBillsSummary(bills), [bills]);

  return (
    <div className="page">
      <h1>Visão Geral</h1>

      <div className="wallet-card">
        <div>
          <span className="summary-label">Carteira</span>
          <strong className="wallet-balance">{formatBRL(walletBalance ?? 0)}</strong>
        </div>
        {!editingWallet && (
          <button className="small" onClick={() => setEditingWallet(true)}>
            Ajustar saldo
          </button>
        )}
      </div>
      {editingWallet && (
        <form onSubmit={handleSetWalletBase} className="form wallet-adjust-form">
          <input
            inputMode="decimal"
            placeholder="Saldo real atual (R$)"
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            autoFocus
          />
          <button type="submit" className="icon-btn primary" aria-label="Confirmar saldo">
            <PlusIcon width={16} height={16} />
          </button>
          <button type="button" className="small" onClick={() => setEditingWallet(false)}>
            Cancelar
          </button>
        </form>
      )}

      <div className="finance-summary">
        <div className="summary-card">
          <span className="summary-label">Hoje</span>
          <strong className="summary-value">{formatBRL(todayTotal)}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Esta semana</span>
          <strong className="summary-value">{formatBRL(weekComparison.currentTotal)}</strong>
          <ComparisonBadge comparison={weekComparison} />
        </div>
        <div className="summary-card">
          <span className="summary-label">Este mês</span>
          <strong className="summary-value">{formatBRL(monthComparison.currentTotal)}</strong>
          <ComparisonBadge comparison={monthComparison} />
        </div>
        <div className="summary-card">
          <span className="summary-label">Total</span>
          <strong className="summary-value">{formatBRL(monthTotal)}</strong>
        </div>
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
        <h2>Próximas contas</h2>
        {pendingDays.length === 0 && <p className="hint">Nenhuma conta pendente à vista.</p>}
        <div className="list">
          {pendingDays.map((day) => (
            <Link key={day.dateKey} to="/tesouraria/contas" className="reminder-item">
              <div>
                <strong>{day.label}</strong>
                <div className="meta">
                  {day.count} conta{day.count === 1 ? "" : "s"}
                </div>
              </div>
              <strong>{formatBRL(day.totalAmount)}</strong>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
