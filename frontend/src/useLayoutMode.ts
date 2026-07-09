import { useEffect, useState } from "react";
import { layoutModeOf, type LayoutMode } from "./core/design-system/breakpoints";

function currentMode(): LayoutMode {
  if (typeof window === "undefined") return "mobile";
  return layoutModeOf(window.innerWidth);
}

// Modo de layout atual (mobile/tablet/desktop) — usado pra densidade
// responsiva das constelações SVG (seção 9 do briefing: "não duplicar
// lógica, usar configs responsivas"). Só re-renderiza quando o modo de
// verdade muda (não a cada pixel de resize).
export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>(currentMode);

  useEffect(() => {
    function onResize() {
      setMode((prev) => {
        const next = currentMode();
        return next === prev ? prev : next;
      });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return mode;
}
