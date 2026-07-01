import { useEffect, useState, type FormEvent } from "react";
import { api, type Priority, type Reminder, type ReminderType } from "../api";
import { generateMissions, type Mission } from "../game/missionGenerator";
import { useGame, type RewardPopupData } from "../game/GameContext";
import PixelMissionCard from "../components/game/PixelMissionCard";
import RewardPopup from "../components/game/RewardPopup";
import { PlusIcon } from "../icons";
import { playSfx } from "../sound";

export default function MissionBoard() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [type, setType] = useState<ReminderType>("OUTRO");
  const [priority, setPriority] = useState<Priority>("MEDIA");
  const [reward, setReward] = useState<RewardPopupData | null>(null);
  const { grantReward } = useGame();

  async function load() {
    setReminders(await api.reminders.list());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title || !dateTime) return;
    await api.reminders.create({
      title,
      description: description || undefined,
      dateTime: new Date(dateTime).toISOString(),
      type,
      priority,
    });
    setTitle("");
    setDescription("");
    setDateTime("");
    setType("OUTRO");
    setPriority("MEDIA");
    await load();
  }

  async function handleComplete(mission: Mission) {
    await api.reminders.complete(mission.reminderId);
    playSfx("coin");
    const result = grantReward(mission.rewardKey);
    setReward(result);
    await load();
  }

  const pending = reminders.filter((r) => !r.done);
  const { daily, weekly, special } = generateMissions(pending);

  return (
    <div className="page">
      <h1>Mural de Missões</h1>

      <form onSubmit={handleSubmit} className="form">
        <input
          placeholder="Nova missão"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => playSfx("drop")}
        />
        <input
          placeholder="Descrição (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onFocus={() => playSfx("drop")}
        />
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          onFocus={() => playSfx("drop")}
        />
        <select value={type} onChange={(e) => setType(e.target.value as ReminderType)}>
          <option value="OUTRO">Evento</option>
          <option value="TAREFA">Tarefa</option>
          <option value="REUNIAO">Reunião</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option value="BAIXA">Prioridade baixa</option>
          <option value="MEDIA">Prioridade média</option>
          <option value="ALTA">Prioridade alta</option>
        </select>
        <button type="submit" className="icon-btn primary" aria-label="Adicionar missão">
          <PlusIcon width={18} height={18} />
        </button>
      </form>

      {daily.length > 0 && (
        <section className="mission-section">
          <h2>Missões diárias</h2>
          <div className="list">
            {daily.map((m) => (
              <PixelMissionCard
                key={m.id}
                title={m.title}
                dueLabel={m.dueLabel}
                category={m.category}
                priority={m.priority}
                fromNote={m.fromNote}
                rewardXp={m.rewardXp}
                rewardCoins={m.rewardCoins}
                onComplete={() => handleComplete(m)}
              />
            ))}
          </div>
        </section>
      )}

      {weekly.length > 0 && (
        <section className="mission-section">
          <h2>Missões semanais</h2>
          <div className="list">
            {weekly.map((m) => (
              <PixelMissionCard
                key={m.id}
                title={m.title}
                dueLabel={m.dueLabel}
                category={m.category}
                priority={m.priority}
                fromNote={m.fromNote}
                rewardXp={m.rewardXp}
                rewardCoins={m.rewardCoins}
                onComplete={() => handleComplete(m)}
              />
            ))}
          </div>
        </section>
      )}

      {special.length > 0 && (
        <section className="mission-section">
          <h2>Missões especiais</h2>
          <div className="list">
            {special.map((m) => (
              <PixelMissionCard
                key={m.id}
                title={m.title}
                dueLabel={m.dueLabel}
                category={m.category}
                priority={m.priority}
                fromNote={m.fromNote}
                rewardXp={m.rewardXp}
                rewardCoins={m.rewardCoins}
                onComplete={() => handleComplete(m)}
              />
            ))}
          </div>
        </section>
      )}

      {daily.length === 0 && weekly.length === 0 && special.length === 0 && (
        <p className="hint">Nenhuma missão pendente. Adicione uma acima!</p>
      )}

      <RewardPopup reward={reward} onClose={() => setReward(null)} />
    </div>
  );
}
