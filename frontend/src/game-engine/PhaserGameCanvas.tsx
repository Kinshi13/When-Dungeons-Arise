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
      audio: { noAudio: true },
    });

    // Adiciona a cena com os dados de init já em mãos (autoStart: true), em vez de deixar o
    // Phaser auto-iniciá-la pela config do Game — isso evitaria uma corrida onde create()
    // roda antes da gente conseguir passar `data`.
    game.scene.add(sceneKey, sceneClass, true, data);

    return () => {
      game.destroy(true);
    };
  }, [sceneClass, sceneKey, width, height, data]);

  return <div ref={containerRef} className="phaser-game-canvas" style={{ width, height }} />;
}
