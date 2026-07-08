// Infraestrutura de backfill/migração de dados (Fase 7, item 4.2 da
// auditoria) — construída ANTES de existir uma migração real pra rodar
// (hoje o app nunca teve uma mudança de schema destrutiva). O objetivo é
// não precisar improvisar isso sob pressão na próxima vez que um schema
// mudar de forma incompatível.

export interface MigrationResult {
  processed: number;
  migrated: number;
  skipped: number;
  duplicatesAvoided: number;
  invalid: number;
  errors: { message: string; context?: unknown }[];
}

export function emptyMigrationResult(): MigrationResult {
  return { processed: 0, migrated: 0, skipped: 0, duplicatesAvoided: 0, invalid: 0, errors: [] };
}

// Cada migração é responsável pela própria idempotência (rodar de novo não
// deve produzir efeito diferente) — o BackfillCheckpoint é uma segunda
// camada de proteção (evita re-executar uma migração já concluída), não a
// única.
export interface Migration {
  id: string; // estável — usado como chave do checkpoint, nunca reutilizar pra outra migração
  version: number; // ordem de execução
  run(): Promise<MigrationResult>;
}

export type CheckpointStatus = "in-progress" | "done" | "failed";

export interface BackfillReport {
  results: Record<string, MigrationResult>;
  skippedAlreadyDone: string[];
  failedMigrationIds: string[];
}
