import Phaser from "phaser";

// Ambientação da Biblioteca: poeira dourada flutuando por cima da estante
// (item 11 do spec — Phaser só cuida do ambiente/efeitos aqui; a estante em
// si e a capa dos livros continuam HTML/CSS de sempre, ver Library.tsx).
// Puramente decorativa — sem hotspot, ao contrário da Recepção — pra não
// competir com os gestos de toque já existentes na estante (abrir livro,
// puxar gaveta, importar).
const MOTE_COUNT = 18;

export default class LibraryScene extends Phaser.Scene {
  constructor() {
    super({ key: "LibraryScene" });
  }

  create() {
    const { width, height } = this.scale;

    for (let i = 0; i < MOTE_COUNT; i++) {
      const x = Phaser.Math.Between(0, width);
      const startY = Phaser.Math.Between(0, height);
      const r = Phaser.Math.FloatBetween(1, 2.4);
      const baseAlpha = Phaser.Math.FloatBetween(0.2, 0.5);
      const mote = this.add.circle(x, startY, r, 0xe8c07d, baseAlpha);

      // Sobe devagar e balança de leve nos eixos, reaparecendo por baixo ao
      // sumir por cima — efeito de poeira suspensa, não chuva/queda.
      this.tweens.add({
        targets: mote,
        y: startY - height,
        duration: Phaser.Math.Between(14000, 22000),
        repeat: -1,
        ease: "Linear",
        onRepeat: () => {
          mote.y = height + Phaser.Math.Between(0, 40);
          mote.x = Phaser.Math.Between(0, width);
        },
      });
      this.tweens.add({
        targets: mote,
        x: x + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(3000, 5000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: mote,
        alpha: { from: baseAlpha * 0.3, to: baseAlpha },
        duration: Phaser.Math.Between(1800, 3000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }
}
