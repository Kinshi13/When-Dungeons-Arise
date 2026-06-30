import { useEffect, useState } from "react";
import { api } from "../api";
import {
  isNativePlatform,
  hasNotificationPermission,
  requestNotificationPermission,
  syncAllReminderNotifications,
  syncAllBillNotifications,
} from "../notifications";
import { useSettings, type UiScale } from "../contexts/SettingsContext";

const UI_SCALE_LABEL: Record<UiScale, string> = {
  "100": "Original (100%)",
  "75": "Reduzido (-25%)",
  "50": "Compacto (-50%)",
};

export default function Settings() {
  const [granted, setGranted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const {
    sfxVolume,
    setSfxVolume,
    musicEnabled,
    setMusicEnabled,
    musicVolume,
    setMusicVolume,
    uiScale,
    setUiScale,
    animationsEnabled,
    setAnimationsEnabled,
  } = useSettings();

  useEffect(() => {
    if (isNativePlatform()) {
      hasNotificationPermission().then(setGranted);
    }
  }, []);

  async function handleEnableNotifications() {
    setMessage(null);
    const allowed = await requestNotificationPermission();
    setGranted(allowed);
    if (!allowed) {
      setMessage("Permissão de notificação negada.");
      return;
    }
    const [reminders, bills] = await Promise.all([api.reminders.list(), api.bills.list()]);
    await syncAllReminderNotifications(reminders);
    await syncAllBillNotifications(bills);
    setMessage("Notificações ativadas! Lembretes e contas futuras serão avisados no horário.");
  }

  return (
    <div className="page">
      <section className="settings-section">
        <h2>Seus dados</h2>
        <p className="hint">
          Tudo é salvo neste aparelho — o app funciona sem internet e sem depender de nenhum
          outro dispositivo. Os dados ficam guardados até você desinstalar o app ou limpar os
          dados dele nas configurações do Android.
        </p>
      </section>

      <section className="settings-section">
        <h2>Notificações</h2>
        {!isNativePlatform() && (
          <p className="hint">
            Notificações funcionam apenas no app instalado no celular (APK). No navegador, esta
            opção fica indisponível.
          </p>
        )}
        {isNativePlatform() && (
          <button onClick={handleEnableNotifications} disabled={granted}>
            {granted ? "Notificações ativadas" : "Ativar notificações"}
          </button>
        )}
        {message && <p className="hint">{message}</p>}
      </section>

      <section className="settings-section">
        <h2>Som</h2>
        <label className="slider-row">
          <span>Efeitos sonoros</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(sfxVolume * 100)}
            onChange={(e) => setSfxVolume(Number(e.target.value) / 100)}
          />
        </label>
        <label className="slider-row">
          <span>Música de fundo</span>
          <input
            type="checkbox"
            checked={musicEnabled}
            onChange={(e) => setMusicEnabled(e.target.checked)}
          />
        </label>
        {musicEnabled && (
          <label className="slider-row">
            <span>Volume da música</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(musicVolume * 100)}
              onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
            />
          </label>
        )}
      </section>

      <section className="settings-section">
        <h2>Tamanho da interface</h2>
        <div className="filters">
          {(["100", "75", "50"] as UiScale[]).map((scale) => (
            <button
              key={scale}
              className={uiScale === scale ? "filter active" : "filter"}
              onClick={() => setUiScale(scale)}
            >
              {UI_SCALE_LABEL[scale]}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>Desempenho</h2>
        <label className="slider-row">
          <span>Animações</span>
          <input
            type="checkbox"
            checked={animationsEnabled}
            onChange={(e) => setAnimationsEnabled(e.target.checked)}
          />
        </label>
        <p className="hint">Desative para um app mais leve em aparelhos mais fracos.</p>
      </section>
    </div>
  );
}
