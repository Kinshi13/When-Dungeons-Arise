import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Bill, type Reminder } from "../api";
import { generateMissions } from "../game/missionGenerator";
import { buildHomeSummary } from "../game/homeSummary";
import { useGame } from "../game/GameContext";
import PixelDialogBox from "../components/game/PixelDialogBox";
import PixelCharacterIdle from "../components/game/PixelCharacterIdle";
import PixelRoomButton from "../components/game/PixelRoomButton";
import { TabBellIcon, TabCoinsIcon, TabHomeCalendarIcon } from "../icons2";
import { BookIcon, DiaryIcon, SettingsIcon } from "../icons";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia, aventureiro!";
  if (hour < 18) return "Boa tarde, aventureiro!";
  return "Boa noite, aventureiro!";
}

export default function GuildReception() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const { level, coins } = useGame();

  useEffect(() => {
    api.reminders.list().then((all) => setReminders(all.filter((r) => !r.done)));
    api.bills.list().then(setBills);
  }, []);

  const { daily, weekly } = generateMissions(reminders);
  const pendingToday = daily.length;
  const summaryCards = buildHomeSummary(reminders, bills);

  return (
    <div className="page reception-page">
      <h1>Recepção da Guilda</h1>

      <div className="reception-scene">
        <PixelCharacterIdle name="Recepcionista" size={110} color="var(--reuniao)" />
        <PixelDialogBox speaker="Recepcionista">
          {greeting()}{" "}
          {pendingToday > 0
            ? `Você tem ${pendingToday} missão${pendingToday > 1 ? "ões" : ""} no mural hoje.`
            : "Nenhuma missão urgente hoje — bom momento para planejar a semana."}{" "}
          Está no nível {level}, com {coins} moedas guardadas.
        </PixelDialogBox>
      </div>

      <p className="hint">
        {weekly.length > 0
          ? `Mais ${weekly.length} missão${weekly.length > 1 ? "ões" : ""} chegando esta semana.`
          : "Sem missões previstas para os próximos dias."}
      </p>

      <div className="home-summary-grid">
        {summaryCards.map((card) => (
          <Link key={card.key} to={card.to} className="home-summary-card">
            <span className="home-summary-label">{card.label}</span>
            <strong className="home-summary-count">{card.count}</strong>
            <span className="home-summary-next">{card.nextLabel ?? "Nada por perto"}</span>
          </Link>
        ))}
      </div>

      <div className="room-grid">
        <PixelRoomButton to="/missoes" label="Mural de Missões" icon={<TabBellIcon width={26} height={26} />} />
        <PixelRoomButton to="/sala-do-tempo" label="Sala do Tempo" icon={<TabHomeCalendarIcon width={26} height={26} />} />
        <PixelRoomButton to="/tesouraria" label="Tesouraria" icon={<TabCoinsIcon width={26} height={26} />} />
        <PixelRoomButton to="/diario" label="Diário" icon={<DiaryIcon width={26} height={26} />} />
        <PixelRoomButton to="/biblioteca" label="Biblioteca" icon={<BookIcon width={26} height={26} />} />
        <PixelRoomButton to="/regras" label="Livro de Regras" icon={<SettingsIcon width={26} height={26} />} />
      </div>
    </div>
  );
}
