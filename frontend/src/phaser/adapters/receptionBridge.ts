import type Phaser from "phaser";
import { STELLA_HOTSPOT_TAP_EVENT } from "../scenes/ReceptionScene";

// Única porta de saída da cena pro resto do app — React nunca importa
// Phaser.Scene diretamente, só escuta este evento. Mantém o fluxo do item 17
// do spec: Phaser emite um evento, quem decide o que fazer é a camada de
// aplicação (aqui, a própria GuildReception, via callback).
export function onReceptionHotspotTap(game: Phaser.Game, callback: () => void): () => void {
  game.events.on(STELLA_HOTSPOT_TAP_EVENT, callback);
  return () => game.events.off(STELLA_HOTSPOT_TAP_EVENT, callback);
}
