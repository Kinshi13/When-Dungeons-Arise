// Espelha a paleta base de tokens.css como valores JS/TS — necessário
// porque Phaser (canvas) não lê CSS custom properties. Fonte de verdade
// continua sendo tokens.css; mudou lá, muda aqui também (só 2 consumidores
// hoje fora do Phaser, baixo risco de ficarem dessincronizados).
export const STELLA_COLORS = {
  cream: "#f7e5c9",
  ivory: "#ead8b0",
  gold: "#d8a66a",
  blue: "#7faee6",
  sky: "#9cc9f1",
  lavender: "#7b61a8",
  coral: "#e45d4e",
  graphite: "#3a3f4b",
} as const;

// Mesmos valores como número hex (0xRRGGBB) — formato que a API do Phaser
// espera (tint, fillColor, lineStyle...), em vez de string CSS.
export const STELLA_COLORS_HEX = {
  cream: 0xf7e5c9,
  ivory: 0xead8b0,
  gold: 0xd8a66a,
  blue: 0x7faee6,
  sky: 0x9cc9f1,
  lavender: 0x7b61a8,
  coral: 0xe45d4e,
  graphite: 0x3a3f4b,
} as const;
