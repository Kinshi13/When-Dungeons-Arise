import { useEffect, useState } from "react";
import { api, type Note } from "../api";
import { playSfx } from "../sound";
import { useGame, type RewardPopupData } from "../game/GameContext";
import { findDateMention } from "../game/dateDetector";
import RewardPopup from "./game/RewardPopup";
import NoteEditorSheet from "./NoteEditorSheet";

function previewText(content: string) {
  const firstLines = content.trim().split("\n").slice(0, 3).join(" ");
  return firstLines || "Nota vazia.";
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [reward, setReward] = useState<RewardPopupData | null>(null);
  const { grantReward } = useGame();

  async function load() {
    setNotes(await api.notes.list("NOTA"));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    const note = await api.notes.create({ type: "NOTA", title: "Nova nota", content: "" });
    await load();
    setEditingNote(note);
  }

  async function handleSave(data: { title: string; content: string }) {
    if (!editingNote) return;
    const wasNew = !editingNote.content && editingNote.title === "Nova nota";
    const isBlank = !data.title.trim() && !data.content.trim();

    if (wasNew && isBlank) {
      // Nota criada pelo botão flutuante mas fechada sem nenhum conteúdo — descarta.
      await api.notes.remove(editingNote.id);
    } else {
      await api.notes.update(editingNote.id, { title: data.title || "Sem título", content: data.content });
      if (wasNew && data.content.trim()) {
        setReward(grantReward("notaCriada"));
      }
    }
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
      <div className="notes-grid">
        {notes.map((note) => {
          const hasDate = !!findDateMention(`${note.title} ${note.content}`);
          return (
            <button
              key={note.id}
              className="note-card"
              style={hasDate ? { opacity: 0.85 } : undefined}
              onClick={() => setEditingNote(note)}
            >
              <strong className="note-card-title">{note.title}</strong>
              <p className="note-card-preview">{previewText(note.content)}</p>
            </button>
          );
        })}
        {notes.length === 0 && <p className="hint">Nenhuma nota ainda. Toque no + pra criar uma.</p>}
      </div>

      <button className="fab fab-right" onClick={handleCreate} aria-label="Nova nota">
        <img src="/icons-nav/icon-add.png" alt="" />
      </button>

      <NoteEditorSheet
        note={editingNote}
        onClose={() => setEditingNote(null)}
        onSave={handleSave}
        onDelete={handleDelete}
        onTurnIntoTask={handleTurnIntoTask}
      />
      <RewardPopup reward={reward} onClose={() => setReward(null)} />
    </div>
  );
}
