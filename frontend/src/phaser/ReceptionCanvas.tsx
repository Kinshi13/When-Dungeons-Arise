import PhaserCanvas from "./PhaserCanvas";
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
  return (
    <PhaserCanvas
      scene={ReceptionScene}
      className="reception-phaser-canvas"
      onGameCreated={(game) => onReceptionHotspotTap(game, onHotspotTap)}
    />
  );
}
