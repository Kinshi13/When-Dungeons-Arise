import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentEnter } from "../motion";
import Calendar from "./Calendar";
import LinhaDoTempo from "./LinhaDoTempo";
import PixelDialogBox from "../components/game/PixelDialogBox";
import TempoTabBar from "../components/TempoTabBar";
import { api, type Bill, type Reminder } from "../api";
import { buildPendingBillsSummary } from "../core/domain/pendingSummary";
import { buildAgendaSummary } from "../core/domain/agendaSummary";
import { getBrazilianHolidays } from "../core/domain/holidays";

type Tab = "calendario" | "agenda" | "linha-do-tempo";

function tabFromPath(pathname: string): Tab {
  if (pathname.endsWith("/agenda")) return "agenda";
  if (pathname.endsWith("/linha-do-tempo")) return "linha-do-tempo";
  return "calendario";
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatShort(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function TimeRoom() {
  const location = useLocation();
  const tab = tabFromPath(location.pathname);
  const [bills, setBills] = useState<Bill[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    api.bills.list().then(setBills);
    api.reminders.list().then(setReminders);
  }, []);

  const pendingDays = buildPendingBillsSummary(bills);
  const holidays = useMemo(() => getBrazilianHolidays(new Date().getFullYear()), []);
  const agendaSummary = buildAgendaSummary(reminders, holidays);

  return (
    <div>
      <div className="page" style={{ paddingBottom: 0 }}>
        <h1>Sala do Tempo</h1>
        <PixelDialogBox speaker="Guardião do Tempo">
          {tab === "calendario" &&
            (pendingDays.length === 0 ? (
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
            ))}
          {tab === "agenda" &&
            (agendaSummary.upcomingCount === 0 && !agendaSummary.nextHoliday ? (
              "Nada marcado pros próximos dias. Use a agenda pra planejar eventos, reuniões e tarefas."
            ) : (
              <>
                {agendaSummary.upcomingCount > 0 &&
                  `${agendaSummary.upcomingCount} evento${agendaSummary.upcomingCount > 1 ? "s" : ""} nos próximos 7 dias. `}
                {agendaSummary.nextHoliday &&
                  `Próximo feriado: ${agendaSummary.nextHoliday.name} (${formatShort(agendaSummary.nextHoliday.date)}).`}
              </>
            ))}
          {tab === "linha-do-tempo" && "Tudo que vem por aí, em ordem, num relance."}
        </PixelDialogBox>
        <TempoTabBar />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} {...tabContentEnter}>
          {tab === "calendario" && <Calendar variant="mensal" />}
          {tab === "agenda" && <Calendar variant="agenda" />}
          {tab === "linha-do-tempo" && <LinhaDoTempo />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
