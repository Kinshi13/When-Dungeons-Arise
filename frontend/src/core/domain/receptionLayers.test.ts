import { describe, it, expect } from "vitest";
import { parallaxOffsetFor, RECEPTION_LAYERS, RECEPTION_PARALLAX_MAX_TRAVEL_PX } from "./receptionLayers";

describe("parallaxOffsetFor", () => {
  it("escala o deslocamento pelo parallaxFactor da camada", () => {
    const offset = parallaxOffsetFor("sky", { x: 1, y: -1 });
    const sky = RECEPTION_LAYERS.find((l) => l.id === "sky")!;
    expect(offset.x).toBeCloseTo(RECEPTION_PARALLAX_MAX_TRAVEL_PX * sky.parallaxFactor);
    expect(offset.y).toBeCloseTo(-RECEPTION_PARALLAX_MAX_TRAVEL_PX * sky.parallaxFactor);
  });

  it("camadas ainda não habilitadas (sem asset de produção) não se movem", () => {
    const offset = parallaxOffsetFor("architecture", { x: 1, y: 1 });
    expect(offset).toEqual({ x: 0, y: 0 });
  });

  it("camada inexistente não quebra, só devolve zero", () => {
    const offset = parallaxOffsetFor("camada-que-nao-existe", { x: 1, y: 1 });
    expect(offset).toEqual({ x: 0, y: 0 });
  });

  it("ponteiro parado (0,0) não desloca nenhuma camada habilitada", () => {
    expect(parallaxOffsetFor("sky", { x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    expect(parallaxOffsetFor("constellations", { x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it("nenhuma camada ultrapassa o deslocamento máximo (sem exagero)", () => {
    for (const layer of RECEPTION_LAYERS.filter((l) => l.enabled)) {
      const offset = parallaxOffsetFor(layer.id, { x: 1, y: 1 });
      expect(Math.abs(offset.x)).toBeLessThanOrEqual(RECEPTION_PARALLAX_MAX_TRAVEL_PX);
      expect(Math.abs(offset.y)).toBeLessThanOrEqual(RECEPTION_PARALLAX_MAX_TRAVEL_PX);
    }
  });
});
