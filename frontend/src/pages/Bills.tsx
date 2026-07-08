import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api, type Bill, type BillKind, type BillType, type Expense } from "../api";
import { TrashIcon, PlusIcon } from "../icons";

const typeLabel: Record<BillType, string> = {
  CARTAO: "Cartão",
  BOLETO: "Boleto",
  ASSINATURA: "Assinatura",
  OUTRO: "Outro",
};

const kindLabel: Record<BillKind, string> = {
  PAGAR: "A pagar",
  RECEBER: "A receber",
  ASSINATURA: "Assinatura",
};

type Filter = "vencimentos" | "pagar" | "pagas" | "receber" | "assinaturas" | "recorrentes";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "vencimentos", label: "Próximos vencimentos" },
  { key: "pagar", label: "A pagar" },
  { key: "pagas", label: "Pagas" },
  { key: "receber", label: "A receber" },
  { key: "assinaturas", label: "Assinaturas" },
  { key: "recorrentes", label: "Recorrentes" },
];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function daysUntil(dateStr: string) {
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyClass(days: number) {
  if (days <= 1) return "urgency-critical";
  if (days <= 5) return "urgency-high";
  if (days <= 10) return "urgency-medium";
  return "urgency-low";
}

export default function Bills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<Filter>("vencimentos");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [type, setType] = useState<BillType>("OUTRO");
  const [kind, setKind] = useState<BillKind>("PAGAR");
  const [recurring, setRecurring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [billsData, expensesData] = await Promise.all([api.bills.list(), api.expenses.list()]);
    setBills(billsData);
    setExpenses(expensesData);
  }

  useEffect(() => {
    load();
  }, []);

  const monthExpensesTotal = useMemo(() => {
    const now = new Date();
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(amount.replace(",", "."));
    if (!value || value <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    try {
      await api.bills.create({
        title,
        amount: value,
        dueDate: new Date(dueDate).toISOString(),
        type,
        kind,
        recurring,
      });
      setTitle("");
      setAmount("");
      setDueDate("");
      setType("OUTRO");
      setKind("PAGAR");
      setRecurring(false);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleToggleSettle(bill: Bill) {
    const wasPending = bill.status === "PENDENTE";
    if (wasPending) {
      await api.bills.update(bill.id, { status: bill.kind === "RECEBER" ? "RECEBIDA" : "PAGA" });
    } else {
      await api.bills.update(bill.id, { status: "PENDENTE" });
    }
    await load();
  }

  async function handleToggleRecurring(bill: Bill) {
    await api.bills.update(bill.id, { recurring: true });
    await load();
  }

  async function handleStopRecurring(bill: Bill) {
    if (!bill.recurrenceId) return;
    await api.financeRules.stop(bill.recurrenceId);
    await load();
  }

  async function handleTogglePriority(bill: Bill) {
    await api.bills.update(bill.id, { priority: !bill.priority });
    await load();
  }

  async function handleDelete(id: string) {
    await api.bills.remove(id);
    await load();
  }

  const filtered = useMemo(() => {
    switch (filter) {
      case "pagar":
        // Assinaturas também são dinheiro saindo da carteira, então contam
        // como "a pagar" — a aba "Assinaturas" continua com a visão específica.
        return bills.filter((b) => b.kind === "PAGAR" || b.kind === "ASSINATURA");
      case "pagas":
        return bills.filter((b) => b.status !== "PENDENTE");
      case "receber":
        return bills.filter((b) => b.kind === "RECEBER");
      case "assinaturas":
        return bills.filter((b) => b.kind === "ASSINATURA");
      case "recorrentes":
        return bills.filter((b) => b.recurring);
      case "vencimentos":
      default:
        return bills.filter((b) => b.status === "PENDENTE");
    }
  }, [bills, filter]);

  const pending = filtered
    .filter((b) => b.status === "PENDENTE")
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority ? -1 : 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  const settled = filtered.filter((b) => b.status !== "PENDENTE");

  return (
    <div className="page">
      <h1>Contas</h1>

      <div className="finance-summary">
        <div className="summary-card">
          <span className="summary-label">Gastos este mês</span>
          <strong className="summary-value">{formatBRL(monthExpensesTotal)}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <input placeholder="Nome da conta" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input
          inputMode="decimal"
          placeholder="Valor (R$)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
        <select value={type} onChange={(e) => setType(e.target.value as BillType)}>
          <option value="CARTAO">Cartão</option>
          <option value="BOLETO">Boleto</option>
          <option value="ASSINATURA">Assinatura</option>
          <option value="OUTRO">Outro</option>
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value as BillKind)}>
          <option value="PAGAR">A pagar</option>
          <option value="RECEBER">A receber</option>
          <option value="ASSINATURA">Assinatura</option>
        </select>
        <label className="recurring-check">
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
          Recorrente mensal
        </label>
        <button type="submit" className="icon-btn primary" aria-label="Adicionar conta">
          <PlusIcon />
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      <div className="filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={filter === f.key ? "filter active" : "filter"}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="list">
        {pending.map((bill) => {
          const days = daysUntil(bill.dueDate);
          return (
            <li key={bill.id} className={`bill-item ${urgencyClass(days)}`}>
              <button
                className={`star-btn${bill.priority ? " active" : ""}`}
                onClick={() => handleTogglePriority(bill)}
                aria-label="Marcar prioridade"
              >
                ★
              </button>
              <div className="bill-info">
                <strong>{bill.title}</strong>
                <div className="meta">
                  {typeLabel[bill.type]} · {kindLabel[bill.kind]} · {formatBRL(bill.amount)}
                  {bill.recurring && " · Recorrente"}
                </div>
                <div className="meta">
                  {days < 0
                    ? `Venceu há ${Math.abs(days)} dia(s)`
                    : days === 0
                    ? "Vence hoje"
                    : `Vence em ${days} dia(s)`}
                </div>
              </div>
              {!bill.recurring && (
                <button className="icon-btn" onClick={() => handleToggleRecurring(bill)} aria-label="Tornar recorrente mensal">
                  Recorrente
                </button>
              )}
              {bill.recurring && bill.recurrenceId && (
                <button
                  className="icon-btn"
                  onClick={() => handleStopRecurring(bill)}
                  aria-label="Parar recorrência (não gera mais meses futuros)"
                >
                  Parar recorrência
                </button>
              )}
              <button className="icon-btn" onClick={() => handleToggleSettle(bill)} aria-label="Marcar como paga">
                {bill.kind === "RECEBER" ? "Recebido" : "Pago"}
              </button>
              <button className="icon-btn" onClick={() => handleDelete(bill.id)} aria-label="Excluir conta">
                <TrashIcon width={18} height={18} />
              </button>
            </li>
          );
        })}
        {pending.length === 0 && <p className="hint">Nenhuma conta pendente neste filtro.</p>}
      </ul>

      {settled.length > 0 && (
        <>
          <h2 className="paid-title">Resolvidas</h2>
          <ul className="list">
            {settled.map((bill) => (
              <li key={bill.id} className="bill-item paid">
                <div className="bill-info">
                  <strong>{bill.title}</strong>
                  <div className="meta">
                    {typeLabel[bill.type]} · {formatBRL(bill.amount)}
                    {bill.paidDate && ` · ${bill.status === "RECEBIDA" ? "Recebida" : "Paga"} em ${new Date(bill.paidDate).toLocaleDateString("pt-BR")}`}
                  </div>
                </div>
                <button className="icon-btn" onClick={() => handleToggleSettle(bill)} aria-label="Reabrir conta">
                  Reabrir
                </button>
                <button className="icon-btn" onClick={() => handleDelete(bill.id)} aria-label="Excluir conta">
                  <TrashIcon width={18} height={18} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
