import Phaser from "phaser";
import { drawPixelCharacterPlaceholder } from "../drawPixelCharacterPlaceholder";
import type { ReceptionistSpriteConfig } from "../guildReceptionConfig";

const CHARACTER_COLOR = "#f4c95d";
const IDLE_ANIM_KEY = "receptionist-idle-anim";

export const RECEPTIONIST_SPRITE_KEY = "receptionist-idle";

function createAnimatedSprite(scene: Phaser.Scene, x: number, y: number, size: number, sprite: ReceptionistSpriteConfig) {
  const aspect = sprite.frameWidth / sprite.frameHeight;
  const gameObject = scene.add.sprite(x, y, RECEPTIONIST_SPRITE_KEY);
  gameObject.setDisplaySize(size * aspect, size);

  if (!scene.anims.exists(IDLE_ANIM_KEY)) {
    scene.anims.create({
      key: IDLE_ANIM_KEY,
      frames: scene.anims.generateFrameNumbers(RECEPTIONIST_SPRITE_KEY, { start: 0, end: sprite.frameCount - 1 }),
      frameRate: sprite.fps,
      repeat: -1,
    });
  }
  gameObject.play(IDLE_ANIM_KEY);
  gameObject.setInteractive({ useHandCursor: true });

  return gameObject;
}

function createPlaceholder(scene: Phaser.Scene, x: number, y: number, size: number) {
  const character = drawPixelCharacterPlaceholder(scene, x, y, size, CHARACTER_COLOR);
  const hitArea = new Phaser.Geom.Rectangle(-size / 2, -size * 0.7, size, size * 1.1);
  character.setInteractive({ hitArea, hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
  return character;
}

// Recepcionista parada no balcão: bob de idle contínuo + área de toque pra alternar a fala.
// Sem `sprite` desenha o placeholder pixelado (Phaser.Graphics); com `sprite` toca a spritesheet
// real carregada no preload da cena (ver `RECEPTIONIST_SPRITE` em guildReceptionConfig.ts).
export function createReceptionistIdleCharacter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  sprite?: ReceptionistSpriteConfig | null
) {
  const character = sprite ? createAnimatedSprite(scene, x, y, size, sprite) : createPlaceholder(scene, x, y, size);

  scene.tweens.add({
    targets: character,
    y: "-=5",
    duration: 800,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  return character;
}
