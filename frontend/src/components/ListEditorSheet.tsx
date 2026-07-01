import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Note } from "../api";
import { TrashIcon, PlusIcon } from "../icons";
import { playSfx } from "../sound";

interface ListEditorSheetProps {
  list: Note | null;
  onClose: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onAddItem: (id: string, text: string) => void;
  onToggleItem: (id: string, itemId: string) => void;
  onRemoveItem: (id: string, itemId: string) => void;
}

export default function ListEditorSheet({
  list,
  onClose,
  onRename,
  onDelete,
  onAddItem,
  onToggleItem,
  onRemoveItem,
}: ListEditorSheetProps) {
  const [draft, setDraft] = useState("");

  function handleAddItem(e: FormEvent) {
    e.preventDefault();
    if (!list || !draft.trim()) return;
    onAddItem(list.id, draft.trim());
    setDraft("");
    playSfx("drop");
  }

  return createPortal(
    <AnimatePresence>
      {list && (
        <motion.div
          className="book-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="book-sheet list-editor-sheet"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
          >
            <div className="book-sheet-handle" />
            <div className="list-editor-header">
              <input
                className="note-editor-title"
                value={list.title}
                onChange={(e) => onRename(list.id, e.target.value)}
                onFocus={() => playSfx("drop")}
              />
              <button
                className="icon-btn"
                onClick={() => {
                  onDelete(list.id);
                  onClose();
                }}
                aria-label="Excluir lista"
              >
                <TrashIcon width={18} height={18} />
              </button>
            </div>

            <ul className="checklist-items list-editor-items">
              {(list.items ?? []).map((item) => (
                <li key={item.id} className={`checklist-item${item.done ? " done" : ""}`}>
                  <label>
                    <input type="checkbox" checked={item.done} onChange={() => onToggleItem(list.id, item.id)} />
                    <span>{item.text}</span>
                  </label>
                  <button className="icon-btn" onClick={() => onRemoveItem(list.id, item.id)} aria-label="Remover item">
                    <TrashIcon width={14} height={14} />
                  </button>
                </li>
              ))}
              {(list.items ?? []).length === 0 && <p className="hint">Lista vazia — adicione um item abaixo.</p>}
            </ul>

            <form className="form checklist-add-form" onSubmit={handleAddItem}>
              <input
                placeholder="Novo item"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onFocus={() => playSfx("drop")}
              />
              <button type="submit" className="icon-btn primary" aria-label="Adicionar item">
                <PlusIcon width={16} height={16} />
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
