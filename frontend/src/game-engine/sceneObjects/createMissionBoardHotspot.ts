import Phaser from "phaser";
import { createBuildingHotspot } from "./createBuildingHotspot";

const MURAL_COLOR = "#ffd23f";
const BADGE_COLOR = 0xff4d6d;

export interface MissionBoardHotspotConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Mostra um selo vermelho quando há missões vencendo hoje ou atrasadas. */
  urgent: boolean;
}

// Mural de missões: prédio em destaque (maior e mais dourado que os atalhos comuns).
export function createMissionBoardHotspot(scene: Phaser.Scene, config: MissionBoardHotspotConfig) {
  const { x, y, width, height, urgent } = config;
  const rect = createBuildingHotspot(scene, {
    x,
    y,
    width,
    height,
    color: MURAL_COLOR,
    label: "Mural de Missões",
    fontSize: "15px",
  });

  if (urgent) {
    const badgeX = x + width / 2 - 8;
    const badgeY = y - height / 2 + 8;
    const badge = scene.add.circle(badgeX, badgeY, 7, BADGE_COLOR);
    badge.setStrokeStyle(2, 0x000000);
    scene.add
      .text(badgeX, badgeY, "!", { fontFamily: "VT323, monospace", fontSize: "13px", color: "#ffffff" })
      .setOrigin(0.5);
  }

  return rect;
}
