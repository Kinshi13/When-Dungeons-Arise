import Phaser from "phaser";
import { drawPixelCharacterPlaceholder } from "../drawPixelCharacterPlaceholder";

export const GUILD_MAP_SCENE_KEY = "GuildMapScene";

const FLOOR_COLOR = 0x1c1430;
const FLOOR_LINE_COLOR = 0x251a3d;
const LABEL_TEXT_COLOR = "#1c1430";
const CHARACTER_COLOR = "#6c5ce7";
const CHARACTER_SIZE_RATIO = 0.18;
const MOVE_SPEED = 320; // px/s

export interface GuildMapRoom {
  id: string;
  label: string;
  to: string;
  color: string;
  /** Posição relativa do centro da sala, de 0 a 1 dentro do canvas. */
  x: number;
  y: number;
}

export interface GuildMapSceneData {
  width: number;
  height: number;
  rooms: GuildMapRoom[];
  onEnterRoom: (room: GuildMapRoom) => void;
}

// Mapa navegável da guilda: o jogador toca numa sala e o personagem anda até lá antes de
// entrar (navegar pra rota correspondente). Substitui a grade estática de botões da Recepção.
export default class GuildMapScene extends Phaser.Scene {
  private sceneData!: GuildMapSceneData;
  private character!: Phaser.GameObjects.Container;
  private idleTween?: Phaser.Tweens.Tween;
  private moveTween?: Phaser.Tweens.Tween;

  constructor() {
    super(GUILD_MAP_SCENE_KEY);
  }

  init(data: GuildMapSceneData) {
    this.sceneData = data;
  }

  create() {
    const { width, height, rooms } = this.sceneData;

    this.drawFloor(width, height);
    rooms.forEach((room) => this.createRoomBuilding(room, width, height));

    this.character = drawPixelCharacterPlaceholder(
      this,
      width / 2,
      height * 0.88,
      height * CHARACTER_SIZE_RATIO,
      CHARACTER_COLOR,
    );
    this.startIdleBob();
  }

  private drawFloor(width: number, height: number) {
    const g = this.add.graphics();
    g.fillStyle(FLOOR_COLOR, 1);
    g.fillRect(0, 0, width, height);

    g.lineStyle(1, FLOOR_LINE_COLOR, 0.6);
    const gridSize = 24;
    for (let gx = gridSize; gx < width; gx += gridSize) {
      g.lineBetween(gx, 0, gx, height);
    }
    for (let gy = gridSize; gy < height; gy += gridSize) {
      g.lineBetween(0, gy, width, gy);
    }
  }

  private createRoomBuilding(room: GuildMapRoom, width: number, height: number) {
    const buildingW = width * 0.26;
    const buildingH = height * 0.34;
    const cx = room.x * width;
    const cy = room.y * height;
    const fillColor = Phaser.Display.Color.HexStringToColor(room.color).color;

    const rect = this.add.rectangle(cx, cy, buildingW, buildingH, fillColor);
    rect.setStrokeStyle(3, 0x000000);
    rect.setInteractive({ useHandCursor: true });

    this.add
      .text(cx, cy, room.label, {
        fontFamily: "VT323, monospace",
        fontSize: "15px",
        color: LABEL_TEXT_COLOR,
        align: "center",
        wordWrap: { width: buildingW - 10 },
      })
      .setOrigin(0.5);

    rect.on("pointerup", () => this.walkTo(room, cx, cy - buildingH / 2 - height * 0.06));
  }

  private walkTo(room: GuildMapRoom, targetX: number, targetY: number) {
    this.idleTween?.stop();
    this.moveTween?.stop();

    const dx = targetX - this.character.x;
    const dy = targetY - this.character.y;
    const distance = Math.hypot(dx, dy);
    const duration = (distance / MOVE_SPEED) * 1000;

    this.moveTween = this.tweens.add({
      targets: this.character,
      x: targetX,
      y: targetY,
      duration: Math.max(duration, 120),
      ease: "Linear",
      onComplete: () => {
        this.startIdleBob();
        this.sceneData.onEnterRoom(room);
      },
    });
  }

  private startIdleBob() {
    this.idleTween = this.tweens.add({
      targets: this.character,
      y: this.character.y - 5,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}
