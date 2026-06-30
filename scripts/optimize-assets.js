const path = require("path");
const sharp = require("sharp");

const REF = path.join(__dirname, "..", "frontend", "public", "assets-ref");
const OUT = path.join(__dirname, "..", "frontend", "public");

async function main() {
  await sharp(path.join(REF, "estrela.png"))
    .resize(320, 480, { fit: "inside" })
    .png({ quality: 80, compressionLevel: 9 })
    .toFile(path.join(OUT, "logo-star.png"));
  console.log("logo-star.png gerado");

  await sharp(path.join(REF, "mago-fogueira.gif"), { animated: true })
    .resize(480, 360, { fit: "cover" })
    .gif({ colors: 96 })
    .toFile(path.join(OUT, "ambient-bg.gif"));
  console.log("ambient-bg.gif gerado");

  const iconsDir = path.join(OUT, "icons-game");
  for (const name of ["bell", "envelope", "chest", "calendar"]) {
    const src = path.join(iconsDir, `${name}.png`);
    const tmp = path.join(iconsDir, `${name}.tmp.png`);
    await sharp(src).resize(96, 96).png({ compressionLevel: 9 }).toFile(tmp);
    require("fs").renameSync(tmp, src);
    console.log(`${name}.png otimizado`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
