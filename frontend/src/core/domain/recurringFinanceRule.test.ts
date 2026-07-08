import { describe, it, expect } from "vitest";
import {
  upcomingDueDates,
  buildMissingRuleOccurrences,
  RULE_MONTHS_AHEAD,
  type RecurringFinanceRule,
} from "./recurringFinanceRule";
import type { Bill } from "../../api";

function makeRule(overrides: Partial<RecurringFinanceRule> = {}): RecurringFinanceRule {
  return {
    id: "rule-1",
    title: "Internet",
    amount: 109.9,
    type: "BOLETO",
    kind: "PAGAR",
    priority: false,
    dueDay: 10,
    interval: 1,
    startDate: new Date(2026, 0, 10).toISOString(),
    autoGenerate: true,
    createdAt: new Date(2026, 0, 1).toISOString(),
    ...overrides,
  };
}

let idCounter = 0;
function createId() {
  idCounter += 1;
  return `id-${idCounter}`;
}

describe("upcomingDueDates", () => {
  it("gera RULE_MONTHS_AHEAD + 1 datas a partir de hoje quando não há endDate", () => {
    const rule = makeRule({ startDate: new Date(2020, 0, 10).toISOString() });
    const now = new Date(2026, 5, 1);
    const dates = upcomingDueDates(rule, RULE_MONTHS_AHEAD, now);
    expect(dates).toHaveLength(RULE_MONTHS_AHEAD + 1);
  });

  it("corta a geração no endDate mesmo dentro da janela", () => {
    const rule = makeRule({
      startDate: new Date(2026, 0, 10).toISOString(),
      endDate: new Date(2026, 2, 10).toISOString(),
    });
    const now = new Date(2026, 0, 1);
    const dates = upcomingDueDates(rule, RULE_MONTHS_AHEAD, now);
    // Só janeiro, fevereiro e março (até o endDate) — não os 12 meses cheios.
    expect(dates).toHaveLength(3);
  });

  it("não gera datas antes do startDate", () => {
    const rule = makeRule({ startDate: new Date(2026, 3, 10).toISOString() });
    const now = new Date(2026, 0, 1);
    const dates = upcomingDueDates(rule, RULE_MONTHS_AHEAD, now);
    expect(dates.every((d) => new Date(d) >= new Date(rule.startDate))).toBe(true);
  });
});

describe("buildMissingRuleOccurrences — execução única e repetida", () => {
  const now = new Date(2026, 0, 1);

  it("gera todas as ocorrências que faltam numa primeira execução", () => {
    const rule = makeRule();
    const missing = buildMissingRuleOccurrences(rule, [], createId, 2, now);
    expect(missing).toHaveLength(3); // monthsAhead=2 => 3 datas (i=0,1,2)
    expect(new Set(missing.map((b) => b.id)).size).toBe(3); // ids únicos
  });

  it("executar de novo com o resultado da primeira rodada não gera nada novo (idempotência)", () => {
    const rule = makeRule();
    const firstRun = buildMissingRuleOccurrences(rule, [], createId, 2, now);
    const secondRun = buildMissingRuleOccurrences(rule, firstRun, createId, 2, now);
    expect(secondRun).toHaveLength(0);
  });

  it("uma ocorrência apagada (deleted:true) continua contando como existente e não é recriada", () => {
    // Contrato do qual a correção do bug de recorrência (Fase 7, etapa A)
    // depende: a função não deve se importar com a flag `deleted` — quem
    // decide incluir ou não uma ocorrência apagada na lista é o chamador
    // (api.ts). Aqui simulamos que o chamador já decidiu incluí-la.
    const rule = makeRule();
    const allOccurrences = buildMissingRuleOccurrences(rule, [], createId, 2, now);
    const deletedOne: Bill = { ...allOccurrences[1], deleted: true };
    const remaining = allOccurrences.filter((b) => b.id !== allOccurrences[1].id);

    const missing = buildMissingRuleOccurrences(rule, [...remaining, deletedOne], createId, 2, now);
    expect(missing).toHaveLength(0);
  });

  it("dedupe é por mês, não por dia exato — editar o vencimento de uma ocorrência não duplica", () => {
    const rule = makeRule();
    const firstRun = buildMissingRuleOccurrences(rule, [], createId, 1, now);
    const edited = firstRun.map((b, i) => (i === 0 ? { ...b, dueDate: new Date(2026, 0, 25).toISOString() } : b));
    const secondRun = buildMissingRuleOccurrences(rule, edited, createId, 1, now);
    expect(secondRun).toHaveLength(0);
  });
});
