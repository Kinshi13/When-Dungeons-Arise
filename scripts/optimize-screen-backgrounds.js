const path = require("path");
const sharp = require("sharp");

const REF = path.join(__dirname, "..", "design-source", "assets-ref");
const OUT = path.join(__dirname, "..", "frontend", "public");

// Fundos de tela (Recepção fica em optimize-reception-assets.js, com tratamento próprio).
// O blur/escurecimento é aplicado em CSS (App.css, .page-bg-blurred), não na imagem —
// assim dá pra ajustar a intensidade sem regenerar o arquivo.
const SCREENS = [
  { src: "Calendario-temp.jpg", out: "calendar-bg.png" },
  { src: "Financas.png", out: "finance-bg.png" },
  { src: "Financas-temp.jpg", out: "diario-notas-bg.png" },
  { src: "Calendario-temp.jpg", out: "diario-listas-bg.png" },
];

async function main() {
  for (const { src, out } of SCREENS) {
    await sharp(path.join(REF, src))
      .resize(540, 960, { fit: "cover" })
      .png({ compressionLevel: 9, palette: true, quality: 82 })
      .toFile(path.join(OUT, out));
    console.log(`${out} gerado`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
