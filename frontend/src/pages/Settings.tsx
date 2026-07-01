import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import {
  isNativePlatform,
  hasNotificationPermission,
  requestNotificationPermission,
  syncAllReminderNotifications,
  syncAllBillNotifications,
} from "../notifications";
import { useSettings, type UiScale } from "../contexts/SettingsContext";
import { listMonitoredApps, upsertMonitoredApp, removeMonitoredApp, type MonitoredApp } from "../notificationAppPrefs";
import { TrashIcon, PlusIcon } from "../icons";

const UI_SCALE_LABEL: Record<UiScale, string> = {
  "100": "Original (100%)",
  "75": "Reduzido (-25%)",
  "50": "Compacto (-50%)",
};

export default function Settings() {
  const [granted, setGranted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [monitoredApps, setMonitoredApps] = useState<MonitoredApp[]>([]);
  const [newAppName, setNewAppName] = useState("");
  const [newPackageName, setNewPackageName] = useState("");
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
    setMonitoredApps(listMonitoredApps());
  }, []);

  function updateApp(app: MonitoredApp, patch: Partial<MonitoredApp>) {
    const updated = { ...app, ...patch };
    upsertMonitoredApp(updated);
    setMonitoredApps(listMonitoredApps());
  }

  function handleRemoveApp(packageName: string) {
    removeMonitoredApp(packageName);
    setMonitoredApps(listMonitoredApps());
  }

  function handleAddApp(e: FormEvent) {
    e.preventDefault();
    if (!newAppName.trim() || !newPackageName.trim()) return;
    upsertMonitoredApp({
      packageName: newPackageName.trim(),
      appName: newAppName.trim(),
      enabled: true,
      priority: false,
      autoExpense: false,
    });
    setMonitoredApps(listMonitoredApps());
    setNewAppName("");
    setNewPackageName("");
  }

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
        <h2>Notificações monitoradas</h2>
        <p className="hint">
          Escolha quais apps o gerenciador de notificações do Mural acompanha. Marque como
          prioridade os bancos e carteiras — são os que valem a pena revisar primeiro e os únicos
          elegíveis pra lançar gastos automaticamente nas finanças.
        </p>

        <div className="monitored-app-list">
          {monitoredApps.map((app) => (
            <div key={app.packageName} className={`monitored-app-row${app.priority ? " priority" : ""}`}>
              <div className="monitored-app-row-top">
                <strong>{app.appName}</strong>
                <button
                  className="icon-btn"
                  onClick={() => handleRemoveApp(app.packageName)}
                  aria-label={`Remover ${app.appName}`}
                >
                  <TrashIcon width={14} height={14} />
                </button>
              </div>
              <label className="slider-row">
                <span>Monitorar</span>
                <input
                  type="checkbox"
                  checked={app.enabled}
                  onChange={(e) => updateApp(app, { enabled: e.target.checked })}
                />
              </label>
              <label className="slider-row">
                <span>Prioridade (banco)</span>
                <input
                  type="checkbox"
                  checked={app.priority}
                  onChange={(e) =>
                    updateApp(app, { priority: e.target.checked, autoExpense: e.target.checked && app.autoExpense })
                  }
                />
              </label>
              <label className="slider-row">
                <span>Lançar gastos automaticamente</span>
                <input
                  type="checkbox"
                  checked={app.autoExpense}
                  disabled={!app.priority}
                  onChange={(e) => updateApp(app, { autoExpense: e.target.checked })}
                />
              </label>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddApp} className="form monitored-app-add-form">
          <input
            placeholder="Nome do app"
            value={newAppName}
            onChange={(e) => setNewAppName(e.target.value)}
          />
          <input
            placeholder="Pacote (ex: com.banco.app)"
            value={newPackageName}
            onChange={(e) => setNewPackageName(e.target.value)}
          />
          <button type="submit" className="icon-btn primary" aria-label="Adicionar app">
            <PlusIcon width={16} height={16} />
          </button>
        </form>
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
