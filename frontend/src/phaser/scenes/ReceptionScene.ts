import Phaser from "phaser";

// Ambientação da Recepção: campo de estrelas piscando + linhas de
// constelação que aparecem e somem entre pares próximos, sobre a ilustração
// estática existente (que continua sendo HTML/CSS, não isto — ver item 5 do
// spec: "a imagem estática... Phaser só pra cenário/partículas/hotspots").
// Um "núcleo" central pulsante funciona como hotspot: ao tocar, emite um
// evento no barramento do próprio jogo — nunca chama storage, navegação ou
// regra de negócio diretamente (ver receptionBridge.ts e o item 2 do spec:
// Phaser -> Action/Event -> Application Service).
const STAR_COUNT = 26;
export const STELLA_HOTSPOT_TAP_EVENT = "stella:hotspot-tap";

interface StarData {
  gfx: Phaser.GameObjects.Arc;
  baseAlpha: number;
}

export default class ReceptionScene extends Phaser.Scene {
  private stars: StarData[] = [];

  constructor() {
    super({ key: "ReceptionScene" });
  }

  create() {
    const { width, height } = this.scale;
    this.stars = [];

    for (let i = 0; i < STAR_COUNT; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.55);
      const r = Phaser.Math.FloatBetween(0.8, 1.8);
      const baseAlpha = Phaser.Math.FloatBetween(0.25, 0.7);
      const star = this.add.circle(x, y, r, 0xf4e9c9, baseAlpha);
      this.stars.push({ gfx: star, baseAlpha });

      this.tweens.add({
        targets: star,
        alpha: { from: baseAlpha * 0.3, to: baseAlpha },
        duration: Phaser.Math.Between(1400, 3200),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        ease: "Sine.easeInOut",
      });
    }

    // Linhas de constelação: só entre estrelas próximas o bastante, desenhadas
    // uma vez (o campo não se move, só pisca) — leve, sem custo por frame.
    const lines = this.add.graphics();
    lines.lineStyle(1, 0xf4e9c9, 0.12);
    for (let i = 0; i < this.stars.length; i++) {
      for (let j = i + 1; j < this.stars.length; j++) {
        const a = this.stars[i].gfx;
        const b = this.stars[j].gfx;
        const dist = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
        if (dist < width * 0.14) {
          lines.lineBetween(a.x, a.y, b.x, b.y);
        }
      }
    }

    // Núcleo pulsante — o hotspot tocável, sempre num ponto fixo (canto
    // superior, longe da área dos cards flutuantes por baixo).
    const hotspotX = width * 0.82;
    const hotspotY = height * 0.14;
    const core = this.add.circle(hotspotX, hotspotY, 7, 0x8fb3f5, 0.9);
    core.setInteractive({ useHandCursor: true });
    core.on("pointerdown", () => {
      this.game.events.emit(STELLA_HOTSPOT_TAP_EVENT);
    });

    this.tweens.add({
      targets: core,
      scale: { from: 1, to: 1.6 },
      alpha: { from: 0.9, to: 0.3 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}
