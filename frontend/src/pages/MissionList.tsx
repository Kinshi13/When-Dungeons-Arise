import { useEffect, useRef, useState, type FormEvent } from "react";
import { api, type Priority, type Reminder, type ReminderType } from "../api";
import { generateMissions, type Mission } from "../game/missionGenerator";
import PixelMissionCard from "../components/game/PixelMissionCard";
import { PlusIcon } from "../icons";
import { playSfx } from "../sound";
import { useQuickAction } from "../useQuickAction";

type Filter = "todas" | "diarias" | "semanais" | "especiais" | "concluidas";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "diarias", label: "Diárias" },
  { key: "semanais", label: "Semanais" },
  { key: "especiais", label: "Especiais" },
  { key: "concluidas", label: "Concluídas" },
];

// Gerenciamento completo: criar missão + navegar entre todas/por categoria/
// concluídas. A aba Hoje (painel do dia) fica só com o que é urgente.
export default function MissionList() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filter, setFilter] = useState<Filter>("todas");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [type, setType] = useState<ReminderType>("OUTRO");
  const [priority, setPriority] = useState<Priority>("MEDIA");
  const titleInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setReminders(await api.reminders.list());
  }

  useEffect(() => {
    load();
  }, []);

  useQuickAction("nova-missao", () => titleInputRef.current?.focus());

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
    await load();
  }

  const pending = reminders.filter((r) => !r.done);
  const done = reminders.filter((r) => r.done);
  const { daily, weekly, special } = generateMissions(pending);

  const sections: { label: string; missions: Mission[] }[] =
    filter === "todas"
      ? [
          { label: "Diárias", missions: daily },
          { label: "Semanais", missions: weekly },
          { label: "Especiais", missions: special },
        ]
      : filter === "diarias"
      ? [{ label: "Diárias", missions: daily }]
      : filter === "semanais"
      ? [{ label: "Semanais", missions: weekly }]
      : filter === "especiais"
      ? [{ label: "Especiais", missions: special }]
      : [];

  const visibleSections = sections.filter((s) => s.missions.length > 0);

  return (
    <div className="page">
      <form onSubmit={handleSubmit} className="form">
        <input
          ref={titleInputRef}
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

      {filter === "concluidas" ? (
        <div className="list">
          {done.length === 0 && <p className="hint">Nenhuma missão concluída ainda.</p>}
          {done.map((r) => (
            <PixelMissionCard
              key={r.id}
              title={r.title}
              category={r.type === "REUNIAO" ? "especial" : "diaria"}
              priority={r.priority}
              fromNote={r.fromNote}
              done
            />
          ))}
        </div>
      ) : (
        <>
          {visibleSections.map((section) => (
            <section key={section.label} className="mission-section">
              <h2>{section.label}</h2>
              <div className="list">
                {section.missions.map((m) => (
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
            </section>
          ))}
          {visibleSections.length === 0 && <p className="hint">Nenhuma missão pendente por aqui.</p>}
        </>
      )}
    </div>
  );
}
