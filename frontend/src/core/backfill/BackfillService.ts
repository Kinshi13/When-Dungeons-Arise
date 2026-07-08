import { BackfillCheckpoint } from "./BackfillCheckpoint";
import { emptyMigrationResult, type BackfillReport, type Migration } from "./types";

// Orquestra migrations registradas, em ordem de versão. Idempotência vem de
// DUAS camadas: cada Migration.run() já deve ser idempotente por contrato
// (rodar de novo sem ter sido interrompida não deve duplicar nada), e o
// checkpoint evita re-executar uma migração já concluída — mesmo que ela
// não fosse perfeitamente idempotente, isso ainda protege o caso comum.
//
// Erros nunca são escondidos: se uma migração lança uma exceção, ela entra
// no relatório com a mensagem e a migração fica marcada "failed" (não
// "done") — a próxima chamada tenta de novo, em vez de silenciosamente
// deixar os dados naquele estado intermediário pra sempre.
export async function runBackfill(migrations: Migration[]): Promise<BackfillReport> {
  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  const report: BackfillReport = { results: {}, skippedAlreadyDone: [], failedMigrationIds: [] };

  for (const migration of sorted) {
    if (BackfillCheckpoint.isDone(migration.id)) {
      report.skippedAlreadyDone.push(migration.id);
      continue;
    }

    BackfillCheckpoint.markInProgress(migration.id);
    try {
      const result = await migration.run();
      report.results[migration.id] = result;
      BackfillCheckpoint.markDone(migration.id);
    } catch (err) {
      const result = emptyMigrationResult();
      result.errors.push({ message: err instanceof Error ? err.message : String(err) });
      report.results[migration.id] = result;
      report.failedMigrationIds.push(migration.id);
      BackfillCheckpoint.markFailed(migration.id);
    }
  }

  return report;
}
