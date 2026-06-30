import Phaser from "phaser";
import { drawPixelCharacterPlaceholder } from "../drawPixelCharacterPlaceholder";

const CHARACTER_COLOR = "#f4c95d";

// Recepcionista parada no balcão: bob de idle contínuo + área de toque pra alternar a fala
// (a animação propriamente dita troca quando o spriteUrl real existir — ver
// drawPixelCharacterPlaceholder e o preload key `receptionist_idle`).
export function createReceptionistIdleCharacter(scene: Phaser.Scene, x: number, y: number, size: number) {
  const character = drawPixelCharacterPlaceholder(scene, x, y, size, CHARACTER_COLOR);

  scene.tweens.add({
    targets: character,
    y: "-=5",
    duration: 800,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  const hitArea = new Phaser.Geom.Rectangle(-size / 2, -size * 0.7, size, size * 1.1);
  character.setInteractive({ hitArea, hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });

  return character;
}
