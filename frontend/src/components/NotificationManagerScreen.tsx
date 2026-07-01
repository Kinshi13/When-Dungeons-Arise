import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import {
  fetchRecentNotifications,
  isNotificationAccessGranted,
  openNotificationAccessSettings,
  type RawSystemNotification,
} from "../notificationBridge";
import { groupNotifications, hasScheduleHint } from "../notificationGrouping";
import { findDateMention, resolveDateToISO } from "../game/dateDetector";
import { ChevronLeftIcon, BellIcon, PlusIcon } from "../icons";
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
  const [granted, setGranted] = useState(false);
  const [items, setItems] = useState<RawSystemNotification[]>([]);
  const [isExample, setIsExample] = useState(true);
  const [loading, setLoading] = useState(false);
  const [convertedIds, setConvertedIds] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    const [grantedResult, notifResult] = await Promise.all([isNotificationAccessGranted(), fetchRecentNotifications()]);
    setGranted(grantedResult);
    setItems(notifResult.items);
    setIsExample(notifResult.isExample);
    setLoading(false);
  }

  useEffect(() => {
    if (open) load();
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

            <div className="notif-groups">
              {loading && <p className="hint">Carregando...</p>}
              {!loading && groups.length === 0 && <p className="hint">Nenhuma notificação por aqui.</p>}
              {groups.map((group) => (
                <section key={group.packageName} className="notif-group">
                  <div className="notif-group-header">
                    <strong>{group.appName}</strong>
                    <span className="meta">{group.items.length}</span>
                  </div>
                  <div className="notif-group-items">
                    {group.items.map((item) => {
                      const converted = convertedIds.includes(item.id);
                      return (
                        <div key={item.id} className="notif-card" style={hasScheduleHint(item) ? { opacity: 0.9 } : undefined}>
                          <div className="notif-card-top">
                            <strong className="notif-card-title">{item.title || group.appName}</strong>
                            <span className="meta">{relativeTime(item.postTime)}</span>
                          </div>
                          <p className="notif-card-text">{item.text}</p>
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
