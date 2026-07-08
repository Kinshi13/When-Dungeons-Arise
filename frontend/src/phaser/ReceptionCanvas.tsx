import { useEffect, useRef } from "react";
import Phaser from "phaser";
import ReceptionScene from "./scenes/ReceptionScene";
import { onReceptionHotspotTap } from "./adapters/receptionBridge";

interface ReceptionCanvasProps {
  onHotspotTap: () => void;
}

// Carregada só via React.lazy (ver GuildReception.tsx) — Phaser não entra no
// bundle principal, só baixa quando a Recepção realmente monta. O canvas fica
// transparente (a ilustração da Guilda continua sendo a <img> de sempre,
// atrás dele) e só recebe toque na área do próprio hotspot; o resto do
// espaço deixa o clique passar pros cards HTML por cima (ver stella-core.css
// pra um caso parecido de camadas).
export default function ReceptionCanvas({ onHotspotTap }: ReceptionCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      transparent: true,
      parent: container,
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: container.clientWidth,
        height: container.clientHeight,
      },
      scene: [ReceptionScene],
      banner: false,
    });

    const unsubscribe = onReceptionHotspotTap(game, onHotspotTap);

    return () => {
      unsubscribe();
      game.destroy(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="reception-phaser-canvas" aria-hidden="true" />;
}
