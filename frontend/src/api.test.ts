import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./api";

// Testes de idempotência do fluxo de contas recorrentes (Fase 7, etapa B do
// plano Stella Founds) — cobre exatamente o cenário revisado na auditoria:
// api.bills.list() dispara ensureRuleOccurrences() a cada chamada, então
// "rodar duas vezes" é o caminho normal do app (toda vez que o usuário volta
// pra tela de Contas), não um caso extremo.
describe("api.bills — recorrência: execução única, repetida e apagada", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("cria a série de ocorrências numa primeira chamada (execução única)", async () => {
    const created = await api.bills.create({
      title: "Internet",
      amount: 109.9,
      dueDate: new Date().toISOString(),
      type: "BOLETO",
      recurring: true,
      recurrenceInterval: 1,
    });

    const all = await api.bills.list();
    const series = all.filter((b) => b.recurrenceId === created.recurrenceId);
    expect(series.length).toBeGreaterThan(1);
  });

  it("chamar bills.list() de novo não gera ocorrências extras (idempotência)", async () => {
    const created = await api.bills.create({
      title: "Internet",
      amount: 109.9,
      dueDate: new Date().toISOString(),
      type: "BOLETO",
      recurring: true,
      recurrenceInterval: 1,
    });

    const firstList = await api.bills.list();
    const secondList = await api.bills.list();
    const firstSeries = firstList.filter((b) => b.recurrenceId === created.recurrenceId);
    const secondSeries = secondList.filter((b) => b.recurrenceId === created.recurrenceId);
    expect(secondSeries).toHaveLength(firstSeries.length);
  });

  it("apagar uma ocorrência do meio da série não a recria (regressão do bug corrigido na etapa A)", async () => {
    const created = await api.bills.create({
      title: "Internet",
      amount: 109.9,
      dueDate: new Date().toISOString(),
      type: "BOLETO",
      recurring: true,
      recurrenceInterval: 1,
    });

    const before = await api.bills.list();
    const series = before.filter((b) => b.recurrenceId === created.recurrenceId);
    const middle = series[Math.floor(series.length / 2)];
    const middleMonthKey = middle.dueDate.slice(0, 7);

    await api.bills.remove(middle.id);

    const afterFirstReload = await api.bills.list();
    const afterSecondReload = await api.bills.list();

    const stillGoneAfterFirst = !afterFirstReload.some(
      (b) => b.recurrenceId === created.recurrenceId && b.dueDate.slice(0, 7) === middleMonthKey
    );
    const stillGoneAfterSecond = !afterSecondReload.some(
      (b) => b.recurrenceId === created.recurrenceId && b.dueDate.slice(0, 7) === middleMonthKey
    );

    expect(stillGoneAfterFirst).toBe(true);
    expect(stillGoneAfterSecond).toBe(true);
    // idempotência: a segunda chamada não muda a contagem em relação à primeira
    const activeAfterFirst = afterFirstReload.filter((b) => b.recurrenceId === created.recurrenceId);
    const activeAfterSecond = afterSecondReload.filter((b) => b.recurrenceId === created.recurrenceId);
    expect(activeAfterSecond).toHaveLength(activeAfterFirst.length);
  });

  it("parar a recorrência impede novas ocorrências, mas preserva as já materializadas", async () => {
    const created = await api.bills.create({
      title: "Internet",
      amount: 109.9,
      dueDate: new Date().toISOString(),
      type: "BOLETO",
      recurring: true,
      recurrenceInterval: 1,
    });

    const before = await api.bills.list();
    const seriesBefore = before.filter((b) => b.recurrenceId === created.recurrenceId);
    expect(created.recurrenceId).toBeTruthy();

    await api.financeRules.stop(created.recurrenceId!);

    const after = await api.bills.list();
    const seriesAfter = after.filter((b) => b.recurrenceId === created.recurrenceId);
    expect(seriesAfter).toHaveLength(seriesBefore.length);
  });
});

describe("api.bills — status e pagamento", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("marcar como paga preserva paymentDate e não cria nova conta", async () => {
    const bill = await api.bills.create({
      title: "Assinatura",
      amount: 39.9,
      dueDate: new Date().toISOString(),
      type: "ASSINATURA",
    });

    const beforeCount = (await api.bills.list()).length;
    const paidDate = new Date(2026, 0, 15).toISOString();
    const updated = await api.bills.update(bill.id, { status: "PAGA", paidDate });

    expect(updated.status).toBe("PAGA");
    expect(updated.paidDate).toBe(paidDate);

    const afterCount = (await api.bills.list()).length;
    expect(afterCount).toBe(beforeCount);
  });

  it("reverter status pra PENDENTE limpa paidDate", async () => {
    const bill = await api.bills.create({
      title: "Assinatura",
      amount: 39.9,
      dueDate: new Date().toISOString(),
      type: "ASSINATURA",
    });
    await api.bills.update(bill.id, { status: "PAGA", paidDate: new Date().toISOString() });
    const reverted = await api.bills.update(bill.id, { status: "PENDENTE" });

    expect(reverted.status).toBe("PENDENTE");
    expect(reverted.paidDate).toBeNull();
  });
});

describe("api — IDs únicos", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("criar duas contas produz IDs diferentes", async () => {
    const a = await api.bills.create({
      title: "A",
      amount: 10,
      dueDate: new Date().toISOString(),
      type: "OUTRO",
    });
    const b = await api.bills.create({
      title: "B",
      amount: 20,
      dueDate: new Date().toISOString(),
      type: "OUTRO",
    });
    expect(a.id).not.toBe(b.id);
  });
});
