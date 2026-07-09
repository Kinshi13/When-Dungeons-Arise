import { describe, it, expect } from "vitest";
import { validateProductionLayers, type ProductionParallaxLayer } from "./receptionLayerAssets";

function layer(overrides: Partial<ProductionParallaxLayer>): ProductionParallaxLayer {
  return {
    id: "sky",
    asset: "/reception/sky.png",
    canvasWidth: 1080,
    canvasHeight: 1920,
    anchorX: 0,
    anchorY: 0,
    depth: 0.02,
    maxOffset: 4,
    ...overrides,
  };
}

describe("validateProductionLayers", () => {
  it("lista vazia não quebra e não valida nada", () => {
    expect(validateProductionLayers([])).toEqual({ valid: [], rejected: [] });
  });

  it("uma única camada é sempre válida (nada pra comparar ainda)", () => {
    const sky = layer({ id: "sky" });
    expect(validateProductionLayers([sky])).toEqual({ valid: [sky], rejected: [] });
  });

  it("camadas com o MESMO canvas passam todas", () => {
    const sky = layer({ id: "sky" });
    const architecture = layer({ id: "architecture", asset: "/reception/architecture.png" });
    const result = validateProductionLayers([sky, architecture]);
    expect(result.valid).toEqual([sky, architecture]);
    expect(result.rejected).toEqual([]);
  });

  it("camada com canvas DIFERENTE da referência é rejeitada com motivo, não descartada silenciosamente", () => {
    const sky = layer({ id: "sky", canvasWidth: 1080, canvasHeight: 1920 });
    const midground = layer({ id: "midground", canvasWidth: 853, canvasHeight: 113 });
    const result = validateProductionLayers([sky, midground]);
    expect(result.valid).toEqual([sky]);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].layer.id).toBe("midground");
    expect(result.rejected[0].reason).toContain("853x113");
    expect(result.rejected[0].reason).toContain("1080x1920");
  });

  it("mistura de válidas e inválidas: só as que batem com a referência entram em 'valid'", () => {
    const sky = layer({ id: "sky" });
    const architecture = layer({ id: "architecture" });
    const midgroundQuebrado = layer({ id: "midground", canvasWidth: 200, canvasHeight: 50 });
    const result = validateProductionLayers([sky, architecture, midgroundQuebrado]);
    expect(result.valid.map((l) => l.id)).toEqual(["sky", "architecture"]);
    expect(result.rejected.map((r) => r.layer.id)).toEqual(["midground"]);
  });
});
