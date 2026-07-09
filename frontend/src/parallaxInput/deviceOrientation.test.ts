import { describe, it, expect } from "vitest";
import {
  calibrate,
  normalizeOrientation,
  isValidSample,
  ORIENTATION_SENSITIVITY_GAMMA_DEG,
  ORIENTATION_SENSITIVITY_BETA_DEG,
} from "./deviceOrientation";

describe("calibrate", () => {
  it("captura beta/gamma da amostra como neutro", () => {
    const cal = calibrate({ beta: 12, gamma: -4 });
    expect(cal).toEqual({ neutralBeta: 12, neutralGamma: -4 });
  });

  it("amostra inválida (beta/gamma null) não calibra", () => {
    expect(calibrate({ beta: null, gamma: -4 })).toBeNull();
    expect(calibrate({ beta: 12, gamma: null })).toBeNull();
  });
});

describe("isValidSample", () => {
  it("true só quando os dois campos existem", () => {
    expect(isValidSample({ beta: 1, gamma: 1 })).toBe(true);
    expect(isValidSample({ beta: null, gamma: 1 })).toBe(false);
    expect(isValidSample({ beta: 1, gamma: null })).toBe(false);
  });
});

describe("normalizeOrientation", () => {
  const calibration = { neutralBeta: 20, neutralGamma: 0 };

  it("sem inclinação (na calibração) devolve {0,0}", () => {
    const result = normalizeOrientation({ beta: 20, gamma: 0 }, calibration);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it("inclina exatamente até o limite de sensibilidade => ±1", () => {
    const right = normalizeOrientation({ beta: 20, gamma: ORIENTATION_SENSITIVITY_GAMMA_DEG }, calibration);
    expect(right!.x).toBeCloseTo(1);
    const down = normalizeOrientation({ beta: 20 + ORIENTATION_SENSITIVITY_BETA_DEG, gamma: 0 }, calibration);
    expect(down!.y).toBeCloseTo(1);
  });

  it("nunca ultrapassa -1..1 mesmo com inclinação exagerada", () => {
    const result = normalizeOrientation({ beta: 20 + 90, gamma: 90 }, calibration);
    expect(result!.x).toBe(1);
    expect(result!.y).toBe(1);
  });

  it("amostra inválida devolve null (mantém o último valor bom, não zera)", () => {
    expect(normalizeOrientation({ beta: null, gamma: 0 }, calibration)).toBeNull();
  });
});
