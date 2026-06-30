import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, type Bill } from "../api";

const DISMISS_KEY = "due-bills-popup-dismissed-on";

function daysUntil(dateStr: string) {
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DueBillsPopup() {
  const [dueBills, setDueBills] = useState<Bill[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const todayStr = new Date().toDateString();
    if (localStorage.getItem(DISMISS_KEY) === todayStr) return;

    api.bills.list().then((bills) => {
      const upcoming = bills
        .filter((b) => !b.paid && daysUntil(b.dueDate) <= 10)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      if (upcoming.length > 0) {
        setDueBills(upcoming);
        setVisible(true);
      }
    });
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, new Date().toDateString());
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="popup-backdrop"
          onClick={handleDismiss}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="popup-card"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 16 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
          >
            <h2>Contas próximas do vencimento</h2>
            <ul className="list">
              {dueBills.map((bill) => {
                const days = daysUntil(bill.dueDate);
                return (
                  <li key={bill.id} className="reminder-item">
                    <div>
                      <strong>{bill.title}</strong>
                      <div className="meta">
                        {formatBRL(bill.amount)} ·{" "}
                        {days < 0
                          ? `Venceu há ${Math.abs(days)} dia(s)`
                          : days === 0
                          ? "Vence hoje"
                          : `Vence em ${days} dia(s)`}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <button className="popup-close" onClick={handleDismiss}>
              Entendi
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
