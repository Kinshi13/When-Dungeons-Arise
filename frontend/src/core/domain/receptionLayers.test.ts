import { describe, it, expect } from "vitest";
import { parallaxTransform, RECEPTION_LAYERS } from "./receptionLayers";

describe("parallaxTransform", () => {
  it("gera translate3d com o maxOffsetPx da camada", () => {
    const sky = RECEPTION_LAYERS.find((l) => l.id === "sky")!;
    const style = parallaxTransform("sky");
    expect(style?.transform).toBe(
      `translate3d(calc(var(--parallax-x, 0) * ${sky.maxOffsetPx}px), calc(var(--parallax-y, 0) * ${sky.maxOffsetPx}px), 0)`
    );
  });

  it("camada desabilitada não gera estilo", () => {
    const layer = RECEPTION_LAYERS.find((l) => l.id === "sky")!;
    layer.enabled = false;
    expect(parallaxTransform("sky")).toBeUndefined();
    layer.enabled = true;
  });

  it("camada inexistente não quebra, só devolve undefined", () => {
    expect(parallaxTransform("camada-que-nao-existe")).toBeUndefined();
  });

  it("cada camada usa o maxOffsetPx exato do manifest do pacote de assets v2", () => {
    const expected: Record<string, number> = {
      sky: 4,
      architecture: 8,
      constellations: 10,
      midground: 12,
      desk: 16,
      effects: 14,
      character: 20,
      foreground: 26,
    };
    for (const [id, maxOffsetPx] of Object.entries(expected)) {
      expect(RECEPTION_LAYERS.find((l) => l.id === id)?.maxOffsetPx).toBe(maxOffsetPx);
    }
  });

  it("ordem das camadas segue profundidade crescente (empilhamento visual via DOM order)", () => {
    const depths = RECEPTION_LAYERS.map((l) => l.depth);
    for (let i = 1; i < depths.length; i++) {
      expect(depths[i]).toBeGreaterThan(depths[i - 1]);
    }
  });

  it("mantém os 8 slots do manifest (nenhum removido, mesmo sem asset de produção)", () => {
    const ids = RECEPTION_LAYERS.map((l) => l.id);
    expect(ids).toEqual([
      "sky",
      "architecture",
      "constellations",
      "midground",
      "desk",
      "effects",
      "character",
      "foreground",
    ]);
  });

  it("só sky/constellations/effects estão habilitadas — as demais não têm asset de produção validado (rollback do pacote v2)", () => {
    const enabledIds = RECEPTION_LAYERS.filter((l) => l.enabled).map((l) => l.id);
    expect(enabledIds.sort()).toEqual(["constellations", "effects", "sky"]);
  });

  it("nenhuma camada habilitada ultrapassa o maior offset do manifest (foreground, 26px)", () => {
    for (const layer of RECEPTION_LAYERS.filter((l) => l.enabled)) {
      const style = parallaxTransform(layer.id)!;
      const travel = Number(style.transform.match(/\* ([\d.]+)px/)![1]);
      expect(travel).toBeLessThanOrEqual(26);
    }
  });
});
