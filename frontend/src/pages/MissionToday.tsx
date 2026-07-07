import { useEffect, useState } from "react";
import { api, type Reminder } from "../api";
import { generateMissions, type Mission } from "../game/missionGenerator";
import PixelMissionCard from "../components/game/PixelMissionCard";
import { playSfx } from "../sound";

// Painel do dia: atrasadas em destaque (separadas das diárias no prazo),
// depois diárias/semanais/especiais — sem formulário de criação aqui, isso
// mora na aba Missões (gerenciamento completo).
export default function MissionToday() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  async function load() {
    setReminders(await api.reminders.list());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleComplete(mission: Mission) {
    await api.reminders.complete(mission.reminderId);
    playSfx("coin");
    await load();
  }

  const pending = reminders.filter((r) => !r.done);
  const { daily, weekly, special } = generateMissions(pending);
  const overdue = daily.filter((m) => m.overdue);
  const dueToday = daily.filter((m) => !m.overdue);

  function renderList(missions: Mission[]) {
    return (
      <div className="list">
        {missions.map((m) => (
          <PixelMissionCard
            key={m.id}
            title={m.title}
            dueLabel={m.dueLabel}
            category={m.category}
            priority={m.priority}
            fromNote={m.fromNote}
            onComplete={() => handleComplete(m)}
          />
        ))}
      </div>
    );
  }

  const isEmpty = daily.length === 0 && weekly.length === 0 && special.length === 0;

  return (
    <div className="page">
      {overdue.length > 0 && (
        <section className="mission-section mission-section-overdue">
          <h2>Atrasadas</h2>
          {renderList(overdue)}
        </section>
      )}

      {dueToday.length > 0 && (
        <section className="mission-section">
          <h2>Hoje</h2>
          {renderList(dueToday)}
        </section>
      )}

      {weekly.length > 0 && (
        <section className="mission-section">
          <h2>Esta semana</h2>
          {renderList(weekly)}
        </section>
      )}

      {special.length > 0 && (
        <section className="mission-section">
          <h2>Especiais</h2>
          {renderList(special)}
        </section>
      )}

      {isEmpty && <p className="hint">Seu mural está tranquilo hoje.</p>}
    </div>
  );
}
