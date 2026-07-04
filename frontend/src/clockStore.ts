import { table, createId } from "./storage";
import { saveFile, loadFile, deleteFile } from "./blobStore";
import { syncAlarmsNow } from "./syncAlarms";

// Relógio — despertadores, cronômetro e temporizador. Tudo local, como o
// resto do app. O despertador funciona em duas camadas:
//   1. Uma notificação local diária no horário (Android mostra e toca o som
//      padrão mesmo com o app fechado; tocar nela abre o app).
//   2. Com o app aberto (ou aberto pela notificação), a tela de toque
//      (AlarmRinger) assume: toca o áudio escolhido pelo usuário em loop e
//      só desliga depois de resolver o quebra-cabeça 4x4.

export interface Alarm {
  id: string;
  time: string; // "HH:MM"
  label?: string;
  enabled: boolean;
  // Última data (YYYY-MM-DD) em que este alarme tocou e foi desligado (ou
  // marcado como perdido) — evita tocar duas vezes no mesmo dia.
  lastHandledDate?: string | null;
  // Sincronização entre aparelhos — mesmo padrão de Reminder (ver api.ts):
  // updatedAt pra "quem mudou por último vence", deleted como tombstone em
  // vez de apagar de verdade.
  updatedAt?: string;
  deleted?: boolean;
}

const alarmTable = table<Alarm>("alarms");

// Janela em que um alarme "atrasado" ainda toca ao abrir o app — depois
// disso ele é marcado como perdido em silêncio (ninguém quer o alarme das
// 7h berrando ao abrir o app às 15h).
const RING_WINDOW_MS = 60 * 60 * 1000;

function todayKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function activeAlarms(): Alarm[] {
  return alarmTable.list().filter((a) => !a.deleted);
}

// Dispara a sincronização em segundo plano — sem esperar, sem quebrar nada
// se não estiver configurada/logada (ver syncAlarms.ts).
function triggerAlarmSync() {
  void syncAlarmsNow();
}

export const alarms = {
  list(): Alarm[] {
    return [...activeAlarms()].sort((a, b) => (a.time < b.time ? -1 : 1));
  },
  create(time: string, label?: string): Alarm {
    const created = alarmTable.insert({
      id: createId(),
      time,
      label,
      enabled: true,
      lastHandledDate: null,
      updatedAt: new Date().toISOString(),
      deleted: false,
    });
    triggerAlarmSync();
    return created;
  },
  update(id: string, patch: Partial<Alarm>): Alarm | undefined {
    const updated = alarmTable.update(id, { ...patch, updatedAt: new Date().toISOString() });
    triggerAlarmSync();
    return updated;
  },
  remove(id: string) {
    // Tombstone — mesmo motivo do Reminder.deleted (ver comentário lá).
    alarmTable.update(id, { deleted: true, updatedAt: new Date().toISOString() });
    triggerAlarmSync();
  },
};

// Alarme que deve estar tocando AGORA (dentro da janela), ou null. Alarmes
// fora da janela são marcados como perdidos de passagem.
export function getDueAlarm(now: Date): Alarm | null {
  const today = todayKey(now);
  for (const alarm of activeAlarms()) {
    if (!alarm.enabled || alarm.lastHandledDate === today) continue;
    const [h, m] = alarm.time.split(":").map(Number);
    const scheduled = new Date(now);
    scheduled.setHours(h, m, 0, 0);
    const elapsed = now.getTime() - scheduled.getTime();
    if (elapsed < 0) continue;
    if (elapsed <= RING_WINDOW_MS) return alarm;
    alarmTable.update(alarm.id, { lastHandledDate: today });
  }
  return null;
}

export function markAlarmHandled(id: string, now: Date) {
  alarmTable.update(id, { lastHandledDate: todayKey(now) });
}

// Próximo alarme ativado a partir de agora — alarmes só têm horário (sem
// data, tocam todo dia), então "próximo" é sempre o de menor distância até
// o horário de hoje, contando a virada de meia-noite (um alarme das 06:00
// às 23h de hoje está a 7h de distância, não "no passado"). Usado pelo card
// do Relógio na Recepção.
export function nextAlarm(now: Date = new Date()): Alarm | null {
  const enabled = alarms.list().filter((a) => a.enabled);
  if (enabled.length === 0) return null;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  function minutesUntil(time: string): number {
    const [h, m] = time.split(":").map(Number);
    const diff = h * 60 + m - nowMinutes;
    return diff >= 0 ? diff : diff + 24 * 60;
  }

  return [...enabled].sort((a, b) => minutesUntil(a.time) - minutesUntil(b.time))[0];
}

// ---- Som do despertador (arquivo escolhido pelo usuário, salvo no aparelho) ----

const ALARM_SOUND_ID = "alarm-sound";
const ALARM_SOUND_NAME_KEY = "lembretes-app:alarm-sound-name";

export async function saveAlarmSound(file: File) {
  await saveFile(ALARM_SOUND_ID, file);
  localStorage.setItem(ALARM_SOUND_NAME_KEY, file.name);
}

export async function loadAlarmSound(): Promise<Blob | undefined> {
  return loadFile(ALARM_SOUND_ID);
}

export async function clearAlarmSound() {
  await deleteFile(ALARM_SOUND_ID);
  localStorage.removeItem(ALARM_SOUND_NAME_KEY);
}

export function getAlarmSoundName(): string | null {
  return localStorage.getItem(ALARM_SOUND_NAME_KEY);
}

// ---- Cronômetro e temporizador ----
// Estado em escopo de módulo: sobrevive a fechar/reabrir a janela do relógio
// (mas não a fechar o app — cronômetro de verdade zera junto, o que é ok).

export const stopwatchState = {
  running: false,
  startedAt: 0, // epoch ms de quando começou a contagem atual
  accumulated: 0, // ms acumulados de execuções anteriores (pausas)
};

export function stopwatchElapsed(now: number): number {
  return stopwatchState.accumulated + (stopwatchState.running ? now - stopwatchState.startedAt : 0);
}

export const timerState = {
  running: false,
  endsAt: 0, // epoch ms em que o temporizador zera
  remainingWhenPaused: 0, // ms restantes quando pausado
  totalMs: 0, // duração escolhida (pra reset)
};

export function timerRemaining(now: number): number {
  if (timerState.running) return Math.max(0, timerState.endsAt - now);
  return timerState.remainingWhenPaused;
}

// ---- Desafio pra desligar o alarme ----
// Configurável em Ajustes: liga/desliga e nível. "hardcore" troca o
// quebra-cabeça deslizante por um lance único de xadrez.

export type PuzzleLevel = "2x2" | "3x3" | "4x4" | "hardcore";

export interface AlarmChallengePrefs {
  enabled: boolean;
  level: PuzzleLevel;
}

const CHALLENGE_PREFS_KEY = "lembretes-app:alarm-challenge";

const DEFAULT_CHALLENGE: AlarmChallengePrefs = { enabled: true, level: "4x4" };

export function loadAlarmChallengePrefs(): AlarmChallengePrefs {
  try {
    const raw = localStorage.getItem(CHALLENGE_PREFS_KEY);
    return raw ? { ...DEFAULT_CHALLENGE, ...JSON.parse(raw) } : { ...DEFAULT_CHALLENGE };
  } catch {
    return { ...DEFAULT_CHALLENGE };
  }
}

export function saveAlarmChallengePrefs(prefs: AlarmChallengePrefs) {
  localStorage.setItem(CHALLENGE_PREFS_KEY, JSON.stringify(prefs));
}
