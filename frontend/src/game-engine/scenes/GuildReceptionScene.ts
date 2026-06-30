import Phaser from "phaser";
import { drawGuildBackground } from "../sceneObjects/drawGuildBackground";
import { createReceptionistIdleCharacter, RECEPTIONIST_SPRITE_KEY } from "../sceneObjects/createReceptionistIdleCharacter";
import { createMissionBoardHotspot } from "../sceneObjects/createMissionBoardHotspot";
import { createGuildShortcutButton } from "../sceneObjects/createGuildShortcutButton";
import { RECEPTIONIST_SPRITE, type GuildShortcut } from "../guildReceptionConfig";

export const GUILD_RECEPTION_SCENE_KEY = "GuildReceptionScene";

const MOVE_SPEED = 320; // px/s
const CHARACTER_SIZE_RATIO = 0.16;

export interface GuildReceptionSceneData {
  width: number;
  height: number;
  shortcuts: GuildShortcut[];
  hasUrgentMissions: boolean;
  onEnterMissionBoard: () => void;
  onEnterShortcut: (shortcut: GuildShortcut) => void;
  onReceptionistTap: () => void;
}

// Tela inicial da guilda: fundo + recepcionista (tocar alterna a fala) + mural de missões em
// destaque + atalhos pros outros cômodos. Tocar num prédio faz o personagem andar até lá antes
// de disparar a navegação correspondente — mesma sensação de "andar até a sala" que já tinha
// sido validada no mapa anterior, só que com o mural distinguido visualmente dos atalhos.
export default class GuildReceptionScene extends Phaser.Scene {
  private sceneData!: GuildReceptionSceneData;
  private character!: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite;
  private homeX = 0;
  private homeY = 0;
  private idleTween?: Phaser.Tweens.Tween;
  private moveTween?: Phaser.Tweens.Tween;

  constructor() {
    super(GUILD_RECEPTION_SCENE_KEY);
  }

  init(data: GuildReceptionSceneData) {
    this.sceneData = data;
  }

  preload() {
    if (RECEPTIONIST_SPRITE) {
      this.load.spritesheet(RECEPTIONIST_SPRITE_KEY, RECEPTIONIST_SPRITE.url, {
        frameWidth: RECEPTIONIST_SPRITE.frameSize,
        frameHeight: RECEPTIONIST_SPRITE.frameSize,
      });
    }
  }

  create() {
    const { width, height, shortcuts, hasUrgentMissions } = this.sceneData;

    drawGuildBackground(this, width, height);

    this.homeX = width * 0.5;
    this.homeY = height * 0.2;
    const characterSize = height * CHARACTER_SIZE_RATIO;
    this.character = createReceptionistIdleCharacter(this, this.homeX, this.homeY, characterSize, RECEPTIONIST_SPRITE);
    this.character.on("pointerup", () => this.onReceptionistTap());
    this.startIdleBob();

    const muralWidth = width * 0.36;
    const muralHeight = height * 0.2;
    const muralX = width * 0.5;
    const muralY = height * 0.44;
    const mural = createMissionBoardHotspot(this, {
      x: muralX,
      y: muralY,
      width: muralWidth,
      height: muralHeight,
      urgent: hasUrgentMissions,
    });
    mural.on("pointerup", () =>
      this.walkTo(muralX, muralY + muralHeight / 2 + height * 0.05, () => this.sceneData.onEnterMissionBoard())
    );

    const shortcutWidth = width * 0.24;
    const shortcutHeight = height * 0.15;
    shortcuts.forEach((shortcut) => {
      const cx = shortcut.x * width;
      const cy = shortcut.y * height;
      const button = createGuildShortcutButton(this, {
        x: cx,
        y: cy,
        width: shortcutWidth,
        height: shortcutHeight,
        color: shortcut.color,
        label: shortcut.label,
      });
      button.on("pointerup", () =>
        this.walkTo(cx, cy - shortcutHeight / 2 - height * 0.04, () => this.sceneData.onEnterShortcut(shortcut))
      );
    });
  }

  private onReceptionistTap() {
    this.tweens.add({
      targets: this.character,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 100,
      yoyo: true,
      ease: "Sine.easeInOut",
    });
    this.sceneData.onReceptionistTap();
  }

  private walkTo(targetX: number, targetY: number, onArrive: () => void) {
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
      onComplete: onArrive,
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
