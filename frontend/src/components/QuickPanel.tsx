import { useEffect, useState, type SVGProps, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { sheetBackdropFade, sheetSlideUp } from "../motion";
import { useDragDismiss } from "../useDragDismiss";
import { useOverlayBackClose } from "../useOverlayBackClose";
import { navigateToQuickAction, type QuickActionId } from "../useQuickAction";
import { api, type Bill, type Reminder } from "../api";
import { nextAlarm } from "../clockStore";
import { getCachedPrimaryWeather } from "../weather";
import { buildHomeSummary } from "../game/homeSummary";
import { BellIcon, HourglassIcon, DiaryIcon, ChecklistIcon, CoinIcon, CalendarIcon } from "../icons";
import { playSfx } from "../sound";

interface QuickPanelProps {
  open: boolean;
  onClose: () => void;
}

interface QuickAction {
  id: QuickActionId;
  label: string;
  path: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
}

// Espelha as ações sugeridas na seção 6 do spec (Painel Rápido) — cada uma
// navega até a tela que já tem a UI de criação correspondente e avisa (via
// useQuickAction na tela de destino) pra focar/abrir o fluxo certo, em vez de
// só trocar de rota sem efeito nenhum.
const QUICK_ACTIONS: QuickAction[] = [
  { id: "novo-alarme", label: "Novo alarme", path: "/", Icon: BellIcon },
  { id: "novo-temporizador", label: "Novo temporizador", path: "/", Icon: HourglassIcon },
  { id: "nova-nota", label: "Nova nota", path: "/diario/notas", Icon: DiaryIcon },
  { id: "nova-missao", label: "Nova missão", path: "/missoes/missoes", Icon: ChecklistIcon },
  { id: "novo-gasto", label: "Novo gasto", path: "/tesouraria/movimentos", Icon: CoinIcon },
  { id: "novo-evento", label: "Novo evento", path: "/sala-do-tempo/agenda", Icon: CalendarIcon },
];

export default function QuickPanel({ open, onClose }: QuickPanelProps) {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const { surface, handle, backdropOpacity } = useDragDismiss({ direction: "down", onClose });
  useOverlayBackClose(open, onClose);

  useEffect(() => {
    if (!open) return;
    api.reminders.list().then(setReminders);
    api.bills.list().then(setBills);
  }, [open]);

  const summary = buildHomeSummary(reminders, bills, getCachedPrimaryWeather(), nextAlarm());

  function handleAction(action: QuickAction) {
    playSfx("coin");
    onClose();
    navigateToQuickAction(navigate, action.path, action.id);
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="quick-panel-backdrop" {...sheetBackdropFade} onClick={onClose}>
          <motion.div className="quick-panel-backdrop-fill" style={{ opacity: backdropOpacity }} />
          <motion.div
            className="quick-panel"
            onClick={(e) => e.stopPropagation()}
            {...sheetSlideUp}
            {...surface}
            {...handle}
          >
            <div className="quick-panel-handle" />

            {(summary.highlight || summary.alarm || summary.weather) && (
              <div className="quick-panel-summary">
                {summary.highlight && (
                  <span className="quick-panel-summary-row quick-panel-summary-highlight">
                    <span aria-hidden="true">{summary.highlight.icon}</span> {summary.highlight.text}
                  </span>
                )}
                {summary.alarm && (
                  <span className="quick-panel-summary-row">
                    <span aria-hidden="true">{summary.alarm.icon}</span> {summary.alarm.text}
                  </span>
                )}
                {summary.weather && (
                  <span className="quick-panel-summary-row">
                    <span aria-hidden="true">{summary.weather.icon}</span> {summary.weather.text}
                  </span>
                )}
              </div>
            )}

            <div className="quick-panel-actions">
              {QUICK_ACTIONS.map((action) => (
                <button key={action.id} className="quick-panel-action" onClick={() => handleAction(action)}>
                  <action.Icon width={22} height={22} />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
