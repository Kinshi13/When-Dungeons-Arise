import { useEffect, useState, type FormEvent } from "react";
import { api, type Note } from "../api";
import { TrashIcon, PlusIcon } from "../icons";
import { playSfx } from "../sound";
import { useGame, type RewardPopupData } from "../game/GameContext";
import RewardPopup from "./game/RewardPopup";

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reward, setReward] = useState<RewardPopupData | null>(null);
  const { grantReward } = useGame();

  async function load() {
    setNotes(await api.notes.list());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    await api.notes.create({ title: title.trim() || "Sem título", content });
    setTitle("");
    setContent("");
    setReward(grantReward("notaCriada"));
    await load();
  }

  async function handleDelete(id: string) {
    await api.notes.remove(id);
    await load();
  }

  async function handleTurnIntoTask(note: Note) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    await api.reminders.create({ title: note.title, description: note.content, dateTime: tomorrow.toISOString(), type: "OUTRO" });
    playSfx("coin");
  }

  return (
    <div className="notes-panel">
      <form onSubmit={handleSubmit} className="form notes-form">
        <input
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => playSfx("drop")}
        />
        <textarea
          placeholder="Escreva sua nota..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => playSfx("drop")}
          rows={3}
        />
        <button type="submit" className="icon-btn primary" aria-label="Adicionar nota">
          <PlusIcon width={18} height={18} />
        </button>
      </form>

      <ul className="list">
        {notes.map((note) => (
          <li key={note.id} className="note-item">
            <div className="note-item-body">
              <strong>{note.title}</strong>
              {note.content && <p>{note.content}</p>}
              <button className="small" onClick={() => handleTurnIntoTask(note)}>
                Virar missão
              </button>
            </div>
            <button className="icon-btn" onClick={() => handleDelete(note.id)} aria-label="Excluir nota">
              <TrashIcon width={16} height={16} />
            </button>
          </li>
        ))}
        {notes.length === 0 && <p className="hint">Nenhuma nota ainda.</p>}
      </ul>
      <RewardPopup reward={reward} onClose={() => setReward(null)} />
    </div>
  );
}
