import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Reminder } from "../api";
import { generateMissions } from "../game/missionGenerator";
import { useGame } from "../game/GameContext";
import PixelDialogBox from "../components/game/PixelDialogBox";
import DailyMissionSummary from "../components/game/DailyMissionSummary";
import MissionBoardPopup from "../components/game/MissionBoardPopup";
import GuildReceptionCanvas from "../game-engine/GuildReceptionCanvas";
import { RECEPTIONIST_MESSAGES } from "../game-engine/guildReceptionConfig";

// Mensagem inicial reflete o estado real do jogador (missões urgentes > pendentes hoje >
// sequência ativa > saudação padrão); cada toque na recepcionista avança pra próxima da lista.
function pickBaseMessageIndex(hasUrgentMissions: boolean, pendingToday: number, streak: number): number {
  if (hasUrgentMissions) return 2;
  if (pendingToday > 0) return 1;
  if (streak > 0) return 4;
  return 0;
}

export default function GuildReceptionScreen() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [tapCount, setTapCount] = useState(0);
  const [missionPopupOpen, setMissionPopupOpen] = useState(false);
  const { level, coins, streak } = useGame();

  useEffect(() => {
    api.reminders.list().then((all) => setReminders(all.filter((r) => !r.done)));
  }, []);

  const { daily, weekly } = useMemo(() => generateMissions(reminders), [reminders]);
  const pendingToday = daily.length;
  const hasUrgentMissions = pendingToday > 0;

  const baseMessageIndex = pickBaseMessageIndex(hasUrgentMissions, pendingToday, streak);
  const message = RECEPTIONIST_MESSAGES[(baseMessageIndex + tapCount) % RECEPTIONIST_MESSAGES.length];

  return (
    <div className="page reception-page">
      <h1>Recepção da Guilda</h1>

      <GuildReceptionCanvas
        hasUrgentMissions={hasUrgentMissions}
        onReceptionistTap={() => setTapCount((n) => n + 1)}
        onEnterMissionBoard={() => setMissionPopupOpen(true)}
      />

      <PixelDialogBox speaker="Recepcionista">
        {message} Está no nível {level}, com {coins} moedas guardadas.
      </PixelDialogBox>

      <DailyMissionSummary missions={daily} />

      <p className="hint">
        {weekly.length > 0
          ? `Mais ${weekly.length} missão${weekly.length > 1 ? "ões" : ""} chegando esta semana.`
          : "Sem missões previstas para os próximos dias."}
      </p>

      <MissionBoardPopup
        open={missionPopupOpen}
        missions={daily}
        onClose={() => setMissionPopupOpen(false)}
        onViewAll={() => {
          setMissionPopupOpen(false);
          navigate("/missoes");
        }}
      />
    </div>
  );
}
