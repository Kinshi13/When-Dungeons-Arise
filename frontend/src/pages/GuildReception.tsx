import { useEffect, useState } from "react";
import { api, type Reminder } from "../api";
import { generateMissions } from "../game/missionGenerator";
import { useGame } from "../game/GameContext";
import PixelDialogBox from "../components/game/PixelDialogBox";
import ReceptionCharacterScene from "../game-engine/ReceptionCharacterScene";
import GuildMapCanvas from "../game-engine/GuildMapCanvas";
import type { GuildMapRoom } from "../game-engine/scenes/GuildMapScene";

const GUILD_ROOMS: GuildMapRoom[] = [
  { id: "missoes", label: "Mural de Missões", to: "/missoes", color: "#2ecc71", x: 0.18, y: 0.28 },
  { id: "sala-do-tempo", label: "Sala do Tempo", to: "/sala-do-tempo", color: "#6c5ce7", x: 0.5, y: 0.28 },
  { id: "tesouraria", label: "Tesouraria", to: "/tesouraria", color: "#ffd23f", x: 0.82, y: 0.28 },
  { id: "diario", label: "Diário", to: "/diario", color: "#4fd6e8", x: 0.18, y: 0.66 },
  { id: "biblioteca", label: "Biblioteca", to: "/biblioteca", color: "#ff8a5c", x: 0.5, y: 0.66 },
  { id: "regras", label: "Livro de Regras", to: "/regras", color: "#9a8fc2", x: 0.82, y: 0.66 },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia, aventureiro!";
  if (hour < 18) return "Boa tarde, aventureiro!";
  return "Boa noite, aventureiro!";
}

export default function GuildReception() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const { level, coins } = useGame();

  useEffect(() => {
    api.reminders.list().then((all) => setReminders(all.filter((r) => !r.done)));
  }, []);

  const { daily, weekly } = generateMissions(reminders);
  const pendingToday = daily.length;

  return (
    <div className="page reception-page">
      <h1>Recepção da Guilda</h1>

      <div className="reception-scene">
        <ReceptionCharacterScene name="Recepcionista" size={110} color="#6c5ce7" />
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

      <GuildMapCanvas rooms={GUILD_ROOMS} />
    </div>
  );
}
