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
  syncAllBirthdayNotifications,
  cancelReminderNotification,
  cancelBillNotifications,
  cancelHolidayNotification,
  cancelBirthdayNotifications,
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
import {
  useSettings,
  UI_SCALE_MIN,
  UI_SCALE_MAX,
  UI_SCALE_STEP,
  ANIMATION_LEVEL_LABEL,
  type AnimationLevel,
} from "../contexts/SettingsContext";
import { listMonitoredApps, upsertMonitoredApp, removeMonitoredApp, type MonitoredApp } from "../notificationAppPrefs";
import { syncMonitoredPackages } from "../notificationBridge";
import {
  loadAlarmChallengePrefs,
  saveAlarmChallengePrefs,
  type AlarmChallengePrefs,
  type PuzzleLevel,
} from "../clockStore";
import { CURRENCY_PAIRS, getCurrencyWidgetPair, setCurrencyWidgetPair } from "../currencyWidgetStore";
import { syncCurrencyWidgetPair } from "../widgetBridge";
import { TrashIcon, PlusIcon, MinusIcon } from "../icons";
import { isSyncAvailable, getSession, signIn, signUp, signOut, onAuthChanged, type Session } from "../auth";
import { syncAllNow } from "../sync";
import { getLastSyncedAt } from "../syncEngine";

const PUZZLE_LEVEL_LABEL: Record<PuzzleLevel, string> = {
  "2x2": "Fácil (2x2)",
  "3x3": "Médio (3x3)",
  "4x4": "Difícil (4x4)",
  hardcore: "Hardcore (xadrez)",
};

const NOTIFICATION_SCREENS: NotificationScreen[] = ["agenda", "calendario", "contas", "financas"];

function upcomingHolidays() {
  const year = new Date().getFullYear();
  return [...getBrazilianHolidays(year), ...getBrazilianHolidays(year + 1)];
}

export default function Settings() {
  const [granted, setGranted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(() => loadNotificationPrefs());
  const [challenge, setChallenge] = useState<AlarmChallengePrefs>(() => loadAlarmChallengePrefs());
  const [currencyPair, setCurrencyPair] = useState<string>(() => getCurrencyWidgetPair());
  const [monitoredApps, setMonitoredApps] = useState<MonitoredApp[]>([]);
  const [newAppName, setNewAppName] = useState("");
  const [newPackageName, setNewPackageName] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"entrar" | "criar">("entrar");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const {
    sfxVolume,
    setSfxVolume,
    musicEnabled,
    setMusicEnabled,
    musicVolume,
    setMusicVolume,
    uiScale,
    setUiScale,
    animationLevel,
    setAnimationLevel,
    screenTransitionAnimationEnabled,
    setScreenTransitionAnimationEnabled,
    lockWallpaperToMain,
    setLockWallpaperToMain,
    theme,
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

  useEffect(() => {
    if (!isSyncAvailable()) return;
    getSession().then(setSession);
    return onAuthChanged(setSession);
  }, []);

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthBusy(true);
    const errorMessage =
      authMode === "entrar" ? await signIn(authEmail, authPassword) : await signUp(authEmail, authPassword);
    setAuthBusy(false);
    if (errorMessage) {
      setAuthError(errorMessage);
      return;
    }
    setAuthPassword("");
    if (authMode === "criar") {
      setSyncStatus("Conta criada! Verifique seu e-mail se pedir confirmação, depois entre normalmente.");
    } else {
      handleSyncNow();
    }
  }

  async function handleSignOut() {
    await signOut();
    setSyncStatus(null);
  }

  async function handleSyncNow() {
    setSyncBusy(true);
    setSyncStatus(null);
    const result = await syncAllNow();
    setSyncBusy(false);
    if (result.status === "ok") {
      setSyncStatus(`Sincronizado: ${result.pushed} enviado(s), ${result.pulled} recebido(s).`);
    } else if (result.status === "not-signed-in") {
      setSyncStatus("Entre na sua conta pra sincronizar.");
    } else if (result.status === "error") {
      setSyncStatus("Não consegui sincronizar agora — tente de novo em instantes.");
    }
  }

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
    await syncAllBirthdayNotifications(reminders);
    setMessage("Notificações ativadas! Lembretes e contas futuras serão avisados no horário.");
  }

  async function handleToggleScreenNotif(screen: NotificationScreen, enabled: boolean) {
    const updated = { ...notifPrefs, [screen]: enabled };
    setNotifPrefs(updated);
    saveNotificationPrefs(updated);
    if (!isNativePlatform() || !granted) return;

    if (screen === "agenda") {
      const reminders = await api.reminders.list();
      if (enabled) {
        await syncAllReminderNotifications(reminders);
        await syncAllBirthdayNotifications(reminders);
      } else {
        for (const r of reminders) {
          if (r.isBirthday) await cancelBirthdayNotifications(r.id);
          else await cancelReminderNotification(r.id);
        }
      }
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

  function updateChallenge(patch: Partial<AlarmChallengePrefs>) {
    const updated = { ...challenge, ...patch };
    setChallenge(updated);
    saveAlarmChallengePrefs(updated);
  }

  function handleChangeCurrencyPair(code: string) {
    setCurrencyPair(code);
    setCurrencyWidgetPair(code);
    syncCurrencyWidgetPair(code);
  }

  return (
    <div className="page">
      <div className="settings-group">
        <h1 className="settings-group-title">Perfil</h1>

        <section className="settings-section">
          <h2>Seus dados</h2>
          <p className="hint">
            Tudo é salvo neste aparelho primeiro — o app funciona sem internet, com ou sem conta
            configurada. Os dados ficam guardados até você desinstalar o app ou limpar os dados
            dele nas configurações do Android. Ative a sincronização abaixo pra também guardar uma
            cópia na nuvem e usar no app de computador.
          </p>
        </section>

        <section className="settings-section">
          <h2>Conta e sincronização</h2>
          {!isSyncAvailable() ? (
            <p className="hint">
              Sincronização entre aparelhos ainda não configurada nesta versão — seus dados
              continuam só neste aparelho, como sempre.
            </p>
          ) : session ? (
            <>
              <p className="hint">Conectado como {session.user.email}.</p>
              <p className="hint">
                {getLastSyncedAt()
                  ? `Última sincronização: ${new Date(getLastSyncedAt()!).toLocaleString("pt-BR")}.`
                  : "Ainda não sincronizou nesta sessão."}
              </p>
              <div className="filters">
                <button onClick={handleSyncNow} disabled={syncBusy}>
                  {syncBusy ? "Sincronizando…" : "Sincronizar agora"}
                </button>
                <button onClick={handleSignOut}>Sair da conta</button>
              </div>
              {syncStatus && <p className="hint">{syncStatus}</p>}
              <p className="hint">
                Sincronizam entre aparelhos: Lembretes da Agenda, Notas/Listas, Contas, Despesas,
                Carteira e Alarmes. Documentos da Biblioteca e papel de parede ainda ficam só
                neste aparelho.
              </p>
            </>
          ) : (
            <>
              <p className="hint">
                Entre com sua conta pra sincronizar seus dados entre este aparelho e o app de
                computador.
              </p>
              <div className="filters">
                <button
                  className={authMode === "entrar" ? "filter active" : "filter"}
                  onClick={() => setAuthMode("entrar")}
                >
                  Entrar
                </button>
                <button
                  className={authMode === "criar" ? "filter active" : "filter"}
                  onClick={() => setAuthMode("criar")}
                >
                  Criar conta
                </button>
              </div>
              <form onSubmit={handleAuthSubmit} className="form">
                <input
                  type="email"
                  placeholder="E-mail"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <input
                  type="password"
                  placeholder="Senha"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  autoComplete={authMode === "entrar" ? "current-password" : "new-password"}
                  minLength={6}
                  required
                />
                <button type="submit" disabled={authBusy}>
                  {authBusy ? "Só um instante…" : authMode === "entrar" ? "Entrar" : "Criar conta"}
                </button>
              </form>
              {authError && <p className="error">{authError}</p>}
              {syncStatus && <p className="hint">{syncStatus}</p>}
            </>
          )}
        </section>
      </div>

      <div className="settings-group">
        <h1 className="settings-group-title">Aparência</h1>

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
          <h2>Animações de navegação</h2>
          <p className="hint">
            Controla o fade ao trocar de tela pela dock. Desative se preferir trocas instantâneas,
            sem nenhuma animação.
          </p>
          <label className="slider-row">
            <span>Animação de transição entre telas</span>
            <input
              type="checkbox"
              checked={screenTransitionAnimationEnabled}
              onChange={(e) => setScreenTransitionAnimationEnabled(e.target.checked)}
            />
          </label>
          {theme === "personalizado" && (
            <>
              <label className="slider-row">
                <span>Fixar papel de parede da Recepção em todas as telas</span>
                <input
                  type="checkbox"
                  checked={lockWallpaperToMain}
                  onChange={(e) => setLockWallpaperToMain(e.target.checked)}
                />
              </label>
              <p className="hint">
                Usa sempre a mesma imagem da Recepção em qualquer tela, em vez de uma por tela —
                assim o fundo nunca troca ao navegar.
              </p>
            </>
          )}
        </section>
      </div>

      <div className="settings-group">
        <h1 className="settings-group-title">Notificações</h1>

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
      </div>

      <div className="settings-group">
        <h1 className="settings-group-title">Relógio e alarmes</h1>

        <section className="settings-section">
          <h2>Desafio do despertador</h2>
          <label className="slider-row">
            <span>Exigir desafio pra desligar o alarme</span>
            <input
              type="checkbox"
              checked={challenge.enabled}
              onChange={(e) => updateChallenge({ enabled: e.target.checked })}
            />
          </label>
          {challenge.enabled ? (
            <>
              <div className="filters">
                {(Object.keys(PUZZLE_LEVEL_LABEL) as PuzzleLevel[]).map((level) => (
                  <button
                    key={level}
                    className={challenge.level === level ? "filter active" : "filter"}
                    onClick={() => updateChallenge({ level })}
                  >
                    {PUZZLE_LEVEL_LABEL[level]}
                  </button>
                ))}
              </div>
              <p className="hint">
                {challenge.level === "hardcore"
                  ? "Hardcore: um lance de xadrez resolve — dê o xeque-mate ou escape dele pra desligar o alarme."
                  : "Quebra-cabeça deslizante: ordene os números pra desligar o alarme."}
              </p>
            </>
          ) : (
            <p className="hint">Sem desafio, o alarme mostra só um botão de desligar.</p>
          )}
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
      </div>

      <div className="settings-group">
        <h1 className="settings-group-title">Integrações</h1>

        <section className="settings-section">
          <h2>Widget de Câmbio</h2>
          <p className="hint">
            Escolha qual moeda o widget de Câmbio da tela inicial mostra em relação ao Real. A
            cotação atualiza sozinha de tempos em tempos, mesmo com o app fechado.
          </p>
          <div className="filters">
            {CURRENCY_PAIRS.map((option) => (
              <button
                key={option.code}
                className={currencyPair === option.code ? "filter active" : "filter"}
                onClick={() => handleChangeCurrencyPair(option.code)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="settings-group">
        <h1 className="settings-group-title">Sistema</h1>

        <section className="settings-section">
          <h2>Desempenho</h2>
          <p className="hint">
            Reduzidas desliga toda animação de UI e as partículas ambiente (poeira, chuva) — o
            app fica mais leve em aparelhos mais fracos. Completas mostra mais partículas.
          </p>
          <div className="filters">
            {(Object.keys(ANIMATION_LEVEL_LABEL) as AnimationLevel[]).map((level) => (
              <button
                key={level}
                className={animationLevel === level ? "filter active" : "filter"}
                onClick={() => setAnimationLevel(level)}
              >
                {ANIMATION_LEVEL_LABEL[level]}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
