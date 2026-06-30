import Phaser from "phaser";

export interface BuildingHotspotConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label: string;
  fontSize?: string;
}

// Desenha um "prédio" interativo (retângulo + rótulo) reaproveitado tanto pelo mural de
// missões quanto pelos atalhos da guilda. Quem chama decide o que fazer no "pointerup".
export function createBuildingHotspot(scene: Phaser.Scene, config: BuildingHotspotConfig) {
  const { x, y, width, height, color, label, fontSize = "13px" } = config;
  const fillColor = Phaser.Display.Color.HexStringToColor(color).color;

  const rect = scene.add.rectangle(x, y, width, height, fillColor);
  rect.setStrokeStyle(3, 0x000000);
  rect.setInteractive({ useHandCursor: true });

  scene.add
    .text(x, y, label, {
      fontFamily: "VT323, monospace",
      fontSize,
      color: "#1c1430",
      align: "center",
      wordWrap: { width: width - 8 },
    })
    .setOrigin(0.5);

  return rect;
}
