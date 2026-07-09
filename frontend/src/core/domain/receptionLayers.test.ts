import { describe, it, expect } from "vitest";
import { parallaxTransform, RECEPTION_LAYERS, RECEPTION_PARALLAX_MAX_TRAVEL_PX } from "./receptionLayers";

describe("parallaxTransform", () => {
  it("gera translate3d com o travel correto (fator × teto) pra uma camada habilitada", () => {
    const sky = RECEPTION_LAYERS.find((l) => l.id === "sky")!;
    const travel = RECEPTION_PARALLAX_MAX_TRAVEL_PX * sky.parallaxFactor;
    const style = parallaxTransform("sky");
    expect(style?.transform).toBe(
      `translate3d(calc(var(--parallax-x, 0) * ${travel}px), calc(var(--parallax-y, 0) * ${travel}px), 0)`
    );
  });

  it("camadas ainda não habilitadas (sem asset de produção) não geram estilo", () => {
    expect(parallaxTransform("architecture")).toBeUndefined();
  });

  it("camada inexistente não quebra, só devolve undefined", () => {
    expect(parallaxTransform("camada-que-nao-existe")).toBeUndefined();
  });

  it("constellations tem travel 4x maior que sky (0.08 / 0.02)", () => {
    const skyStyle = parallaxTransform("sky")!;
    const constellationsStyle = parallaxTransform("constellations")!;
    const skyTravel = Number(skyStyle.transform.match(/\* ([\d.]+)px/)![1]);
    const constellationsTravel = Number(constellationsStyle.transform.match(/\* ([\d.]+)px/)![1]);
    expect(constellationsTravel).toBeCloseTo(skyTravel * 4);
  });

  it("nenhuma camada habilitada ultrapassa o teto máximo de travel", () => {
    for (const layer of RECEPTION_LAYERS.filter((l) => l.enabled)) {
      const style = parallaxTransform(layer.id)!;
      const travel = Number(style.transform.match(/\* ([\d.]+)px/)![1]);
      expect(travel).toBeLessThanOrEqual(RECEPTION_PARALLAX_MAX_TRAVEL_PX);
    }
  });
});
