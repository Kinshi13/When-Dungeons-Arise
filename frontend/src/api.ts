import { createId, table } from "./storage";
import { saveFile, loadFile, deleteFile } from "./blobStore";
import { generateCoverThumbnail } from "./bookCovers";
import { buildRecurringOccurrences } from "./game/recurrence";
import { buildInstallmentExpenses } from "./game/installments";
import {
  scheduleReminderNotification,
  cancelReminderNotification,
  scheduleBillNotifications,
  cancelBillNotifications,
  scheduleBirthdayNotifications,
  cancelBirthdayNotifications,
  checkOverspendingAndNotify,
} from "./notifications";
import { compareWeek, compareMonth } from "./game/financeAnalysis";
import { syncReminderWidget, syncCalendarWidget } from "./widgetBridge";

export type ReminderType = "REUNIAO" | "TAREFA" | "OUTRO";
export type Priority = "BAIXA" | "MEDIA" | "ALTA";

export interface Reminder {
  id: string;
  title: string;
  description?: string | null;
  dateTime: string;
  type: ReminderType;
  priority: Priority;
  done?: boolean;
  fromNote?: boolean;
  // Aniversário: recorrente todo ano (dia/mês de dateTime), com avisos em
  // 20/15/10/5 dias e véspera em vez de um único disparo na hora marcada —
  // ver scheduleBirthdayNotifications em notifications.ts.
  isBirthday?: boolean;
  birthYear?: number | null;
}

export type NoteType = "NOTA" | "LISTA";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Note {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  items?: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  description?: string | null;
  date: string;
  installmentGroupId?: string | null;
  installmentIndex?: number | null;
  installmentTotal?: number | null;
  // Marcado na hora do lançamento — gasto supérfluo, candidato a cortar do
  // orçamento. Usado pela aba Análises pra calcular potencial de economia.
  superficial?: boolean;
}

// Resumo diário de gastos — recalculado automaticamente sempre que um gasto
// daquele dia é criado/removido (não é uma "foto" congelada, então nunca fica
// desatualizado se um gasto atrasado for lançado depois). Semana e mês não têm
// tabela própria: são somas desses resumos diários, calculadas sob demanda.
export interface DailySummary {
  id: string; // "YYYY-MM-DD"
  date: string; // mesmo valor do id
  total: number;
  count: number;
  superficialTotal: number;
  superficialCount: number;
  updatedAt: string;
}

export type DocumentType = "pdf" | "epub";

export interface DocumentMeta {
  id: string;
  title: string;
  type: DocumentType;
  addedAt: string;
  sizeBytes: number;
  coverDataUrl?: string | null;
}

export interface ReadingProgress {
  id: string; // mesmo id do DocumentMeta
  // PDF: número da página. EPUB: CFI (localização interna do epub.js).
  location: string;
  updatedAt: string;
}

export type BillType = "CARTAO" | "BOLETO" | "ASSINATURA" | "OUTRO";
export type BillKind = "PAGAR" | "RECEBER" | "ASSINATURA";
export type BillStatus = "PENDENTE" | "PAGA" | "RECEBIDA";

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  type: BillType;
  kind: BillKind;
  status: BillStatus;
  priority: boolean;
  paidDate?: string | null;
  recurring: boolean;
  recurrenceId?: string | null;
}

// Todos os dados ficam salvos no próprio dispositivo (localStorage do WebView).
// Não há servidor: o app funciona offline e independente de rede ou outro aparelho.
const reminderTable = table<Reminder>("reminders");
const noteTable = table<Note>("notes");
const expenseTable = table<Expense>("expenses");
const billTable = table<Bill>("bills");
const documentTable = table<DocumentMeta>("documents");
const readingProgressTable = table<ReadingProgress>("reading-progress");
const dailySummaryTable = table<DailySummary>("daily-summaries");

// Carteira — não é uma lista, é um único valor base ajustado manualmente pelo
// usuário (mesmo padrão de storage simples do SettingsContext), então fica
// fora do helper table().
const WALLET_KEY = "lembretes-app:wallet";

interface WalletBase {
  baseAmount: number;
  baseSetAt: string;
}

function loadWalletBase(): WalletBase {
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (!raw) return { baseAmount: 0, baseSetAt: new Date(0).toISOString() };
    return JSON.parse(raw);
  } catch {
    return { baseAmount: 0, baseSetAt: new Date(0).toISOString() };
  }
}

function dateKeyOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function recomputeDailySummary(dateKey: string) {
  const dayExpenses = expenseTable.list().filter((e) => dateKeyOf(e.date) === dateKey);
  if (dayExpenses.length === 0) {
    dailySummaryTable.remove(dateKey);
    return;
  }
  const superficialItems = dayExpenses.filter((e) => e.superficial);
  const summary: DailySummary = {
    id: dateKey,
    date: dateKey,
    total: dayExpenses.reduce((sum, e) => sum + e.amount, 0),
    count: dayExpenses.length,
    superficialTotal: superficialItems.reduce((sum, e) => sum + e.amount, 0),
    superficialCount: superficialItems.length,
    updatedAt: new Date().toISOString(),
  };
  if (dailySummaryTable.get(dateKey)) {
    dailySummaryTable.update(dateKey, summary);
  } else {
    dailySummaryTable.insert(summary);
  }
}

// Migração de primeira execução — preenche o resumo diário pra quem já tinha
// gastos lançados antes dessa função existir. Depois disso, os próprios
// create/remove de despesa mantêm tudo em dia sozinhos.
function ensureDailySummariesBackfilled() {
  if (dailySummaryTable.list().length > 0) return;
  const dateKeys = new Set(expenseTable.list().map((e) => dateKeyOf(e.date)));
  for (const key of dateKeys) recomputeDailySummary(key);
}
ensureDailySummariesBackfilled();

// O widget de Calendário combina lembretes + contas, então qualquer mutação
// em um dos dois precisa recalcular o mini calendário do mês.
function syncCalendarWidgetFromTables() {
  return syncCalendarWidget(reminderTable.list(), billTable.list());
}

export const api = {
  reminders: {
    list: async () =>
      [...reminderTable.list()].sort(
        (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      ),
    create: async (data: Partial<Reminder>) => {
      const reminder: Reminder = {
        id: createId(),
        title: data.title ?? "",
        description: data.description,
        dateTime: data.dateTime ?? new Date().toISOString(),
        type: data.type ?? "OUTRO",
        priority: data.priority ?? "MEDIA",
        done: false,
        fromNote: data.fromNote ?? false,
        isBirthday: data.isBirthday ?? false,
        birthYear: data.birthYear ?? null,
      };
      reminderTable.insert(reminder);
      if (reminder.isBirthday) await scheduleBirthdayNotifications(reminder);
      else await scheduleReminderNotification(reminder);
      await syncReminderWidget(reminderTable.list());
      await syncCalendarWidgetFromTables();
      return reminder;
    },
    update: async (id: string, data: Partial<Reminder>) => {
      const updated = reminderTable.update(id, data);
      if (!updated) throw new Error("Lembrete não encontrado");
      if (updated.isBirthday) await scheduleBirthdayNotifications(updated);
      else await scheduleReminderNotification(updated);
      await syncReminderWidget(reminderTable.list());
      await syncCalendarWidgetFromTables();
      return updated;
    },
    complete: async (id: string) => {
      const existing = reminderTable.get(id);
      const updated = reminderTable.update(id, { done: true });
      if (!updated) throw new Error("Lembrete não encontrado");
      if (existing?.isBirthday) await cancelBirthdayNotifications(id);
      else await cancelReminderNotification(id);
      await syncReminderWidget(reminderTable.list());
      await syncCalendarWidgetFromTables();
      return updated;
    },
    remove: async (id: string) => {
      const existing = reminderTable.get(id);
      reminderTable.remove(id);
      if (existing?.isBirthday) await cancelBirthdayNotifications(id);
      else await cancelReminderNotification(id);
      await syncReminderWidget(reminderTable.list());
      await syncCalendarWidgetFromTables();
    },
  },
  notes: {
    list: async (type?: NoteType) => {
      // Notas criadas antes da distinção Nota/Lista não têm "type" salvo — tratamos como NOTA.
      const items = type ? noteTable.list().filter((n) => (n.type ?? "NOTA") === type) : noteTable.list();
      return [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    },
    create: async (data: { type?: NoteType; title: string; content?: string; items?: ChecklistItem[] }) => {
      const now = new Date().toISOString();
      const note: Note = {
        id: createId(),
        type: data.type ?? "NOTA",
        title: data.title,
        content: data.content ?? "",
        items: data.items ?? (data.type === "LISTA" ? [] : undefined),
        createdAt: now,
        updatedAt: now,
      };
      noteTable.insert(note);
      return note;
    },
    update: async (id: string, data: Partial<Pick<Note, "title" | "content" | "items">>) => {
      const updated = noteTable.update(id, { ...data, updatedAt: new Date().toISOString() });
      if (!updated) throw new Error("Nota não encontrada");
      return updated;
    },
    remove: async (id: string) => {
      noteTable.remove(id);
    },
    addItem: async (id: string, text: string) => {
      const note = noteTable.get(id);
      if (!note) throw new Error("Lista não encontrada");
      const items = [...(note.items ?? []), { id: createId(), text, done: false }];
      const updated = noteTable.update(id, { items, updatedAt: new Date().toISOString() });
      return updated!;
    },
    toggleItem: async (id: string, itemId: string) => {
      const note = noteTable.get(id);
      if (!note) throw new Error("Lista não encontrada");
      const items = (note.items ?? []).map((item) => (item.id === itemId ? { ...item, done: !item.done } : item));
      const updated = noteTable.update(id, { items, updatedAt: new Date().toISOString() });
      return updated!;
    },
    removeItem: async (id: string, itemId: string) => {
      const note = noteTable.get(id);
      if (!note) throw new Error("Lista não encontrada");
      const items = (note.items ?? []).filter((item) => item.id !== itemId);
      const updated = noteTable.update(id, { items, updatedAt: new Date().toISOString() });
      return updated!;
    },
  },
  expenses: {
    list: async (params?: { from?: string; to?: string }) => {
      let items = expenseTable.list();
      if (params?.from) items = items.filter((e) => e.date >= params.from!);
      if (params?.to) items = items.filter((e) => e.date <= params.to!);
      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    create: async (data: {
      amount: number;
      description?: string;
      date?: string;
      installments?: number;
      superficial?: boolean;
    }) => {
      const date = data.date ?? new Date().toISOString();
      let created: Expense[];

      if (data.installments && data.installments > 1) {
        created = buildInstallmentExpenses(
          { amount: data.amount, description: data.description, date, superficial: data.superficial },
          data.installments,
          createId
        );
        for (const expense of created) expenseTable.insert(expense);
      } else {
        const expense: Expense = {
          id: createId(),
          amount: data.amount,
          description: data.description,
          date,
          superficial: data.superficial,
        };
        expenseTable.insert(expense);
        created = [expense];
      }

      for (const key of new Set(created.map((e) => dateKeyOf(e.date)))) recomputeDailySummary(key);

      const summaries = dailySummaryTable.list();
      const today = new Date();
      await checkOverspendingAndNotify(compareWeek(summaries, today), compareMonth(summaries, today));

      return created[0];
    },
    remove: async (id: string) => {
      const expense = expenseTable.get(id);
      expenseTable.remove(id);
      if (expense) recomputeDailySummary(dateKeyOf(expense.date));
    },
  },
  dailySummaries: {
    list: async (params?: { from?: string; to?: string }) => {
      let items = dailySummaryTable.list();
      if (params?.from) items = items.filter((s) => s.date >= params.from!);
      if (params?.to) items = items.filter((s) => s.date <= params.to!);
      return items.sort((a, b) => (a.date < b.date ? 1 : -1));
    },
  },
  bills: {
    list: async () =>
      [...billTable.list()].sort((a, b) => {
        const aSettled = a.status !== "PENDENTE";
        const bSettled = b.status !== "PENDENTE";
        if (aSettled !== bSettled) return aSettled ? 1 : -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }),
    create: async (data: {
      title: string;
      amount: number;
      dueDate: string;
      type: BillType;
      kind?: BillKind;
      priority?: boolean;
      recurring?: boolean;
    }) => {
      const bill: Bill = {
        id: createId(),
        title: data.title,
        amount: data.amount,
        dueDate: data.dueDate,
        type: data.type,
        kind: data.kind ?? (data.type === "ASSINATURA" ? "ASSINATURA" : "PAGAR"),
        status: "PENDENTE",
        priority: data.priority ?? false,
        paidDate: null,
        recurring: data.recurring ?? false,
        recurrenceId: null,
      };
      billTable.insert(bill);
      await scheduleBillNotifications(bill);

      if (bill.recurring) {
        for (const occurrence of buildRecurringOccurrences(bill, createId)) {
          billTable.insert(occurrence);
          await scheduleBillNotifications(occurrence);
        }
      }
      await syncCalendarWidgetFromTables();
      return bill;
    },
    update: async (id: string, data: Partial<Bill>) => {
      const existing = billTable.get(id);
      if (!existing) throw new Error("Conta não encontrada");

      const patch: Partial<Bill> = { ...data };
      if (data.status && data.status !== "PENDENTE" && existing.status === "PENDENTE") {
        patch.paidDate = data.paidDate ?? new Date().toISOString();
      } else if (data.status === "PENDENTE") {
        patch.paidDate = null;
      }

      const updated = billTable.update(id, patch);
      if (!updated) throw new Error("Conta não encontrada");

      if (updated.status !== "PENDENTE") {
        await cancelBillNotifications(updated.id);
      } else {
        await scheduleBillNotifications(updated);
      }

      if (data.recurring && !existing.recurring) {
        for (const occurrence of buildRecurringOccurrences(updated, createId)) {
          billTable.insert(occurrence);
          await scheduleBillNotifications(occurrence);
        }
      }
      await syncCalendarWidgetFromTables();
      return updated;
    },
    remove: async (id: string) => {
      billTable.remove(id);
      await cancelBillNotifications(id);
      await syncCalendarWidgetFromTables();
    },
  },
  wallet: {
    // Saldo é sempre recalculado a partir dos gastos e contas já existentes —
    // não existe um "livro-caixa" à parte pra manter sincronizado. Qualquer
    // gasto novo (lançado à mão ou pela Central de Notificações) e qualquer
    // conta marcada como paga/recebida entram na conta automaticamente,
    // porque ambos os fluxos já passam por api.expenses.create/api.bills.update.
    getBase: async (): Promise<WalletBase> => loadWalletBase(),
    setBase: async (amount: number): Promise<WalletBase> => {
      const base: WalletBase = { baseAmount: amount, baseSetAt: new Date().toISOString() };
      localStorage.setItem(WALLET_KEY, JSON.stringify(base));
      return base;
    },
    getBalance: async (): Promise<number> => {
      const base = loadWalletBase();
      const expensesSince = expenseTable.list().filter((e) => e.date >= base.baseSetAt);
      const settledBillsSince = billTable
        .list()
        .filter((b) => b.status !== "PENDENTE" && b.paidDate && b.paidDate >= base.baseSetAt);

      const expenseTotal = expensesSince.reduce((sum, e) => sum + e.amount, 0);
      const billsOut = settledBillsSince
        .filter((b) => b.kind !== "RECEBER")
        .reduce((sum, b) => sum + b.amount, 0);
      const billsIn = settledBillsSince
        .filter((b) => b.kind === "RECEBER")
        .reduce((sum, b) => sum + b.amount, 0);

      return base.baseAmount - expenseTotal - billsOut + billsIn;
    },
  },
  documents: {
    list: async () =>
      [...documentTable.list()].sort(
        (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      ),
    add: async (file: File, type: DocumentType) => {
      const coverDataUrl = await generateCoverThumbnail(file, type);
      const doc: DocumentMeta = {
        id: createId(),
        title: file.name.replace(/\.(pdf|epub)$/i, ""),
        type,
        addedAt: new Date().toISOString(),
        sizeBytes: file.size,
        coverDataUrl,
      };
      await saveFile(doc.id, file);
      documentTable.insert(doc);
      return doc;
    },
    getFile: (id: string) => loadFile(id),
    getMeta: async (id: string) => documentTable.get(id),
    remove: async (id: string) => {
      documentTable.remove(id);
      await deleteFile(id);
      readingProgressTable.remove(id);
    },
  },
  readingProgress: {
    get: async (documentId: string) => readingProgressTable.get(documentId),
    save: async (documentId: string, location: string) => {
      const existing = readingProgressTable.get(documentId);
      const entry: ReadingProgress = { id: documentId, location, updatedAt: new Date().toISOString() };
      if (existing) {
        readingProgressTable.update(documentId, entry);
      } else {
        readingProgressTable.insert(entry);
      }
    },
  },
};
