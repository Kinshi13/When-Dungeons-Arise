import Phaser from "phaser";

export const RECEPTION_SCENE_KEY = "ReceptionScene";

const SPRITE_KEY = "reception-character";
const BORDER_COLOR = 0x2b2b2b;
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
      : this.createPlaceholder(centerX, centerY, size, color);

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

  private createPlaceholder(x: number, y: number, size: number, colorHex: string) {
    const scale = size / 24;
    const color = Phaser.Display.Color.HexStringToColor(colorHex).color;

    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRect(-4 * scale, -9 * scale, 8 * scale, 7 * scale);
    g.lineStyle(scale, BORDER_COLOR, 1);
    g.strokeRect(-4 * scale, -9 * scale, 8 * scale, 7 * scale);

    g.fillRect(-6 * scale, -2 * scale, 12 * scale, 9 * scale);
    g.strokeRect(-6 * scale, -2 * scale, 12 * scale, 9 * scale);

    g.fillStyle(BORDER_COLOR, 1);
    g.fillRect(-6 * scale, 7 * scale, 4 * scale, 3 * scale);
    g.fillRect(2 * scale, 7 * scale, 4 * scale, 3 * scale);
    g.fillRect(-2 * scale, -6 * scale, 1.5 * scale, 1.5 * scale);
    g.fillRect(1.5 * scale, -6 * scale, 1.5 * scale, 1.5 * scale);

    const container = this.add.container(x, y, [g]);
    return container;
  }
}
