import type { Note, ChecklistItem } from "./api";
import { syncTable, type SyncStatus } from "./syncEngine";

interface RemoteNoteRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  items: ChecklistItem[] | null;
  created_at: string;
  updated_at: string;
  deleted: boolean;
}

function toRemote(n: Note, userId: string): RemoteNoteRow {
  return {
    id: n.id,
    user_id: userId,
    type: n.type,
    title: n.title,
    content: n.content,
    items: n.items ?? null,
    created_at: n.createdAt,
    updated_at: n.updatedAt,
    deleted: !!n.deleted,
  };
}

function fromRemote(row: RemoteNoteRow): Note {
  return {
    id: row.id,
    type: row.type as Note["type"],
    title: row.title,
    content: row.content,
    items: row.items ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deleted: row.deleted,
  };
}

export async function syncNotesNow(): Promise<SyncStatus> {
  return syncTable<Note, RemoteNoteRow>({
    localTableName: "notes",
    remoteTableName: "notes",
    toRemote,
    fromRemote,
  });
}
