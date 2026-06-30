import { useEffect, useState, type FormEvent } from "react";
import { api, type Bill, type BillType } from "../api";
import { TrashIcon, PlusIcon } from "../icons";
import { useGame, type RewardPopupData } from "../game/GameContext";
import RewardPopup from "../components/game/RewardPopup";

const typeLabel: Record<BillType, string> = {
  CARTAO: "Cartão",
  BOLETO: "Boleto",
  ASSINATURA: "Assinatura",
  OUTRO: "Outro",
};

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
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [type, setType] = useState<BillType>("OUTRO");
  const [error, setError] = useState<string | null>(null);
  const [reward, setReward] = useState<RewardPopupData | null>(null);
  const { grantReward } = useGame();

  async function load() {
    setBills(await api.bills.list());
  }

  useEffect(() => {
    load();
  }, []);

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
      });
      setTitle("");
      setAmount("");
      setDueDate("");
      setType("OUTRO");
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleTogglePaid(bill: Bill) {
    const wasUnpaid = !bill.paid;
    await api.bills.update(bill.id, { paid: !bill.paid });
    if (wasUnpaid) setReward(grantReward("contaPaga"));
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

  const unpaid = bills
    .filter((b) => !b.paid)
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority ? -1 : 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  const paid = bills.filter((b) => b.paid);

  return (
    <div className="page">
      <h1>Contas</h1>

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
        <button type="submit" className="icon-btn primary" aria-label="Adicionar conta">
          <PlusIcon />
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      <ul className="list">
        {unpaid.map((bill) => {
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
                  {typeLabel[bill.type]} · {formatBRL(bill.amount)} ·{" "}
                  {days < 0
                    ? `Venceu há ${Math.abs(days)} dia(s)`
                    : days === 0
                    ? "Vence hoje"
                    : `Vence em ${days} dia(s)`}
                </div>
              </div>
              <button className="icon-btn" onClick={() => handleTogglePaid(bill)} aria-label="Marcar como paga">
                Pago
              </button>
              <button className="icon-btn" onClick={() => handleDelete(bill.id)} aria-label="Excluir conta">
                <TrashIcon width={18} height={18} />
              </button>
            </li>
          );
        })}
        {unpaid.length === 0 && <p className="hint">Nenhuma conta pendente.</p>}
      </ul>

      {paid.length > 0 && (
        <>
          <h2 className="paid-title">Pagas</h2>
          <ul className="list">
            {paid.map((bill) => (
              <li key={bill.id} className="bill-item paid">
                <div className="bill-info">
                  <strong>{bill.title}</strong>
                  <div className="meta">
                    {typeLabel[bill.type]} · {formatBRL(bill.amount)}
                  </div>
                </div>
                <button className="icon-btn" onClick={() => handleTogglePaid(bill)} aria-label="Reabrir conta">
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
      <RewardPopup reward={reward} onClose={() => setReward(null)} />
    </div>
  );
}
