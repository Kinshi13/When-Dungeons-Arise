import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fullscreenSheetFade } from "../motion";
import {
  alarms,
  saveAlarmSound,
  loadAlarmSound,
  clearAlarmSound,
  getAlarmSoundName,
  stopwatchState,
  stopwatchElapsed,
  timerState,
  timerRemaining,
  type Alarm,
} from "../clockStore";
import { scheduleAlarmNotification, cancelAlarmNotification } from "../notifications";
import { ChevronLeftIcon, PlusIcon, TrashIcon } from "../icons";
import { playSfx } from "../sound";
import { useDragDismiss } from "../useDragDismiss";
import { useOverlayBackClose } from "../useOverlayBackClose";
import { api } from "../api";

type Tab = "despertador" | "cronometro" | "temporizador";

const TAB_LABEL: Record<Tab, string> = {
  despertador: "Despertador",
  cronometro: "Cronômetro",
  temporizador: "Temporizador",
};

function formatStopwatch(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centis = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(centis).padStart(2, "0")}`;
}

function formatTimer(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function AlarmTab() {
  const [items, setItems] = useState<Alarm[]>(() => alarms.list());
  const [time, setTime] = useState("07:00");
  const [label, setLabel] = useState("");
  const [soundName, setSoundName] = useState<string | null>(() => getAlarmSoundName());
  const soundInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<{ audio: HTMLAudioElement; url: string } | null>(null);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    return () => stopPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refresh() {
    setItems(alarms.list());
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!time) return;
    playSfx("coin");
    const alarm = alarms.create(time, label.trim() || undefined);
    await scheduleAlarmNotification(alarm.id, alarm.time, alarm.label);
    setLabel("");
    refresh();
  }

  async function handleToggle(alarm: Alarm) {
    const updated = alarms.update(alarm.id, { enabled: !alarm.enabled });
    if (updated?.enabled) await scheduleAlarmNotification(updated.id, updated.time, updated.label);
    else await cancelAlarmNotification(alarm.id);
    refresh();
  }

  async function handleDelete(id: string) {
    alarms.remove(id);
    await cancelAlarmNotification(id);
    refresh();
  }

  async function handleSoundChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await saveAlarmSound(file);
    setSoundName(file.name);
    playSfx("coin");
  }

  function stopPreview() {
    if (previewRef.current) {
      previewRef.current.audio.pause();
      URL.revokeObjectURL(previewRef.current.url);
      previewRef.current = null;
    }
    setPreviewing(false);
  }

  async function handlePreview() {
    if (previewing) {
      stopPreview();
      return;
    }
    const blob = await loadAlarmSound();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => stopPreview();
    previewRef.current = { audio, url };
    setPreviewing(true);
    audio.play().catch(() => stopPreview());
  }

  async function handleClearSound() {
    stopPreview();
    await clearAlarmSound();
    setSoundName(null);
  }

  return (
    <div className="clock-tab-content">
      <form onSubmit={handleAdd} className="form clock-alarm-form">
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        <input placeholder="Nome (opcional)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <button type="submit" className="icon-btn primary" aria-label="Adicionar alarme">
          <PlusIcon width={16} height={16} />
        </button>
      </form>

      <ul className="list">
        {items.map((alarm) => (
          <li key={alarm.id} className={`reminder-item clock-alarm-item${alarm.enabled ? "" : " disabled"}`}>
            <div>
              <strong className="clock-alarm-time">{alarm.time}</strong>
              {alarm.label && <div className="meta">{alarm.label}</div>}
            </div>
            <div className="clock-alarm-actions">
              <label className="slider-row clock-alarm-toggle">
                <input type="checkbox" checked={alarm.enabled} onChange={() => handleToggle(alarm)} />
              </label>
              <button className="icon-btn" onClick={() => handleDelete(alarm.id)} aria-label="Excluir alarme">
                <TrashIcon width={16} height={16} />
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && <p className="hint">Nenhum alarme ainda. Adicione um acima.</p>}
      </ul>

      <section className="clock-sound-section">
        <h2>Som do despertador</h2>
        <p className="hint">
          {soundName ? `Áudio atual: ${soundName}` : "Sem áudio escolhido — o alarme usa um toque padrão."}
        </p>
        <div className="clock-sound-actions">
          <button className="small" onClick={() => soundInputRef.current?.click()}>
            Escolher áudio do aparelho
          </button>
          {soundName && (
            <>
              <button className="small" onClick={handlePreview}>
                {previewing ? "Parar" : "Ouvir"}
              </button>
              <button className="small" onClick={handleClearSound}>
                Remover
              </button>
            </>
          )}
        </div>
        <input ref={soundInputRef} type="file" accept="audio/*" hidden onChange={handleSoundChange} />
        <p className="hint">
          Pra desligar o alarme na hora que ele tocar, você vai precisar resolver um quebra-cabeça
          deslizante 4x4 — sem soneca fácil.
        </p>
      </section>
    </div>
  );
}

function StopwatchTab() {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceRender((n) => n + 1), 50);
    return () => clearInterval(interval);
  }, []);

  const elapsed = stopwatchElapsed(Date.now());

  function handleStartPause() {
    playSfx("coin");
    if (stopwatchState.running) {
      stopwatchState.accumulated += Date.now() - stopwatchState.startedAt;
      stopwatchState.running = false;
    } else {
      stopwatchState.startedAt = Date.now();
      stopwatchState.running = true;
    }
    forceRender((n) => n + 1);
  }

  function handleReset() {
    playSfx("drop");
    stopwatchState.running = false;
    stopwatchState.accumulated = 0;
    forceRender((n) => n + 1);
  }

  return (
    <div className="clock-tab-content clock-centered">
      <div className="clock-big-display">{formatStopwatch(elapsed)}</div>
      <div className="clock-controls">
        <button className="clock-main-btn" onClick={handleStartPause}>
          {stopwatchState.running ? "Pausar" : "Iniciar"}
        </button>
        <button className="small" onClick={handleReset} disabled={elapsed === 0}>
          Zerar
        </button>
      </div>
    </div>
  );
}

function TimerTab() {
  const [, forceRender] = useState(0);
  const [minutesInput, setMinutesInput] = useState("5");
  const [finished, setFinished] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const stopBeepRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      forceRender((n) => n + 1);
      if (timerState.running && timerRemaining(Date.now()) <= 0) {
        timerState.running = false;
        timerState.remainingWhenPaused = 0;
        setFinished(true);
        loadAlarmSound().then((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.loop = true;
            audio.play().catch(() => {});
            stopBeepRef.current = () => {
              audio.pause();
              URL.revokeObjectURL(url);
            };
          }
        });
      }
    }, 200);
    return () => {
      clearInterval(interval);
      stopBeepRef.current?.();
    };
  }, []);

  const remaining = timerRemaining(Date.now());

  function handleStartPause() {
    playSfx("coin");
    setFinished(false);
    setNoteSaved(false);
    if (timerState.running) {
      timerState.remainingWhenPaused = Math.max(0, timerState.endsAt - Date.now());
      timerState.running = false;
    } else {
      const base =
        timerState.remainingWhenPaused > 0
          ? timerState.remainingWhenPaused
          : Math.max(1, Math.round(Number(minutesInput.replace(",", ".")) * 60)) * 1000;
      timerState.totalMs = timerState.remainingWhenPaused > 0 ? timerState.totalMs : base;
      timerState.endsAt = Date.now() + base;
      timerState.running = true;
    }
    forceRender((n) => n + 1);
  }

  function handleReset() {
    playSfx("drop");
    timerState.running = false;
    timerState.remainingWhenPaused = 0;
    timerState.totalMs = 0;
    stopBeepRef.current?.();
    stopBeepRef.current = null;
    setFinished(false);
    setNoteSaved(false);
    forceRender((n) => n + 1);
  }

  async function handleSaveNote() {
    setSavingNote(true);
    try {
      const minutes = Math.round(timerState.totalMs / 60000);
      const durationLabel = minutes > 0 ? `${minutes} min` : `${Math.round(timerState.totalMs / 1000)} s`;
      const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      await api.notes.create({
        type: "NOTA",
        title: `Temporizador de ${durationLabel}`,
        content: `Concluído às ${time}.`,
      });
      playSfx("coin");
      setNoteSaved(true);
    } finally {
      setSavingNote(false);
    }
  }

  const idle = !timerState.running && timerState.remainingWhenPaused === 0 && !finished;

  return (
    <div className="clock-tab-content clock-centered">
      {idle ? (
        <div className="clock-timer-setup">
          <input
            inputMode="decimal"
            value={minutesInput}
            onChange={(e) => setMinutesInput(e.target.value)}
            aria-label="Minutos"
          />
          <span>min</span>
        </div>
      ) : (
        <div className="clock-big-display">{formatTimer(remaining)}</div>
      )}

      {finished && (
        <div className="clock-timer-suggestion">
          <p className="clock-timer-done">Tempo esgotado!</p>
          <p className="hint">
            {noteSaved ? "Nota guardada no Diário." : "Guardar esse tempo como nota no Diário antes de zerar?"}
          </p>
        </div>
      )}

      <div className="clock-controls">
        {finished ? (
          <>
            {!noteSaved && (
              <button className="small" onClick={handleSaveNote} disabled={savingNote}>
                {savingNote ? "Guardando..." : "Guardar no Diário"}
              </button>
            )}
            <button className="clock-main-btn" onClick={handleReset}>
              {noteSaved ? "Fechar" : "Parar"}
            </button>
          </>
        ) : (
          <>
            <button className="clock-main-btn" onClick={handleStartPause}>
              {timerState.running ? "Pausar" : "Iniciar"}
            </button>
            {!idle && (
              <button className="small" onClick={handleReset}>
                Cancelar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface ClockScreenProps {
  open: boolean;
  onClose: () => void;
  // Aba que abre por padrão (o card do Relógio na Recepção usa isso: toque
  // normal abre no Despertador, deslizar o card abre direto no Cronômetro
  // ou Temporizador). A tela fica sempre montada (só o overlay entra/sai via
  // AnimatePresence), então precisa reaplicar isso toda vez que abrir de
  // novo, não só na primeira montagem.
  initialTab?: Tab;
}

export default function ClockScreen({ open, onClose, initialTab = "despertador" }: ClockScreenProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  useEffect(() => {
    // Depende também de initialTab (não só open): o Painel Rápido pode pedir
    // pra trocar de aba (ex. "Novo temporizador") com a tela JÁ aberta — só
    // em "open" o efeito não re-rodava e a troca era ignorada. Não conflita
    // com o usuário clicando manualmente numa aba (abaixo): isso só muda o
    // estado local `tab`, nunca o `initialTab` vindo do pai.
    if (open) setTab(initialTab);
  }, [open, initialTab]);
  // Mesmo gesto que abre esta tela (deslizar pra cima na Recepção): deslizar
  // pra cima de novo aqui fecha de volta (não o reverso — "puxa pra cima pra
  // ver o Relógio, puxa pra cima de novo pra voltar"). O arrasto começa só
  // pelo cabeçalho (pra não brigar com a rolagem da lista de alarmes), mas a
  // tela inteira acompanha o dedo de verdade enquanto arrasta.
  const { surface, handle } = useDragDismiss({ direction: "up", onClose });
  useOverlayBackClose(open, onClose);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="note-fullscreen clock-screen"
          {...fullscreenSheetFade}
          {...surface}
        >
          <div className="lofi-scene lofi-scene-tempo" aria-hidden="true" />

          <div className="note-fullscreen-content">
            <div className="note-fullscreen-header" {...handle}>
              <button className="icon-btn" onClick={onClose} aria-label="Voltar">
                <ChevronLeftIcon width={20} height={20} /> Voltar
              </button>
              <strong>Relógio</strong>
            </div>

            <div className="drawer-tabs">
              {(Object.keys(TAB_LABEL) as Tab[]).map((key) => (
                <button
                  key={key}
                  className={tab === key ? "drawer-tab active" : "drawer-tab"}
                  onClick={() => setTab(key)}
                >
                  {TAB_LABEL[key]}
                </button>
              ))}
            </div>

            {tab === "despertador" && <AlarmTab />}
            {tab === "cronometro" && <StopwatchTab />}
            {tab === "temporizador" && <TimerTab />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
