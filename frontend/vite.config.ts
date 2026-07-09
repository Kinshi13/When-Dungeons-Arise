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
  build: {
    modulePreload: {
      // O Vite, por padrão, injeta <link rel="modulepreload"> pra chunks
      // grandes só porque são alcançáveis no grafo de dependências — mesmo
      // sendo usados só por lazy() (leitor de epub/pdf, cliente Supabase do
      // login). Isso fazia o navegador baixar ~1MB de biblioteca em TODO
      // carregamento do app, mesmo sem o usuário nunca abrir um livro ou a
      // tela de login. Excluir esses dois chunks aqui garante que só quem
      // navega até a rota que realmente os importa paga esse custo.
      resolveDependencies: (_filename, deps) =>
        deps.filter((dep) => !dep.includes('reader-libs') && !dep.includes('supabase-client')),
    },
    rollupOptions: {
      output: {
        // Sem isso, o chunking automático do Rollup às vezes mistura
        // dependências pesadas só usadas por rotas lazy (leitor de
        // epub/pdf, Supabase do login) no MESMO chunk de módulos usados
        // de forma eager (ícones da dock, importados direto em App.tsx)
        // — aí o navegador faz modulepreload desse chunk gigante na
        // largada, mesmo que o usuário nunca abra um livro ou a tela de
        // login. Separar explicitamente garante que só quem realmente
        // importa esses módulos (via lazy()) baixa esse peso.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('pdfjs-dist') || id.includes('epubjs')) return 'reader-libs';
          if (id.includes('@supabase')) return 'supabase-client';
        },
      },
    },
  },
})
