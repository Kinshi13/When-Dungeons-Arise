import { useEffect, useRef, type CSSProperties } from "react";
import Phaser from "phaser";

interface PhaserCanvasProps {
  scene: typeof Phaser.Scene;
  className: string;
  style?: CSSProperties;
  // Chamado logo após o Phaser.Game ser criado — devolve a função de limpeza
  // (ex.: desinscrever de um evento da cena), chamada antes de game.destroy().
  onGameCreated?: (game: Phaser.Game) => (() => void) | void;
}

// Bootstrapping compartilhado de um Phaser.Game de ambientação — canvas
// transparente ocupando o container pai inteiro, ciclo de vida preso ao
// mount/unmount do componente. Usado por ReceptionCanvas e LibraryCanvas;
// os dois só diferem na Scene (e a Recepção também tem um hotspot tocável
// por cima, ver onGameCreated).
export default function PhaserCanvas({ scene, className, style, onGameCreated }: PhaserCanvasProps) {
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
      scene: [scene],
      banner: false,
    });

    const cleanup = onGameCreated?.(game);

    return () => {
      cleanup?.();
      game.destroy(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={className} style={style} aria-hidden="true" />;
}
