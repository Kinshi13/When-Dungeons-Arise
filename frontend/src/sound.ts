const SFX_FILES = {
  coin: "/sfx/coin.mp3",
  drop: "/sfx/drop.mp3",
} as const;

export type SfxName = keyof typeof SFX_FILES;

let sfxVolume = 0.6;

export function setSfxVolume(volume: number) {
  sfxVolume = volume;
}

export function playSfx(name: SfxName) {
  if (sfxVolume <= 0) return;
  const audio = new Audio(SFX_FILES[name]);
  audio.volume = sfxVolume;
  audio.play().catch(() => {});
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

// Som sintetizado de página sendo folheada (ruído filtrado em curva, sem precisar de arquivo de áudio).
export function playPageFlip() {
  if (sfxVolume <= 0) return;
  try {
    const ctx = getAudioContext();
    const duration = 0.22;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const decay = 1 - i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3500, ctx.currentTime + duration);
    filter.Q.value = 0.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(sfxVolume * 0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + duration);
  } catch {
    // Web Audio indisponível — ignora silenciosamente.
  }
}

let musicEl: HTMLAudioElement | null = null;

function ensureMusic(): HTMLAudioElement {
  if (!musicEl) {
    musicEl = new Audio("/music/moonlit-paper-cranes.mp3");
    musicEl.loop = true;
  }
  return musicEl;
}

export function playMusic(volume: number) {
  const el = ensureMusic();
  el.volume = volume;
  el.play().catch(() => {});
}

export function pauseMusic() {
  musicEl?.pause();
}

export function setMusicVolume(volume: number) {
  if (musicEl) musicEl.volume = volume;
}
