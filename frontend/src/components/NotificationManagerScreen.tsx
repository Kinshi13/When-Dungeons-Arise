import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import {
  fetchRecentNotifications,
  isNotificationAccessGranted,
  openNotificationAccessSettings,
  syncMonitoredPackages,
  type RawSystemNotification,
} from "../notificationBridge";
import { groupNotifications, hasScheduleHint } from "../notificationGrouping";
import { ensureAppsKnown, listMonitoredApps } from "../notificationAppPrefs";
import { runAutoExpenseDetection, isNotificationProcessed } from "../autoExpenseEngine";
import { findDateMention, resolveDateToISO } from "../game/dateDetector";
import { ChevronLeftIcon, BellIcon, PlusIcon, CoinIcon, SettingsIcon } from "../icons";
import { playSfx } from "../sound";

interface NotificationManagerScreenProps {
  open: boolean;
  onClose: () => void;
}

function relativeTime(postTime: number): string {
  const diffMin = Math.round((Date.now() - postTime) / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  return `há ${Math.round(diffH / 24)}d`;
}

export default function NotificationManagerScreen({ open, onClose }: NotificationManagerScreenProps) {
  const navigate = useNavigate();
  const [granted, setGranted] = useState(false);
  const [items, setItems] = useState<RawSystemNotification[]>([]);
  const [isExample, setIsExample] = useState(true);
  const [loading, setLoading] = useState(false);
  const [convertedIds, setConvertedIds] = useState<string[]>([]);
  const [autoExpenseCount, setAutoExpenseCount] = useState(0);
  const [hasMonitoredApp, setHasMonitoredApp] = useState(false);

  async function load() {
    setLoading(true);
    // Garante que o serviço nativo já tenha a lista de apps liberados antes de
    // ler o cache — cobre o caso de o app abrir aqui sem ter passado por Ajustes.
    await syncMonitoredPackages(listMonitoredApps().filter((a) => a.enabled).map((a) => a.packageName));
    const [grantedResult, notifResult] = await Promise.all([isNotificationAccessGranted(), fetchRecentNotifications()]);
    setGranted(grantedResult);
    setIsExample(notifResult.isExample);

    // Descobre apps novos (só nome/pacote, pra aparecerem em Ajustes), mas só
    // exibe/processa aqui o conteúdo dos que o usuário já marcou "Monitorar" —
    // o mesmo filtro que o serviço nativo aplica antes de guardar texto algum.
    ensureAppsKnown(notifResult.items.map((i) => ({ packageName: i.packageName, appName: i.appName })));
    const enabledPackages = new Set(listMonitoredApps().filter((a) => a.enabled).map((a) => a.packageName));
    setHasMonitoredApp(enabledPackages.size > 0);
    const visibleItems = notifResult.items.filter((i) => enabledPackages.has(i.packageName));
    setItems(visibleItems);

    const autoExpenses = await runAutoExpenseDetection(visibleItems);
    if (autoExpenses.length > 0) {
      playSfx("coin");
      setAutoExpenseCount((prev) => prev + autoExpenses.length);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleTurnIntoMission(notification: RawSystemNotification) {
    const detected = findDateMention(`${notification.title} ${notification.text}`);
    let dateTime: string;
    if (detected) {
      dateTime = resolveDateToISO(detected);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      dateTime = tomorrow.toISOString();
    }
    await api.reminders.create({
      title: notification.title || notification.appName,
      description: notification.text,
      dateTime,
      type: "OUTRO",
    });
    playSfx("coin");
    setConvertedIds((prev) => [...prev, notification.id]);
  }

  function handleOpenSettings() {
    onClose();
    navigate("/regras");
  }

  const groups = groupNotifications(items);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="note-fullscreen"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2 }}
        >
          <div className="page-bg page-bg-blurred-strong" aria-hidden="true">
            <img src="/ambient-bg.gif" alt="" />
          </div>

          <div className="note-fullscreen-content">
            <div className="note-fullscreen-header">
              <button className="icon-btn" onClick={onClose} aria-label="Voltar">
                <ChevronLeftIcon width={20} height={20} /> Voltar
              </button>
              <strong>Notificações</strong>
              <button className="icon-btn" onClick={handleOpenSettings} aria-label="Configurar apps monitorados">
                <SettingsIcon width={16} height={16} />
              </button>
            </div>

            {!granted && (
              <div className="notif-access-card">
                <p>
                  Ative o acesso a notificações em Ajustes do Android pra ver aqui as notificações
                  reais, agrupadas por app.
                </p>
                <button className="icon-btn primary small-btn" onClick={openNotificationAccessSettings}>
                  <BellIcon width={14} height={14} /> Abrir Ajustes
                </button>
              </div>
            )}

            {isExample && (
              <p className="hint notif-example-hint">
                Mostrando notificações de exemplo{granted ? "" : " — funciona só no app instalado no celular"}.
              </p>
            )}

            {autoExpenseCount > 0 && (
              <p className="hint notif-auto-expense-hint">
                <CoinIcon width={14} height={14} /> {autoExpenseCount} gasto
                {autoExpenseCount === 1 ? "" : "s"} detectado{autoExpenseCount === 1 ? "" : "s"} e lançado
                {autoExpenseCount === 1 ? "" : "s"} nas finanças automaticamente.
              </p>
            )}

            <p className="hint notif-settings-hint">
              Escolha quais apps monitorar (e priorize os bancos) em{" "}
              <button className="link-btn" onClick={handleOpenSettings}>
                Ajustes › Notificações monitoradas
              </button>
              .
            </p>

            <div className="notif-groups">
              {loading && <p className="hint">Carregando...</p>}
              {!loading && !hasMonitoredApp && (
                <p className="hint">
                  Nenhum app monitorado ainda — o conteúdo das notificações só é lido dos apps que
                  você ativar em Ajustes › Notificações monitoradas.
                </p>
              )}
              {!loading && hasMonitoredApp && groups.length === 0 && (
                <p className="hint">Nenhuma notificação recente dos apps monitorados.</p>
              )}
              {groups.map((group) => (
                <section key={group.packageName} className="notif-group">
                  <div className="notif-group-header">
                    <strong>{group.appName}</strong>
                    <span className="meta">{group.items.length}</span>
                  </div>
                  <div className="notif-group-items">
                    {group.items.map((item) => {
                      const converted = convertedIds.includes(item.id);
                      const autoExpensed = isNotificationProcessed(item.id);
                      return (
                        <div
                          key={item.id}
                          className="notif-card"
                          style={hasScheduleHint(item) ? { opacity: 0.9 } : undefined}
                        >
                          <div className="notif-card-top">
                            <strong className="notif-card-title">{item.title || group.appName}</strong>
                            <span className="meta">{relativeTime(item.postTime)}</span>
                          </div>
                          <p className="notif-card-text">{item.text}</p>
                          {autoExpensed && (
                            <span className="notif-card-expense-badge">
                              <CoinIcon width={12} height={12} /> Gasto lançado automaticamente
                            </span>
                          )}
                          <button
                            className="icon-btn small-btn"
                            onClick={() => handleTurnIntoMission(item)}
                            disabled={converted}
                          >
                            <PlusIcon width={13} height={13} /> {converted ? "Virou missão" : "Virar missão"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
