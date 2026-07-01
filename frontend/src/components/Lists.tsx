import { useEffect, useState, type FormEvent } from "react";
import { api, type Note } from "../api";
import { TrashIcon, PlusIcon } from "../icons";
import { playSfx } from "../sound";

export default function Lists() {
  const [lists, setLists] = useState<Note[]>([]);
  const [newListTitle, setNewListTitle] = useState("");
  const [itemDrafts, setItemDrafts] = useState<Record<string, string>>({});

  async function load() {
    setLists(await api.notes.list("LISTA"));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreateList(e: FormEvent) {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    await api.notes.create({ type: "LISTA", title: newListTitle.trim() });
    setNewListTitle("");
    await load();
  }

  async function handleDeleteList(id: string) {
    await api.notes.remove(id);
    await load();
  }

  async function handleAddItem(listId: string) {
    const text = (itemDrafts[listId] ?? "").trim();
    if (!text) return;
    await api.notes.addItem(listId, text);
    setItemDrafts((d) => ({ ...d, [listId]: "" }));
    playSfx("drop");
    await load();
  }

  async function handleToggleItem(listId: string, itemId: string) {
    await api.notes.toggleItem(listId, itemId);
    await load();
  }

  async function handleRemoveItem(listId: string, itemId: string) {
    await api.notes.removeItem(listId, itemId);
    await load();
  }

  return (
    <div className="notes-panel">
      <form onSubmit={handleCreateList} className="form">
        <input
          placeholder="Nova lista (ex: Compras)"
          value={newListTitle}
          onChange={(e) => setNewListTitle(e.target.value)}
          onFocus={() => playSfx("drop")}
        />
        <button type="submit" className="icon-btn primary" aria-label="Criar lista">
          <PlusIcon width={18} height={18} />
        </button>
      </form>

      <ul className="list">
        {lists.map((list) => {
          const items = list.items ?? [];
          const doneCount = items.filter((i) => i.done).length;
          const draft = itemDrafts[list.id] ?? "";
          return (
            <li key={list.id} className="checklist-card">
              <div className="checklist-card-header">
                <strong>{list.title}</strong>
                <div className="checklist-card-actions">
                  {items.length > 0 && (
                    <span className="meta">
                      {doneCount}/{items.length}
                    </span>
                  )}
                  <button className="icon-btn" onClick={() => handleDeleteList(list.id)} aria-label="Excluir lista">
                    <TrashIcon width={16} height={16} />
                  </button>
                </div>
              </div>

              <ul className="checklist-items">
                {items.map((item) => (
                  <li key={item.id} className={`checklist-item${item.done ? " done" : ""}`}>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => handleToggleItem(list.id, item.id)}
                      />
                      <span>{item.text}</span>
                    </label>
                    <button
                      className="icon-btn"
                      onClick={() => handleRemoveItem(list.id, item.id)}
                      aria-label="Remover item"
                    >
                      <TrashIcon width={14} height={14} />
                    </button>
                  </li>
                ))}
                {items.length === 0 && <p className="hint">Lista vazia — adicione um item abaixo.</p>}
              </ul>

              <form
                className="form checklist-add-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddItem(list.id);
                }}
              >
                <input
                  placeholder="Novo item"
                  value={draft}
                  onChange={(e) => setItemDrafts((d) => ({ ...d, [list.id]: e.target.value }))}
                  onFocus={() => playSfx("drop")}
                />
                <button type="submit" className="icon-btn primary" aria-label="Adicionar item">
                  <PlusIcon width={16} height={16} />
                </button>
              </form>
            </li>
          );
        })}
        {lists.length === 0 && <p className="hint">Nenhuma lista ainda. Crie uma acima.</p>}
      </ul>
    </div>
  );
}
