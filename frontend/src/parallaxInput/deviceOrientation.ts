// Lógica pura de calibração/normalização do DeviceOrientationEvent — sem
// nenhum acesso a DOM/window aqui de propósito, só pra ficar testável
// isoladamente (useReceptionParallax.ts é quem de fato registra o listener
// e chama essas funções a cada evento).

export interface OrientationSample {
  beta: number | null; // inclinação frente/trás, -180 a 180
  gamma: number | null; // inclinação esquerda/direita, -90 a 90
}

export interface OrientationCalibration {
  neutralBeta: number;
  neutralGamma: number;
}

// Sensibilidade: quantos graus de inclinação a partir do neutro levam ao
// limite -1/+1 (seção 7 do briefing — conservador de propósito: o efeito
// deve parecer profundidade, não câmera brusca).
export const ORIENTATION_SENSITIVITY_GAMMA_DEG = 12;
export const ORIENTATION_SENSITIVITY_BETA_DEG = 10;

export function isValidSample(sample: OrientationSample): boolean {
  return sample.beta !== null && sample.gamma !== null;
}

export function calibrate(sample: OrientationSample): OrientationCalibration | null {
  if (!isValidSample(sample)) return null;
  return { neutralBeta: sample.beta!, neutralGamma: sample.gamma! };
}

// Converte uma leitura crua + calibração em -1..1 já clampado. x segue gamma
// (inclinar esquerda/direita), y segue beta (inclinar frente/trás) — seção 3
// do briefing. Nunca usa valor absoluto direto, sempre delta a partir do
// neutro capturado na calibração.
export function normalizeOrientation(
  sample: OrientationSample,
  calibration: OrientationCalibration
): { x: number; y: number } | null {
  if (!isValidSample(sample)) return null;
  const deltaX = sample.gamma! - calibration.neutralGamma;
  const deltaY = sample.beta! - calibration.neutralBeta;
  return {
    x: Math.max(-1, Math.min(1, deltaX / ORIENTATION_SENSITIVITY_GAMMA_DEG)),
    y: Math.max(-1, Math.min(1, deltaY / ORIENTATION_SENSITIVITY_BETA_DEG)),
  };
}
