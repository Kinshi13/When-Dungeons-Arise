import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import {
  isNativePlatform,
  hasNotificationPermission,
  requestNotificationPermission,
  setupNotificationChannels,
  syncAllReminderNotifications,
  syncAllBillNotifications,
  syncAllHolidayNotifications,
  cancelReminderNotification,
  cancelBillNotifications,
  cancelHolidayNotification,
} from "../notifications";
import { getBrazilianHolidays } from "../game/holidays";
import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  NOTIFICATION_SCREEN_LABEL,
  NOTIFICATION_SCREEN_HINT,
  type NotificationPrefs,
  type NotificationScreen,
} from "../notificationPrefs";
import { useSettings, UI_SCALE_MIN, UI_SCALE_MAX, UI_SCALE_STEP } from "../contexts/SettingsContext";
import { listMonitoredApps, upsertMonitoredApp, removeMonitoredApp, type MonitoredApp } from "../notificationAppPrefs";
import { syncMonitoredPackages } from "../notificationBridge";
import { TrashIcon, PlusIcon, MinusIcon } from "../icons";

const NOTIFICATION_SCREENS: NotificationScreen[] = ["agenda", "calendario", "contas", "financas"];

function upcomingHolidays() {
  const year = new Date().getFullYear();
  return [...getBrazilianHolidays(year), ...getBrazilianHolidays(year + 1)];
}

export default function Settings() {
  const [granted, setGranted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(() => loadNotificationPrefs());
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

  // Sempre que a lista muda, avisa o serviço nativo quais pacotes ficam liberados
  // pra guardar conteúdo de notificação — todo o resto continua só com nome/pacote.
  function refreshMonitoredApps() {
    const apps = listMonitoredApps();
    setMonitoredApps(apps);
    syncMonitoredPackages(apps.filter((a) => a.enabled).map((a) => a.packageName));
  }

  useEffect(() => {
    if (isNativePlatform()) {
      hasNotificationPermission().then(setGranted);
    }
    refreshMonitoredApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateApp(app: MonitoredApp, patch: Partial<MonitoredApp>) {
    const updated = { ...app, ...patch };
    upsertMonitoredApp(updated);
    refreshMonitoredApps();
  }

  function handleRemoveApp(packageName: string) {
    removeMonitoredApp(packageName);
    refreshMonitoredApps();
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
    refreshMonitoredApps();
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
    await setupNotificationChannels();
    const [reminders, bills] = await Promise.all([api.reminders.list(), api.bills.list()]);
    await syncAllReminderNotifications(reminders);
    await syncAllBillNotifications(bills);
    await syncAllHolidayNotifications(upcomingHolidays());
    setMessage("Notificações ativadas! Lembretes e contas futuras serão avisados no horário.");
  }

  async function handleToggleScreenNotif(screen: NotificationScreen, enabled: boolean) {
    const updated = { ...notifPrefs, [screen]: enabled };
    setNotifPrefs(updated);
    saveNotificationPrefs(updated);
    if (!isNativePlatform() || !granted) return;

    if (screen === "agenda") {
      const reminders = await api.reminders.list();
      if (enabled) await syncAllReminderNotifications(reminders);
      else for (const r of reminders) await cancelReminderNotification(r.id);
    } else if (screen === "contas") {
      const bills = await api.bills.list();
      if (enabled) await syncAllBillNotifications(bills);
      else for (const b of bills) await cancelBillNotifications(b.id);
    } else if (screen === "calendario") {
      const holidays = upcomingHolidays();
      if (enabled) await syncAllHolidayNotifications(holidays);
      else for (const h of holidays) await cancelHolidayNotification(h);
    }
    // "financas" é reativo (dispara na hora ao lançar um gasto) — não há nada
    // agendado pra cancelar/sincronizar, só o próximo alerta deixa de ocorrer.
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
        <h2>Notificações por tela</h2>
        <p className="hint">
          Escolha de quais telas você quer receber avisos. Se deixar só a Agenda marcada, por
          exemplo, só vai receber notificações de eventos e tarefas — nada de contas ou finanças.
        </p>
        {NOTIFICATION_SCREENS.map((screen) => (
          <label key={screen} className="slider-row notif-screen-row">
            <span>
              {NOTIFICATION_SCREEN_LABEL[screen]}
              <span className="notif-screen-hint">{NOTIFICATION_SCREEN_HINT[screen]}</span>
            </span>
            <input
              type="checkbox"
              checked={notifPrefs[screen]}
              onChange={(e) => handleToggleScreenNotif(screen, e.target.checked)}
            />
          </label>
        ))}
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
        <h2>Tamanho do texto e das informações</h2>
        <p className="hint">
          Ajusta só o texto, os textos e as caixas de informação — o fundo de cada tela continua
          do mesmo tamanho, sem deixar faixas vazias nas laterais.
        </p>
        <div className="ui-scale-bar">
          <button
            type="button"
            className="icon-btn"
            aria-label="Diminuir"
            onClick={() => setUiScale(Math.max(UI_SCALE_MIN, uiScale - UI_SCALE_STEP))}
            disabled={uiScale <= UI_SCALE_MIN}
          >
            <MinusIcon width={16} height={16} />
          </button>
          <input
            type="range"
            className="ui-scale-slider"
            min={UI_SCALE_MIN}
            max={UI_SCALE_MAX}
            step={UI_SCALE_STEP}
            value={uiScale}
            onChange={(e) => setUiScale(Number(e.target.value))}
            aria-label="Tamanho do texto e das informações"
          />
          <button
            type="button"
            className="icon-btn"
            aria-label="Aumentar"
            onClick={() => setUiScale(Math.min(UI_SCALE_MAX, uiScale + UI_SCALE_STEP))}
            disabled={uiScale >= UI_SCALE_MAX}
          >
            <PlusIcon width={16} height={16} />
          </button>
          <span className="ui-scale-pct">{uiScale}%</span>
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
