import type { CheckpointStatus } from "./types";

// Chave própria, fora do prefixo "lembretes-app:" usado por core/repositories/
// storage.ts — checkpoint de backfill não é uma entidade de domínio (não
// passa por table()), é meta-informação sobre o processo de migração em si.
const STORAGE_KEY = "stella-founds:backfill-checkpoint";

type CheckpointMap = Record<string, CheckpointStatus>;

function readAll(): CheckpointMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(map: CheckpointMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

// Permite retomar depois de uma interrupção no meio (app fechado, aba
// recarregada): uma migração marcada "in-progress" nunca é tratada como
// concluída — só "done" conta como já feita.
export const BackfillCheckpoint = {
  get(migrationId: string): CheckpointStatus | undefined {
    return readAll()[migrationId];
  },
  isDone(migrationId: string): boolean {
    return readAll()[migrationId] === "done";
  },
  markInProgress(migrationId: string) {
    const map = readAll();
    map[migrationId] = "in-progress";
    writeAll(map);
  },
  markDone(migrationId: string) {
    const map = readAll();
    map[migrationId] = "done";
    writeAll(map);
  },
  markFailed(migrationId: string) {
    const map = readAll();
    map[migrationId] = "failed";
    writeAll(map);
  },
  // Só pra testes/depuração — reseta todo o progresso de backfill.
  clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
