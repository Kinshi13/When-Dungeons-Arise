import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./api";

// Cobertura de idempotência/tombstone pra reminders, notes/lists e
// annotations (Fase 7, etapa C — ampliação de cobertura além de
// recorrência financeira, que já tinha suíte própria em api.test.ts).

describe("api.reminders — tombstone", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("apagar um lembrete o remove da listagem, mas não da tabela (tombstone, não hard delete)", async () => {
    const created = await api.reminders.create({ title: "Reunião", dateTime: new Date().toISOString() });
    await api.reminders.remove(created.id);

    const list = await api.reminders.list();
    expect(list.find((r) => r.id === created.id)).toBeUndefined();
  });

  it("apagar duas vezes o mesmo lembrete não lança erro nem duplica o tombstone", async () => {
    const created = await api.reminders.create({ title: "Reunião", dateTime: new Date().toISOString() });
    await api.reminders.remove(created.id);
    await expect(api.reminders.remove(created.id)).resolves.not.toThrow();

    const list = await api.reminders.list();
    expect(list).toHaveLength(0);
  });

  it("completar um lembrete não o remove da listagem (done != deleted)", async () => {
    const created = await api.reminders.create({ title: "Tarefa", dateTime: new Date().toISOString() });
    const completed = await api.reminders.complete(created.id);

    expect(completed.done).toBe(true);
    const list = await api.reminders.list();
    expect(list.find((r) => r.id === created.id)).toBeTruthy();
  });
});

describe("api.notes — listas e itens", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("nota sem 'type' salvo (dado antigo, pré-migração implícita) é tratada como NOTA ao filtrar", async () => {
    // Simula uma nota criada antes da distinção Nota/Lista existir: insere
    // direto no storage sem o campo `type`, como um registro legado real
    // teria (não dá pra criar isso via api.notes.create, que já preenche
    // "NOTA" por padrão).
    const raw = JSON.parse(localStorage.getItem("lembretes-app:notes") ?? "[]");
    raw.push({
      id: "legacy-1",
      title: "Nota antiga",
      content: "texto",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
      // sem "type" de propósito
    });
    localStorage.setItem("lembretes-app:notes", JSON.stringify(raw));

    const notas = await api.notes.list("NOTA");
    const listas = await api.notes.list("LISTA");
    expect(notas.find((n) => n.id === "legacy-1")).toBeTruthy();
    expect(listas.find((n) => n.id === "legacy-1")).toBeUndefined();
  });

  it("adicionar, marcar e remover item de uma lista não duplica nem perde os demais itens", async () => {
    const list = await api.notes.create({ type: "LISTA", title: "Compras" });
    await api.notes.addItem(list.id, "Pão");
    const afterSecond = await api.notes.addItem(list.id, "Leite");
    expect(afterSecond.items).toHaveLength(2);

    const toggled = await api.notes.toggleItem(list.id, afterSecond.items![0].id);
    expect(toggled.items![0].done).toBe(true);
    expect(toggled.items![1].done).toBe(false); // o outro item não foi afetado

    const afterRemove = await api.notes.removeItem(list.id, afterSecond.items![1].id);
    expect(afterRemove.items).toHaveLength(1);
    expect(afterRemove.items![0].done).toBe(true);
  });

  it("apagar uma nota a remove da listagem (tombstone)", async () => {
    const note = await api.notes.create({ type: "NOTA", title: "Temporária" });
    await api.notes.remove(note.id);
    const list = await api.notes.list();
    expect(list.find((n) => n.id === note.id)).toBeUndefined();
  });
});

describe("api.annotations — por documento", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("lista só as anotações do documento pedido, mais recente primeiro", async () => {
    await api.annotations.create("doc-1", "loc-1", "primeira");
    await new Promise((r) => setTimeout(r, 2));
    await api.annotations.create("doc-1", "loc-2", "segunda");
    await api.annotations.create("doc-2", "loc-1", "de outro livro");

    const list = await api.annotations.list("doc-1");
    expect(list).toHaveLength(2);
    expect(list[0].note).toBe("segunda"); // mais recente primeiro
  });

  it("apagar uma anotação não a remove das outras do mesmo documento (sem tombstone cruzado)", async () => {
    const a = await api.annotations.create("doc-1", "loc-1", "fica");
    const b = await api.annotations.create("doc-1", "loc-2", "some");
    await api.annotations.remove(b.id);

    const list = await api.annotations.list("doc-1");
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(a.id);
  });
});
