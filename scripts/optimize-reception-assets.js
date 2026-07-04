const path = require("path");
const sharp = require("sharp");

const REF = path.join(__dirname, "..", "design-source", "assets-ref");
const OUT = path.join(__dirname, "..", "frontend", "public");

async function main() {
  // Fundo estático da Recepção da Guilda (Home)
  await sharp(path.join(REF, "Recepcao.png"))
    .resize(540, 960, { fit: "cover" })
    .png({ compressionLevel: 9, palette: true, quality: 82 })
    .toFile(path.join(OUT, "guild-reception-bg.png"));
  console.log("guild-reception-bg.png gerado");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
