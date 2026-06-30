import { createId, table } from "./storage";
import { saveFile, loadFile, deleteFile } from "./blobStore";
import {
  scheduleReminderNotification,
  cancelReminderNotification,
  scheduleBillNotifications,
  cancelBillNotifications,
} from "./notifications";

export type ReminderType = "REUNIAO" | "TAREFA" | "OUTRO";

export interface Reminder {
  id: string;
  title: string;
  description?: string | null;
  dateTime: string;
  type: ReminderType;
  done?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  description?: string | null;
  date: string;
}

export type DocumentType = "pdf" | "epub";

export interface DocumentMeta {
  id: string;
  title: string;
  type: DocumentType;
  addedAt: string;
  sizeBytes: number;
}

export interface ReadingProgress {
  id: string; // mesmo id do DocumentMeta
  // PDF: número da página. EPUB: CFI (localização interna do epub.js).
  location: string;
  updatedAt: string;
}

export type BillType = "CARTAO" | "BOLETO" | "ASSINATURA" | "OUTRO";

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  type: BillType;
  priority: boolean;
  paid: boolean;
}

// Todos os dados ficam salvos no próprio dispositivo (localStorage do WebView).
// Não há servidor: o app funciona offline e independente de rede ou outro aparelho.
const reminderTable = table<Reminder>("reminders");
const noteTable = table<Note>("notes");
const expenseTable = table<Expense>("expenses");
const billTable = table<Bill>("bills");
const documentTable = table<DocumentMeta>("documents");
const readingProgressTable = table<ReadingProgress>("reading-progress");

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
        done: false,
      };
      reminderTable.insert(reminder);
      await scheduleReminderNotification(reminder);
      return reminder;
    },
    update: async (id: string, data: Partial<Reminder>) => {
      const updated = reminderTable.update(id, data);
      if (!updated) throw new Error("Lembrete não encontrado");
      await scheduleReminderNotification(updated);
      return updated;
    },
    complete: async (id: string) => {
      const updated = reminderTable.update(id, { done: true });
      if (!updated) throw new Error("Lembrete não encontrado");
      await cancelReminderNotification(id);
      return updated;
    },
    remove: async (id: string) => {
      reminderTable.remove(id);
      await cancelReminderNotification(id);
    },
  },
  notes: {
    list: async () =>
      [...noteTable.list()].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    create: async (data: { title: string; content: string }) => {
      const now = new Date().toISOString();
      const note: Note = { id: createId(), title: data.title, content: data.content, createdAt: now, updatedAt: now };
      noteTable.insert(note);
      return note;
    },
    update: async (id: string, data: Partial<Pick<Note, "title" | "content">>) => {
      const updated = noteTable.update(id, { ...data, updatedAt: new Date().toISOString() });
      if (!updated) throw new Error("Nota não encontrada");
      return updated;
    },
    remove: async (id: string) => {
      noteTable.remove(id);
    },
  },
  expenses: {
    list: async (params?: { from?: string; to?: string }) => {
      let items = expenseTable.list();
      if (params?.from) items = items.filter((e) => e.date >= params.from!);
      if (params?.to) items = items.filter((e) => e.date <= params.to!);
      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    create: async (data: { amount: number; description?: string; date?: string }) => {
      const expense: Expense = {
        id: createId(),
        amount: data.amount,
        description: data.description,
        date: data.date ?? new Date().toISOString(),
      };
      expenseTable.insert(expense);
      return expense;
    },
    remove: async (id: string) => {
      expenseTable.remove(id);
    },
  },
  bills: {
    list: async () =>
      [...billTable.list()].sort((a, b) => {
        if (a.paid !== b.paid) return a.paid ? 1 : -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }),
    create: async (data: { title: string; amount: number; dueDate: string; type: BillType; priority?: boolean }) => {
      const bill: Bill = {
        id: createId(),
        title: data.title,
        amount: data.amount,
        dueDate: data.dueDate,
        type: data.type,
        priority: data.priority ?? false,
        paid: false,
      };
      billTable.insert(bill);
      await scheduleBillNotifications(bill);
      return bill;
    },
    update: async (id: string, data: Partial<Bill>) => {
      const updated = billTable.update(id, data);
      if (!updated) throw new Error("Conta não encontrada");
      if (updated.paid) {
        await cancelBillNotifications(updated.id);
      } else {
        await scheduleBillNotifications(updated);
      }
      return updated;
    },
    remove: async (id: string) => {
      billTable.remove(id);
      await cancelBillNotifications(id);
    },
  },
  documents: {
    list: async () =>
      [...documentTable.list()].sort(
        (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      ),
    add: async (file: File, type: DocumentType) => {
      const doc: DocumentMeta = {
        id: createId(),
        title: file.name.replace(/\.(pdf|epub)$/i, ""),
        type,
        addedAt: new Date().toISOString(),
        sizeBytes: file.size,
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
