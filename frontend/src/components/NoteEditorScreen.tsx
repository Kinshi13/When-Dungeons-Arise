import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api, type Note } from "../api";
import { TrashIcon, PlusIcon, ChevronLeftIcon } from "../icons";
import { playSfx } from "../sound";
import { findDateMention, resolveDateToISO } from "../game/dateDetector";

interface NoteEditorScreenProps {
  note: Note | null;
  onClose: () => void;
  onSave: (data: { title: string; content: string }) => void;
  onDelete: (id: string) => void;
  onTurnIntoTask: (note: Note) => void;
}

export default function NoteEditorScreen({ note, onClose, onSave, onDelete, onTurnIntoTask }: NoteEditorScreenProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dismissedMatch, setDismissedMatch] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (note) {
      setTitle(note.title === "Nova nota" ? "" : note.title);
      setContent(note.content);
      setDismissedMatch(null);
    }
  }, [note]);

  const detectedDate = useMemo(() => findDateMention(`${title} ${content}`), [title, content]);
  const showDatePrompt = !!detectedDate && detectedDate.matchText !== dismissedMatch;

  function handleSave() {
    onSave({ title: title.trim(), content });
    onClose();
  }

  async function handleCreateReminderFromDate() {
    if (!note || !detectedDate) return;
    await api.reminders.create({
      title: title.trim() || "Lembrete da nota",
      description: content,
      dateTime: resolveDateToISO(detectedDate),
      type: "OUTRO",
      priority: "MEDIA",
      fromNote: true,
    });
    onSave({ title: title.trim(), content });
    playSfx("coin");
    onClose();
    navigate("/sala-do-tempo/agenda");
  }

  return createPortal(
    <AnimatePresence>
      {note && (
        <motion.div
          className="note-fullscreen"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2 }}
        >
          <div className="page-bg page-bg-blurred-strong" aria-hidden="true">
            <img src="/diario-notas-bg.png" alt="" />
          </div>

          <div className="note-fullscreen-content">
            <div className="note-fullscreen-header">
              <button className="icon-btn" onClick={handleSave} aria-label="Voltar">
                <ChevronLeftIcon width={20} height={20} /> Voltar
              </button>
              <button
                className="icon-btn"
                onClick={() => {
                  onDelete(note.id);
                  onClose();
                }}
                aria-label="Excluir nota"
              >
                <TrashIcon width={18} height={18} />
              </button>
            </div>

            <input
              className="note-editor-title"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => playSfx("drop")}
              autoFocus
            />
            <textarea
              className="note-editor-content note-editor-content-full"
              placeholder="Escreva sua nota..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => playSfx("drop")}
            />

            {showDatePrompt && (
              <div className="date-prompt">
                <span>Data "{detectedDate!.matchText}" encontrada na nota.</span>
                <div className="date-prompt-actions">
                  <button
                    className="icon-btn primary small-btn"
                    onClick={handleCreateReminderFromDate}
                    aria-label="Adicionar lembrete no calendário"
                  >
                    <PlusIcon width={14} height={14} /> Lembrete
                  </button>
                  <button className="icon-btn small-btn" onClick={() => setDismissedMatch(detectedDate!.matchText)}>
                    Ignorar
                  </button>
                </div>
              </div>
            )}

            <div className="note-editor-actions">
              <button className="small" onClick={() => onTurnIntoTask(note)}>
                Virar missão
              </button>
              <button className="icon-btn primary" onClick={handleSave}>
                Salvar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
