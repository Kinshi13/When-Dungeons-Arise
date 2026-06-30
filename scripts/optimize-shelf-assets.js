const path = require("path");
const sharp = require("sharp");

const REF = path.join(__dirname, "..", "design-source", "assets-ref");
const OUT = path.join(__dirname, "..", "frontend", "public");

async function main() {
  // Fundo da estante (drawer / biblioteca)
  await sharp(path.join(REF, "Estante.png"))
    .resize(420, 748, { fit: "cover" })
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toFile(path.join(OUT, "shelf-bg.png"));
  console.log("shelf-bg.png gerado");

  // Sprites de livros: grade 5 colunas x 2 linhas (1024x1536).
  // Livros da linha 1 ficam ancorados na metade inferior da célula;
  // livros da linha 2 ficam ancorados na metade superior — calibrado via recortes de teste.
  const cols = 5;
  const cellW = Math.floor(1024 / cols);
  const rowOffsets = [
    { top: 190, height: 580 },
    { top: 768, height: 560 },
  ];

  const booksDir = path.join(OUT, "books");
  require("fs").mkdirSync(booksDir, { recursive: true });

  let index = 1;
  for (const { top, height } of rowOffsets) {
    for (let c = 0; c < cols; c++) {
      const padX = 4;
      await sharp(path.join(REF, "Esprites livros.png"))
        .extract({
          left: c * cellW + padX,
          top,
          width: cellW - padX * 2,
          height,
        })
        .resize(140, null, { withoutEnlargement: true })
        .png({ compressionLevel: 9, palette: true, quality: 80 })
        .toFile(path.join(booksDir, `book-${index}.png`));
      console.log(`book-${index}.png gerado`);
      index++;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
