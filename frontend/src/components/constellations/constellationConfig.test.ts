import { describe, it, expect } from "vitest";
import { densityFor, generateNodes, generateLinks } from "./constellationConfig";

describe("densityFor", () => {
  it("mobile tem a menor densidade (poucas linhas/nós)", () => {
    const mobile = densityFor("mobile");
    const tablet = densityFor("tablet");
    const desktop = densityFor("desktop");
    expect(mobile.nodeCount).toBeLessThan(tablet.nodeCount);
    expect(tablet.nodeCount).toBeLessThan(desktop.nodeCount);
  });
});

describe("generateNodes", () => {
  it("gera a quantidade pedida de pontos", () => {
    expect(generateNodes(10, 1)).toHaveLength(10);
  });

  it("é determinístico: mesma seed gera a mesma composição", () => {
    const a = generateNodes(8, 42);
    const b = generateNodes(8, 42);
    expect(a).toEqual(b);
  });

  it("seeds diferentes geram composições diferentes", () => {
    const a = generateNodes(8, 1);
    const b = generateNodes(8, 2);
    expect(a).not.toEqual(b);
  });

  it("todos os pontos ficam dentro do viewBox 0..100", () => {
    for (const point of generateNodes(30, 7)) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(100);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(100);
    }
  });
});

describe("generateLinks", () => {
  it("só conecta pontos dentro da distância máxima", () => {
    const points = [
      { x: 0, y: 0, r: 1 },
      { x: 5, y: 0, r: 1 },
      { x: 90, y: 90, r: 1 },
    ];
    const links = generateLinks(points, 0.1); // maxDist = 10
    expect(links).toEqual([[0, 1]]);
  });

  it("nenhum par além da distância máxima gera link", () => {
    const points = [
      { x: 0, y: 0, r: 1 },
      { x: 100, y: 100, r: 1 },
    ];
    expect(generateLinks(points, 0.05)).toEqual([]);
  });

  it("é determinístico pra um mesmo conjunto de pontos", () => {
    const points = generateNodes(12, 3);
    expect(generateLinks(points, 0.2)).toEqual(generateLinks(points, 0.2));
  });
});
