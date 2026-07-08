import PhaserCanvas from "./PhaserCanvas";
import LibraryScene from "./scenes/LibraryScene";

// Carregada só via React.lazy (ver Library.tsx) — mesmo motivo do
// ReceptionCanvas: Phaser não entra no bundle principal das outras áreas.
export default function LibraryCanvas() {
  return <PhaserCanvas scene={LibraryScene} className="library-phaser-canvas" />;
}
