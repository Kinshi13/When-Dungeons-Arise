import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Note } from "../api";
import { TrashIcon, PlusIcon, ChevronLeftIcon } from "../icons";
import { playSfx } from "../sound";

interface ListEditorScreenProps {
  list: Note | null;
  onClose: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onAddItem: (id: string, text: string) => void;
  onToggleItem: (id: string, itemId: string) => void;
  onRemoveItem: (id: string, itemId: string) => void;
}

export default function ListEditorScreen({
  list,
  onClose,
  onRename,
  onDelete,
  onAddItem,
  onToggleItem,
  onRemoveItem,
}: ListEditorScreenProps) {
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
          className="note-fullscreen"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2 }}
        >
          <div className="page-bg page-bg-blurred-strong" aria-hidden="true">
            <img src="/diario-listas-bg.png" alt="" />
          </div>

          <div className="note-fullscreen-content">
            <div className="note-fullscreen-header">
              <button className="icon-btn" onClick={onClose} aria-label="Voltar">
                <ChevronLeftIcon width={20} height={20} /> Voltar
              </button>
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

            <input
              className="note-editor-title"
              value={list.title}
              onChange={(e) => onRename(list.id, e.target.value)}
              onFocus={() => playSfx("drop")}
            />

            <ul className="checklist-items list-editor-items-full">
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
