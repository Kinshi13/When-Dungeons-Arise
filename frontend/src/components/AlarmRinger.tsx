import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getDueAlarm,
  markAlarmHandled,
  loadAlarmSound,
  loadAlarmChallengePrefs,
  type Alarm,
} from "../clockStore";
import { fetchPrimaryWeather, getCachedPrimaryWeather, type WeatherInfo } from "../weather";
import SlidingPuzzle from "./SlidingPuzzle";
import ChessChallenge from "./ChessChallenge";
import { useOverlayBackClose } from "../useOverlayBackClose";

const CHECK_INTERVAL_MS = 15000;

// Toque de fallback (Web Audio) pra quando o usuário não escolheu um áudio
// próprio — bipes insistentes num padrão de despertador clássico.
function startBeepLoop(): () => void {
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return () => {};
  const ctx = new AudioCtor();
  let stopped = false;

  function beepBurst(startAt: number) {
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, startAt + i * 0.25);
      gain.gain.linearRampToValueAtTime(0.18, startAt + i * 0.25 + 0.02);
      gain.gain.linearRampToValueAtTime(0.0001, startAt + i * 0.25 + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(startAt + i * 0.25);
      osc.stop(startAt + i * 0.25 + 0.2);
    }
  }

  let nextBurst = ctx.currentTime + 0.05;
  beepBurst(nextBurst);
  const interval = setInterval(() => {
    if (stopped) return;
    nextBurst += 2;
    beepBurst(nextBurst);
  }, 2000);

  return () => {
    stopped = true;
    clearInterval(interval);
    ctx.close();
  };
}

export default function AlarmRinger() {
  const [ringing, setRinging] = useState<Alarm | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [solved, setSolved] = useState(false);
  const stopAudioRef = useRef<(() => void) | null>(null);
  // Congela as preferências do desafio no momento em que o alarme começa a
  // tocar — mudar em Ajustes no meio do toque não troca o desafio na cara.
  const challenge = useMemo(() => loadAlarmChallengePrefs(), [ringing?.id]);

  // Vigia os despertadores: no carregamento, ao voltar pro app e a cada 15s.
  useEffect(() => {
    function check() {
      if (ringing) return;
      const due = getDueAlarm(new Date());
      if (due) setRinging(due);
    }
    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ringing]);

  // Ao começar a tocar: dispara o áudio em loop e busca o clima pro aviso.
  useEffect(() => {
    if (!ringing) return;
    let cancelled = false;

    (async () => {
      const soundBlob = await loadAlarmSound();
      if (cancelled) return;
      if (soundBlob) {
        const url = URL.createObjectURL(soundBlob);
        const audio = new Audio(url);
        audio.loop = true;
        audio.play().catch(() => {
          // Autoplay bloqueado (raro no WebView do app) — cai pro bip.
          stopAudioRef.current = startBeepLoop();
        });
        stopAudioRef.current = () => {
          audio.pause();
          URL.revokeObjectURL(url);
        };
      } else {
        stopAudioRef.current = startBeepLoop();
      }
    })();

    setWeather(getCachedPrimaryWeather());
    fetchPrimaryWeather().then((info) => {
      if (!cancelled && info) setWeather(info);
    });

    return () => {
      cancelled = true;
      stopAudioRef.current?.();
      stopAudioRef.current = null;
    };
  }, [ringing]);

  function handleSolved() {
    setSolved(true);
    stopAudioRef.current?.();
    stopAudioRef.current = null;
    if (ringing) markAlarmHandled(ringing.id, new Date());
  }

  function handleClose() {
    setRinging(null);
    setSolved(false);
    setWeather(null);
  }

  // O alarme sempre ganha de qualquer overlay comum (seção 36 do spec): Voltar
  // não pode simplesmente descartar um despertador TOCANDO (o desafio existe
  // bem pra isso) — mas depois de resolvido, a tela "Bom dia!" é só uma
  // confirmação com botão Fechar, então Voltar já pode fechar normalmente.
  useOverlayBackClose(!!ringing, solved ? handleClose : () => {});

  if (!ringing) return null;

  return createPortal(
    <div className="alarm-ring-screen">
      <div className="alarm-ring-time">{ringing.time}</div>
      {ringing.label && <div className="alarm-ring-label">{ringing.label}</div>}

      {weather && (
        <div className="alarm-ring-weather">
          {weather.emoji} {weather.temperature}°C · {weather.description}
          <span className="alarm-ring-weather-minmax">
            mín {weather.today.min}° · máx {weather.today.max}°
          </span>
        </div>
      )}

      {!solved ? (
        !challenge.enabled ? (
          <button className="alarm-ring-close" onClick={handleSolved}>
            Desligar
          </button>
        ) : challenge.level === "hardcore" ? (
          <ChessChallenge onSolved={handleSolved} />
        ) : (
          <>
            <p className="alarm-ring-hint">Resolva o quebra-cabeça pra desligar o alarme</p>
            <SlidingPuzzle size={Number(challenge.level[0]) as 2 | 3 | 4} onSolved={handleSolved} />
          </>
        )
      ) : (
        <>
          <p className="alarm-ring-done">Bom dia! Alarme desligado.</p>
          <button className="alarm-ring-close" onClick={handleClose}>
            Fechar
          </button>
        </>
      )}
    </div>,
    document.body
  );
}
