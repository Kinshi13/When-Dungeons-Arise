import { defineConfig } from "vitest/config";

// Config própria (não dentro de vite.config.ts) pra não misturar o plugin
// VitePWA/Workbox — que só faz sentido no build real — com a execução de
// testes. Sem "globals" de propósito: cada teste importa describe/it/expect
// explicitamente de "vitest", assim tsc -b não precisa conhecer os globais.
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
