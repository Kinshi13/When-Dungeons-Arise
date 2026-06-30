import { useEffect, useRef } from "react";
import Phaser from "phaser";

interface PhaserGameCanvasProps<TData extends object> {
  sceneClass: new () => Phaser.Scene;
  sceneKey: string;
  width: number;
  height: number;
  data?: TData;
}

// Monta/desmonta uma instância isolada do Phaser num <div> próprio. Cada cena vive no seu
// canvas; o resto da tela continua React normal por fora deste componente.
export default function PhaserGameCanvas<TData extends object>({
  sceneClass,
  sceneKey,
  width,
  height,
  data,
}: PhaserGameCanvasProps<TData>) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width,
      height,
      parent,
      transparent: true,
      pixelArt: true,
      scene: sceneClass,
      audio: { noAudio: true },
    });

    game.events.once(Phaser.Core.Events.READY, () => {
      game.scene.start(sceneKey, data);
    });

    return () => {
      game.destroy(true);
    };
  }, [sceneClass, sceneKey, width, height, data]);

  return <div ref={containerRef} className="phaser-game-canvas" style={{ width, height }} />;
}
