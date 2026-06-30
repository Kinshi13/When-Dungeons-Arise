import Phaser from "phaser";
import { drawPixelCharacterPlaceholder } from "../drawPixelCharacterPlaceholder";

export const RECEPTION_SCENE_KEY = "ReceptionScene";

const SPRITE_KEY = "reception-character";
const DEFAULT_COLOR = "#f4c95d";

export interface ReceptionSceneData {
  size: number;
  spriteUrl?: string;
  frameCount?: number;
  fps?: number;
  color?: string;
}

// Cena Phaser que mostra o personagem da recepção animado. Sem spriteUrl, desenha um
// placeholder pixelado (mesma silhueta do antigo PixelCharacterIdle) já dentro do canvas
// Phaser; com spriteUrl, toca a spritesheet de verdade quando ela existir.
export default class ReceptionScene extends Phaser.Scene {
  private sceneData!: ReceptionSceneData;

  constructor() {
    super(RECEPTION_SCENE_KEY);
  }

  init(data: ReceptionSceneData) {
    this.sceneData = data;
  }

  preload() {
    const { spriteUrl, size } = this.sceneData;
    if (spriteUrl) {
      this.load.spritesheet(SPRITE_KEY, spriteUrl, { frameWidth: size, frameHeight: size });
    }
  }

  create() {
    const { spriteUrl, frameCount = 1, fps = 4, size, color = DEFAULT_COLOR } = this.sceneData;
    const centerX = size / 2;
    const centerY = size / 2;

    const character = spriteUrl
      ? this.createAnimatedSprite(centerX, centerY, frameCount, fps)
      : drawPixelCharacterPlaceholder(this, centerX, centerY, size, color);

    this.tweens.add({
      targets: character,
      y: "-=6",
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createAnimatedSprite(x: number, y: number, frameCount: number, fps: number) {
    this.anims.create({
      key: "idle",
      frames: this.anims.generateFrameNumbers(SPRITE_KEY, { start: 0, end: Math.max(frameCount - 1, 0) }),
      frameRate: fps,
      repeat: -1,
    });
    const sprite = this.add.sprite(x, y, SPRITE_KEY);
    sprite.play("idle");
    return sprite;
  }
}
