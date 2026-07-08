import { describe, it, expect, beforeEach } from "vitest";
import { runBackfill } from "./BackfillService";
import { BackfillCheckpoint } from "./BackfillCheckpoint";
import { emptyMigrationResult, type Migration } from "./types";

function migration(id: string, version: number, run: Migration["run"]): Migration {
  return { id, version, run };
}

describe("runBackfill", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("executa uma migração pendente e marca como concluída (execução única)", async () => {
    let calls = 0;
    const m = migration("m1", 1, async () => {
      calls += 1;
      return { ...emptyMigrationResult(), processed: 3, migrated: 3 };
    });

    const report = await runBackfill([m]);

    expect(calls).toBe(1);
    expect(report.results.m1.migrated).toBe(3);
    expect(report.skippedAlreadyDone).toHaveLength(0);
    expect(BackfillCheckpoint.isDone("m1")).toBe(true);
  });

  it("rodar de novo não re-executa uma migração já concluída (idempotência via checkpoint)", async () => {
    let calls = 0;
    const m = migration("m1", 1, async () => {
      calls += 1;
      return emptyMigrationResult();
    });

    await runBackfill([m]);
    const secondReport = await runBackfill([m]);

    expect(calls).toBe(1); // não rodou de novo na segunda chamada
    expect(secondReport.skippedAlreadyDone).toEqual(["m1"]);
  });

  it("migração interrompida no meio (in-progress, nunca chegou a done) é retomada na próxima execução", async () => {
    // Simula o app fechando entre markInProgress e a conclusão real.
    BackfillCheckpoint.markInProgress("m1");
    let calls = 0;
    const m = migration("m1", 1, async () => {
      calls += 1;
      return { ...emptyMigrationResult(), migrated: 1 };
    });

    const report = await runBackfill([m]);

    expect(calls).toBe(1); // não foi tratada como "já feita" só por estar in-progress
    expect(report.skippedAlreadyDone).toHaveLength(0);
    expect(BackfillCheckpoint.isDone("m1")).toBe(true);
  });

  it("erro na migração não é escondido: aparece no relatório e ela não fica marcada como concluída", async () => {
    const m = migration("m1", 1, async () => {
      throw new Error("dado inválido no registro X");
    });

    const report = await runBackfill([m]);

    expect(report.failedMigrationIds).toEqual(["m1"]);
    expect(report.results.m1.errors[0].message).toContain("dado inválido");
    expect(BackfillCheckpoint.isDone("m1")).toBe(false);
    expect(BackfillCheckpoint.get("m1")).toBe("failed");
  });

  it("migração que falhou é tentada de novo na próxima execução (não fica presa)", async () => {
    let attempt = 0;
    const m = migration("m1", 1, async () => {
      attempt += 1;
      if (attempt === 1) throw new Error("falha temporária");
      return { ...emptyMigrationResult(), migrated: 1 };
    });

    const firstReport = await runBackfill([m]);
    const secondReport = await runBackfill([m]);

    expect(firstReport.failedMigrationIds).toEqual(["m1"]);
    expect(secondReport.failedMigrationIds).toHaveLength(0);
    expect(secondReport.results.m1.migrated).toBe(1);
    expect(BackfillCheckpoint.isDone("m1")).toBe(true);
  });

  it("roda múltiplas migrações em ordem de versão", async () => {
    const order: string[] = [];
    const m2 = migration("m2", 2, async () => {
      order.push("m2");
      return emptyMigrationResult();
    });
    const m1 = migration("m1", 1, async () => {
      order.push("m1");
      return emptyMigrationResult();
    });

    await runBackfill([m2, m1]); // registradas fora de ordem de propósito

    expect(order).toEqual(["m1", "m2"]);
  });
});
