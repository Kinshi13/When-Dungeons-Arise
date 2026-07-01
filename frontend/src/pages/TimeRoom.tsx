import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Calendar from "./Calendar";
import PixelDialogBox from "../components/game/PixelDialogBox";
import { api, type Bill } from "../api";
import { buildPendingBillsSummary } from "../game/pendingSummary";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function TimeRoom() {
  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    api.bills.list().then(setBills);
  }, []);

  const pendingDays = buildPendingBillsSummary(bills);

  return (
    <div>
      <div className="page" style={{ paddingBottom: 0 }}>
        <h1>Sala do Tempo</h1>
        <PixelDialogBox speaker="Guardião do Tempo">
          {pendingDays.length === 0 ? (
            "Nenhuma conta pendente por perto. Organize seus compromissos no calendário abaixo."
          ) : (
            <>
              Contas chegando:{" "}
              {pendingDays.map((day, i) => (
                <span key={day.dateKey}>
                  <Link to="/tesouraria/contas" className="dialog-pending-chip">
                    {day.label} · {day.count} conta{day.count > 1 ? "s" : ""} ({formatBRL(day.totalAmount)})
                  </Link>
                  {i < pendingDays.length - 1 ? " · " : ""}
                </span>
              ))}
            </>
          )}
        </PixelDialogBox>
      </div>
      <Calendar />
    </div>
  );
}
