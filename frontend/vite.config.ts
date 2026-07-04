import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Caminhos relativos (em vez de "/assets/...") — o build web/Android serve
  // sempre a partir da raiz, então isso não muda nada pra eles, mas é
  // obrigatório pro shell Electron: ele abre o index.html via file://, e
  // nesse protocolo um caminho absoluto tenta resolver a partir da raiz do
  // sistema de arquivos (ex.: C:\assets\...) em vez da pasta do dist — os
  // scripts/CSS todos "404"avam e a janela ficava só na cor de fundo,
  // sem nada do React montar.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Lembretes',
        short_name: 'Lembretes',
        description: 'Lembretes, planejamentos, finanças e contas — tudo salvo no dispositivo',
        theme_color: '#1c1430',
        background_color: '#0f0a1e',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    host: true,
  },
})
