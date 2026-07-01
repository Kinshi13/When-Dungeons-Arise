import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Note } from "../api";
import { TrashIcon } from "../icons";
import { playSfx } from "../sound";

interface NoteEditorSheetProps {
  note: Note | null;
  onClose: () => void;
  onSave: (data: { title: string; content: string }) => void;
  onDelete: (id: string) => void;
  onTurnIntoTask: (note: Note) => void;
}

export default function NoteEditorSheet({ note, onClose, onSave, onDelete, onTurnIntoTask }: NoteEditorSheetProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (note) {
      setTitle(note.title === "Nova nota" ? "" : note.title);
      setContent(note.content);
    }
  }, [note]);

  function handleSave() {
    onSave({ title: title.trim(), content });
    onClose();
  }

  return createPortal(
    <AnimatePresence>
      {note && (
        <motion.div
          className="book-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleSave}
        >
          <motion.div
            className="book-sheet note-editor-sheet"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
          >
            <div className="book-sheet-handle" />
            <input
              className="note-editor-title"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => playSfx("drop")}
              autoFocus
            />
            <textarea
              className="note-editor-content"
              placeholder="Escreva sua nota..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => playSfx("drop")}
              rows={6}
            />
            <div className="note-editor-actions">
              <button className="small" onClick={() => onTurnIntoTask(note)}>
                Virar missão
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
              <button className="icon-btn primary" onClick={handleSave}>
                Salvar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
