import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { ParallaxInputSource, SensorPermissionState } from "./parallaxInput/types";
import {
  calibrate,
  normalizeOrientation,
  type OrientationCalibration,
  type OrientationSample,
} from "./parallaxInput/deviceOrientation";
import { initialPermissionState, requestOrientationPermission } from "./parallaxInput/sensorPermission";

export interface ParallaxController {
  source: ParallaxInputSource;
  active: boolean;
  permission: SensorPermissionState;
  // Só deve ser chamada a partir de um gesto explícito do usuário (botão
  // "Ativar movimento da cena") — nunca automaticamente.
  requestSensor: () => Promise<void>;
  recalibrate: () => void;
}

const DEAD_ZONE = 0.03;
// Fração do caminho até o alvo percorrida a cada frame — não é "1 frame =
// chegou", é uma mola crítica simples (current += (target-current)*fator).
const SMOOTHING = 0.12;

function clamp(v: number): number {
  return Math.max(-1, Math.min(1, v));
}

function applyDeadZone(v: number): number {
  return Math.abs(v) < DEAD_ZONE ? 0 : v;
}

// Sistema único de input adaptativo de parallax (Fase 7, etapa H evoluída
// pra multiplataforma): mouse/pointer no desktop, inclinação do aparelho no
// mobile quando permitido, touch como fallback — todos alimentam o MESMO
// alvo (x,y) normalizado -1..1; nenhuma camada (PNG ou SVG) sabe de onde o
// movimento veio, ela só lê --parallax-x/--parallax-y (custom properties
// CSS escritas aqui, ver core/domain/receptionLayers.ts:parallaxTransform).
//
// Um único requestAnimationFrame contínuo faz o smoothing (current persegue
// target) e escreve o resultado direto no container via
// style.setProperty — nunca via setState do React a cada frame (seção 15
// do briefing: seria re-renderizar dezenas de componentes por movimento).
// O React state aqui (source/active/permission) só muda em eventos raros
// (trocar de fonte, conceder/negar sensor), não a cada frame.
export function useReceptionParallax(containerRef: RefObject<HTMLElement | null>, enabled: boolean): ParallaxController {
  const [source, setSource] = useState<ParallaxInputSource>("idle");
  const [active, setActive] = useState(false);
  const [permission, setPermission] = useState<SensorPermissionState>(() => initialPermissionState());

  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);
  const calibrationRef = useRef<OrientationCalibration | null>(null);
  const sourceRef = useRef<ParallaxInputSource>("idle");

  const setSourceBoth = useCallback((s: ParallaxInputSource) => {
    if (sourceRef.current === s) return;
    sourceRef.current = s;
    setSource(s);
  }, []);

  // Exposto pra recalibração manual e reaproveitado internamente (retomar
  // do segundo plano, rotação de tela) — só invalida o neutro capturado; o
  // próximo evento de orientação recaptura (seção 5 do briefing).
  const recalibrate = useCallback(() => {
    calibrationRef.current = null;
  }, []);

  const requestSensor = useCallback(async () => {
    const result = await requestOrientationPermission();
    setPermission(result);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!enabled || !el) {
      targetRef.current = { x: 0, y: 0 };
      currentRef.current = { x: 0, y: 0 };
      el?.style.setProperty("--parallax-x", "0");
      el?.style.setProperty("--parallax-y", "0");
      setActive(false);
      setSourceBoth("idle");
      return;
    }

    function onMouseMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetRef.current = { x: applyDeadZone(clamp(x)), y: applyDeadZone(clamp(y)) };
      setSourceBoth("pointer");
      setActive(true);
    }

    // Seção 2 do briefing: quando o ponteiro sai, volta suavemente pro
    // neutro — só zera o ALVO, quem faz o "suavemente" é o smoothing no RAF.
    function onMouseLeave() {
      targetRef.current = { x: 0, y: 0 };
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 0) return;
      const rect = el!.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.touches[0].clientY - rect.top) / rect.height) * 2 - 1;
      targetRef.current = { x: applyDeadZone(clamp(x)), y: applyDeadZone(clamp(y)) };
      // Segurar o aparelho durante um gesto de toque não deve "roubar" a
      // fonte visualmente relevante quando a orientação já está ativa.
      if (sourceRef.current !== "device-orientation") setSourceBoth("touch");
      setActive(true);
    }

    function onOrientation(e: DeviceOrientationEvent) {
      const sample: OrientationSample = { beta: e.beta, gamma: e.gamma };
      if (!calibrationRef.current) {
        calibrationRef.current = calibrate(sample);
        return; // primeiro evento (ou o primeiro após recalibrate) só calibra
      }
      const result = normalizeOrientation(sample, calibrationRef.current);
      if (!result) return;
      targetRef.current = { x: applyDeadZone(result.x), y: applyDeadZone(result.y) };
      setSourceBoth("device-orientation");
      setActive(true);
    }

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("touchmove", onTouchMove, { passive: true });

    const orientationEnabled = permission === "granted";
    if (orientationEnabled) {
      window.addEventListener("deviceorientation", onOrientation);
    }

    function tick() {
      const t = targetRef.current;
      const c = currentRef.current;
      c.x += (t.x - c.x) * SMOOTHING;
      c.y += (t.y - c.y) * SMOOTHING;
      el!.style.setProperty("--parallax-x", c.x.toFixed(4));
      el!.style.setProperty("--parallax-y", c.y.toFixed(4));
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);

    // Seção 5/14 do briefing: recalibrar ao voltar da segunda plano e após
    // rotação significativa de tela — nunca a cada pequeno movimento.
    function onVisibilityChange() {
      if (document.visibilityState === "visible") recalibrate();
    }
    function onOrientationChange() {
      recalibrate();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("orientationchange", onOrientationChange);

    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("touchmove", onTouchMove);
      if (orientationEnabled) window.removeEventListener("deviceorientation", onOrientation);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("orientationchange", onOrientationChange);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      calibrationRef.current = null;
    };
  }, [containerRef, enabled, permission, recalibrate, setSourceBoth]);

  return { source, active, permission, requestSensor, recalibrate };
}
