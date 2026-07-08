import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useOverlayBackClose } from "../../useOverlayBackClose";
import { playSfx } from "../../sound";
import StellaStarIcon from "./StellaStarIcon";
import "./stella-core.css";

export interface StellaAction {
  id: string;
  label: string;
  icon: ReactNode;
  priority: number;
  execute: () => void;
}

interface StellaCoreProps {
  actions: StellaAction[];
}

const ARC_DEGREES = 150;
const RADIUS = 92;

// Ângulo de cada ação no leque, medido a partir da vertical (0° = pra cima),
// distribuído simetricamente em torno do topo. Com 1 ação só, fica reto pra
// cima; com várias, abre em leque igual dos dois lados.
function angleFor(index: number, total: number): number {
  if (total <= 1) return 0;
  return -ARC_DEGREES / 2 + (ARC_DEGREES * index) / (total - 1);
}

// Botão central expansível — elemento principal da identidade Stella Founds.
// Multiplataforma de propósito: nenhuma lógica aqui depende de touch vs mouse
// (onClick cobre os dois) nem de Android especificamente (o fechar por botão
// Voltar vem de graça via useOverlayBackClose, que é uma pilha global inerte
// fora do Android). Cada tela decide suas próprias ações — este componente
// não conhece nenhuma delas.
export default function StellaCore({ actions }: StellaCoreProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useOverlayBackClose(open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const sorted = [...actions].sort((a, b) => b.priority - a.priority);

  function toggle() {
    playSfx("coin");
    setOpen((v) => !v);
  }

  function runAction(action: StellaAction) {
    playSfx("coin");
    setOpen(false);
    action.execute();
  }

  return (
    <div className="stella-core" ref={rootRef}>
      {open &&
        createPortal(
          <div className="stella-core-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />,
          document.body
        )}

      <AnimatePresence>
        {open && (
          <div className="stella-core-fan" role="menu">
            {sorted.map((action, i) => {
              const angle = angleFor(i, sorted.length);
              const rad = (angle * Math.PI) / 180;
              const x = Math.sin(rad) * RADIUS;
              const y = -Math.cos(rad) * RADIUS;
              return (
                <motion.button
                  key={action.id}
                  role="menuitem"
                  className="stella-core-action"
                  aria-label={action.label}
                  onClick={() => runAction(action)}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                  animate={{ opacity: 1, x, y, scale: 1 }}
                  exit={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                  transition={{ type: "spring", stiffness: 380, damping: 26, delay: i * 0.03 }}
                >
                  <span className="stella-core-action-icon">{action.icon}</span>
                  <span className="stella-core-action-label">{action.label}</span>
                </motion.button>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        className="stella-core-trigger"
        aria-label={open ? "Fechar ações rápidas" : "Abrir ações rápidas"}
        aria-expanded={open}
        onClick={toggle}
        whileTap={{ scale: 0.9 }}
        animate={open ? { rotate: 45 } : { rotate: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 24 }}
      >
        <StellaStarIcon width={26} height={26} />
      </motion.button>
    </div>
  );
}
