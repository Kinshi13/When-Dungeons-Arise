import { useEffect, useState } from "react";
import { api, type Note } from "../api";
import ListEditorScreen from "./ListEditorScreen";

function previewItems(list: Note) {
  const items = list.items ?? [];
  if (items.length === 0) return "Lista vazia.";
  return items
    .slice(0, 3)
    .map((i) => i.text)
    .join(" · ");
}

export default function Lists() {
  const [lists, setLists] = useState<Note[]>([]);
  const [editingListId, setEditingListId] = useState<string | null>(null);

  async function load() {
    setLists(await api.notes.list("LISTA"));
  }

  useEffect(() => {
    load();
  }, []);

  const editingList = lists.find((l) => l.id === editingListId) ?? null;

  async function handleCreate() {
    const list = await api.notes.create({ type: "LISTA", title: "Nova lista" });
    await load();
    setEditingListId(list.id);
  }

  async function handleDeleteList(id: string) {
    await api.notes.remove(id);
    await load();
  }

  async function handleRename(id: string, title: string) {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, title } : l)));
    await api.notes.update(id, { title });
  }

  async function handleAddItem(id: string, text: string) {
    await api.notes.addItem(id, text);
    await load();
  }

  async function handleToggleItem(id: string, itemId: string) {
    await api.notes.toggleItem(id, itemId);
    await load();
  }

  async function handleRemoveItem(id: string, itemId: string) {
    await api.notes.removeItem(id, itemId);
    await load();
  }

  function handleCloseEditor() {
    const list = lists.find((l) => l.id === editingListId);
    setEditingListId(null);
    if (list && !list.title.trim()) {
      handleDeleteList(list.id);
    } else {
      load();
    }
  }

  return (
    <div className="notes-panel">
      <div className="notes-grid">
        {lists.map((list) => {
          const items = list.items ?? [];
          const doneCount = items.filter((i) => i.done).length;
          return (
            <button key={list.id} className="note-card" onClick={() => setEditingListId(list.id)}>
              <div className="note-card-header">
                <strong className="note-card-title">{list.title}</strong>
                {items.length > 0 && (
                  <span className="meta">
                    {doneCount}/{items.length}
                  </span>
                )}
              </div>
              <p className="note-card-preview">{previewItems(list)}</p>
            </button>
          );
        })}
        {lists.length === 0 && <p className="hint">Nenhuma lista ainda. Toque no + pra criar uma.</p>}
      </div>

      <button className="fab fab-right" onClick={handleCreate} aria-label="Nova lista">
        <img src="/icons-nav/icon-add.png" alt="" />
      </button>

      <ListEditorScreen
        list={editingList}
        onClose={handleCloseEditor}
        onRename={handleRename}
        onDelete={handleDeleteList}
        onAddItem={handleAddItem}
        onToggleItem={handleToggleItem}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
}
