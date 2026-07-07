import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fullscreenSheetFade } from "../motion";
import { useDragDismiss } from "../useDragDismiss";
import { useOverlayBackClose } from "../useOverlayBackClose";
import { ChevronLeftIcon, TrashIcon, PlusIcon } from "../icons";
import { listMonitoredApps, upsertMonitoredApp, removeMonitoredApp, type MonitoredApp } from "../notificationAppPrefs";
import { syncMonitoredPackages } from "../notificationBridge";

interface MonitoredAppsScreenProps {
  open: boolean;
  onClose: () => void;
}

// Extraída de Ajustes pra tela própria — a lista de apps monitorados (com
// formulário de adicionar + 3 toggles por app) tinha virado a seção mais
// longa da página, competindo com o resto das configurações por atenção.
export default function MonitoredAppsScreen({ open, onClose }: MonitoredAppsScreenProps) {
  const [monitoredApps, setMonitoredApps] = useState<MonitoredApp[]>([]);
  const [newAppName, setNewAppName] = useState("");
  const [newPackageName, setNewPackageName] = useState("");
  const { surface, handle } = useDragDismiss({ direction: "down", onClose });
  useOverlayBackClose(open, onClose);

  function refreshMonitoredApps() {
    const apps = listMonitoredApps();
    setMonitoredApps(apps);
    syncMonitoredPackages(apps.filter((a) => a.enabled).map((a) => a.packageName));
  }

  useEffect(() => {
    if (open) refreshMonitoredApps();
  }, [open]);

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

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="note-fullscreen" {...fullscreenSheetFade} {...surface}>
          <div className="lofi-scene lofi-scene-ajustes" aria-hidden="true" />

          <div className="note-fullscreen-content">
            <div className="note-fullscreen-header" {...handle}>
              <button className="icon-btn" onClick={onClose} aria-label="Voltar">
                <ChevronLeftIcon width={20} height={20} /> Voltar
              </button>
              <strong>Notificações monitoradas</strong>
            </div>

            <section className="settings-section">
              <p className="hint">
                Escolha quais apps o gerenciador de notificações do Mural acompanha. Marque como
                prioridade os bancos e carteiras — são os que valem a pena revisar primeiro e os
                únicos elegíveis pra lançar gastos automaticamente nas finanças.
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
                {monitoredApps.length === 0 && <p className="hint">Nenhum app monitorado ainda.</p>}
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
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
