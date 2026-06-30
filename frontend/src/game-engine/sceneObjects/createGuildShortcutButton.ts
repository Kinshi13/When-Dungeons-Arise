import Phaser from "phaser";
import { createBuildingHotspot } from "./createBuildingHotspot";

export interface GuildShortcutButtonConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label: string;
}

// Atalho visual da guilda (Biblioteca, Tesouraria, Sala do Tempo, Diário, Configurações):
// mesmo "prédio" interativo do mural, só que menor.
export function createGuildShortcutButton(scene: Phaser.Scene, config: GuildShortcutButtonConfig) {
  return createBuildingHotspot(scene, { ...config, fontSize: "12px" });
}
