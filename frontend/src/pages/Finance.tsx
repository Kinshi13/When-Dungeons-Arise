import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api, type DailySummary, type Expense } from "../api";
import { compareWeek, compareMonth, type PeriodComparison } from "../game/financeAnalysis";
import { TrashIcon, PlusIcon } from "../icons";

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

export default function Finance() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [editingWallet, setEditingWallet] = useState(false);
  const [walletInput, setWalletInput] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [installments, setInstallments] = useState("1");
  const [superficial, setSuperficial] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [expenseItems, summaryItems, balance] = await Promise.all([
      api.expenses.list(),
      api.dailySummaries.list(),
      api.wallet.getBalance(),
    ]);
    setExpenses(expenseItems);
    setDailySummaries(summaryItems);
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(amount.replace(",", "."));
    if (!value || value <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    const installmentTotal = Math.max(1, Math.round(Number(installments)) || 1);
    try {
      await api.expenses.create({
        amount: value,
        description: description || undefined,
        installments: installmentTotal,
        superficial,
      });
      setAmount("");
      setDescription("");
      setInstallments("1");
      setSuperficial(false);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: string) {
    await api.expenses.remove(id);
    await load();
  }

  const groups = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const exp of expenses) {
      const key = toDateKey(new Date(exp.date));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(exp);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [expenses]);

  const today = new Date();
  const todayKey = toDateKey(today);
  const todayTotal = groups.find(([key]) => key === todayKey)?.[1]
    .reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const monthTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const weekComparison = useMemo(() => compareWeek(dailySummaries, today), [dailySummaries]);
  const monthComparison = useMemo(() => compareMonth(dailySummaries, today), [dailySummaries]);

  return (
    <div className="page">
      <h1>Finanças</h1>

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

      <form onSubmit={handleSubmit} className="form">
        <input
          inputMode="decimal"
          placeholder="Valor (R$)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input
          placeholder="Descrição (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="Parcelas"
          value={installments}
          onChange={(e) => setInstallments(e.target.value)}
          title="Em quantas vezes esse gasto foi parcelado"
        />
        <label className="slider-row expense-superficial-row">
          <span>Superficial (dá pra cortar)</span>
          <input type="checkbox" checked={superficial} onChange={(e) => setSuperficial(e.target.checked)} />
        </label>
        <button type="submit" className="icon-btn primary" aria-label="Registrar gasto">
          <PlusIcon width={18} height={18} />
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      {groups.map(([key, items]) => {
        const dayTotal = items.reduce((sum, e) => sum + e.amount, 0);
        return (
          <section key={key} className="expense-day">
            <div className="expense-day-header">
              <h2>
                {new Date(`${key}T00:00:00`).toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </h2>
              <strong>{formatBRL(dayTotal)}</strong>
            </div>
            <ul className="list">
              {items.map((exp) => (
                <li key={exp.id} className="reminder-item">
                  <div>
                    <strong>{formatBRL(exp.amount)}</strong>
                    {exp.description && <div className="meta">{exp.description}</div>}
                    {!!exp.installmentTotal && exp.installmentTotal > 1 && (
                      <div className="meta">
                        Parcela {exp.installmentIndex}/{exp.installmentTotal}
                      </div>
                    )}
                    {exp.superficial && <span className="expense-superficial-badge">Superficial</span>}
                  </div>
                  <button className="icon-btn" onClick={() => handleDelete(exp.id)} aria-label="Excluir gasto">
                    <TrashIcon width={18} height={18} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {groups.length === 0 && <p className="hint">Nenhum gasto registrado ainda.</p>}
    </div>
  );
}
