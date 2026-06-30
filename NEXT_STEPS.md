# Próximos passos — When Dungeons Arise

Este arquivo existe pra qualquer sessão nova (nuvem ou local) retomar o projeto sem precisar
reconstruir o contexto do zero. Leia isto antes de mexer em qualquer coisa.

## Onde estamos

App de produtividade gamificado (React + TypeScript + Vite + Capacitor, compila pra Android).
Tema: **Guilda de Aventureiros** — lembretes, calendário, finanças, notas e biblioteca de
PDF/EPUB reorganizados como salas de uma guilda, com sistema de XP/moedas/nível/sequência
diária baseado em ações reais do app.

Tudo isso já está **implementado e funcionando**: ver `README.md` na raiz pra descrição
completa das telas e do sistema de recompensas. Não é preciso reler o histórico do chat —
o `README.md` + este arquivo cobrem o necessário.

## Decisão tomada: não reescrever, adicionar Phaser

O usuário queria mais "sensação de jogo de verdade" (gameplay, não só tema visual) e cogitou
reescrever tudo nativo. Decisão final: **manter o stack atual** (React/TS/Capacitor, todas as
telas e dados como estão) e **adicionar Phaser** só nas partes que precisam parecer jogo de
verdade — sem reescrever nada que já funciona.

Por quê: Phaser é JS/TS, roda dentro de um `<canvas>` montado num componente React comum,
continua compilando pelo mesmo pipeline Capacitor pra Android. Reescrever em Kotlin/nativo
jogaria fora toda a lógica de dados (storage local, leitor de PDF/EPUB, notificações,
sistema de XP) pra ganho incerto.

## Plano do Phaser

1. ✅ **Instalado**: `phaser` está em `frontend/package.json` (dependency).
2. ✅ **Criado `frontend/src/game-engine/`** com:
   - `PhaserGameCanvas.tsx` — componente React genérico que monta/desmonta uma instância
     Phaser num `<div>` ref (recebe `sceneClass`, `sceneKey`, `width`, `height`, `data`).
   - `scenes/ReceptionScene.ts` — cena da recepção: sem `spriteUrl` desenha um placeholder
     pixelado via `Phaser.Graphics` (mesma silhueta de antes) com tween de idle bob; com
     `spriteUrl` toca a spritesheet de verdade quando ela existir (frames quadrados de
     `size`×`size`, igual à convenção que já existia no `PixelCharacterIdle`).
   - `ReceptionCharacterScene.tsx` — wrapper com a mesma interface de props do antigo
     `PixelCharacterIdle` (`name`, `spriteUrl`, `frameCount`, `fps`, `size`, `color`), pra
     ficar fácil de trocar em outras telas quando fizer sentido.
3. ✅ **Feito**: `GuildReception.tsx` agora usa `ReceptionCharacterScene` no lugar do
   `PixelCharacterIdle` pra Recepcionista — prova de conceito validada (testado com
   Playwright headless: canvas monta, zero erros de console, visual idêntico ao placeholder
   anterior, só que renderizado dentro de um `<canvas>` Phaser de verdade).
4. **Pendência de build**: o bundle JS principal passou de ~700 kB pra ~2,57 MB por causa do
   Phaser, o que estourou o limite padrão de precache do `vite-plugin-pwa` (2 MiB). Resolvido
   subindo `workbox.maximumFileSizeToCacheInBytes` pra 4 MiB em `vite.config.ts`. Se o bundle
   continuar crescendo, considerar lazy-load (`React.lazy`) do `game-engine` — hoje nenhuma
   tela do app usa lazy loading, então não foi feito pra manter consistência, mas é a primeira
   coisa a avaliar se o tempo de carregamento inicial virar problema.
5. **Próximo**: avaliar com o usuário se quer gameplay mais profundo (ex: mini-exploração da
   guilda, item collection visual, animações de conclusão de missão) — não implementar isso
   sem alinhar escopo primeiro, é fácil estourar o tempo aqui.
6. **Importante**: Phaser e React não devem competir pelo mesmo DOM. Cada cena Phaser vive
   isolada num componente próprio; o resto do app (formulários, listas, leitor de PDF/EPUB)
   continua 100% React normal. Não converter telas de CRUD (Mural de Missões, Tesouraria etc.)
   pra Phaser — não faz sentido pra esse tipo de interface.

## Pendências conhecidas (não relacionadas ao Phaser)

- **Spritesheets reais dos personagens**: recepcionista, bibliotecária, tesoureira etc. ainda
  usam um placeholder pixelado animado em CSS (`PixelCharacterIdle.tsx`). O componente já
  aceita `spriteUrl` + `frameCount` + `fps` — é só o usuário fornecer os arquivos (sugestão:
  salvar em `frontend/public/game/characters/` e me avisar os nomes dos arquivos).
- **Build de APK em ambiente de nuvem**: ainda não testado nesta sessão. Vai precisar instalar
  o Android SDK command-line tools (não a IDE) + JDK no ambiente de nuvem antes de rodar
  `npm run build:android` + `./gradlew assembleDebug`. Ver histórico de comandos usados
  localmente como referência (`ANDROID_HOME`, `JAVA_HOME` apontando pro JDK do Android Studio
  — na nuvem vai ser um JDK genérico, não o do Android Studio).
- **iOS**: descartado por enquanto (precisa de Mac/serviço de build pago ou gratuito limitado).
  Não retomar sem o usuário pedir explicitamente.
- **Backend Express/Prisma** (`backend/`): não é mais usado pelo app (tudo é local-first hoje).
  Só existe no repo como base caso um dia se queira sincronizar dados entre aparelhos. Não
  mexer nele sem necessidade real.

## Como retomar

1. Leia `README.md` (visão geral do app) e este arquivo.
2. Rode `cd frontend && npm install && npm run dev` pra confirmar que tudo sobe limpo.
3. Se for mexer no Phaser, comece pelo passo 1 da lista acima.
4. Sempre que terminar uma etapa grande, rode `npx tsc -b --noEmit` antes de buildar o APK.
