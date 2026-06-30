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
5. ✅ **Feito — mini-exploração da guilda**: a grade estática de botões (`room-grid` /
   `PixelRoomButton`, removidos) virou um mapa Phaser navegável:
   - `scenes/GuildMapScene.ts` — desenha o "chão" da guilda com grid sutil, 6 salas como
     prédios coloridos (retângulo + label), e o personagem do jogador. Tocar numa sala faz o
     personagem andar até lá (tween com velocidade fixa, não é teleporte) e só dispara a
     navegação (`onEnterRoom`) quando ele chega.
   - `GuildMapCanvas.tsx` — wrapper React que mede a largura do container via
     `ResizeObserver` (mapa é responsivo, ao contrário do personagem fixo da recepção) e liga
     `onEnterRoom` a `useNavigate()` + som de moeda, igual o antigo `PixelRoomButton` fazia.
   - `drawPixelCharacterPlaceholder.ts` — desenho do personagem placeholder extraído da
     `ReceptionScene` pra ser reaproveitado também no mapa (mesmo personagem em dois lugares).
   - `GuildReception.tsx` define `GUILD_ROOMS` (id/label/rota/cor/posição 0..1 no mapa) e
     renderiza `<GuildMapCanvas rooms={GUILD_ROOMS} />` no lugar do grid antigo.
   - **Bug real encontrado e corrigido durante a implementação**: passar `data` pro Phaser via
     `scene: SceneClass` na config do `Game` + `game.scene.start(key, data)` depois do evento
     `READY` cria uma corrida — a cena já roda `create()` uma vez com `data` undefined antes do
     `start()` explícito rodar, jogando `TypeError` (`Cannot read properties of undefined`) e
     deixando canvases órfãos no DOM. Corrigido em `PhaserGameCanvas.tsx`: não usar `scene:` na
     config do `Game`; em vez disso, logo após criar o `Game`, chamar
     `game.scene.add(sceneKey, sceneClass, true, data)`, que já recebe os dados de init no
     mesmo passo que inicia a cena (sem corrida). Confirmado com teste Playwright headless
     (tap numa sala → personagem anda → navega pra rota certa, zero erros de console, 1 único
     canvas no DOM).
6. ✅ **Feito — tela `GuildReceptionScreen` (substituiu a recepção anterior)**: a recepção virou
   uma única cena Phaser coesa (`game-engine/scenes/GuildReceptionScene.ts`), em vez de dois
   canvases separados (personagem + mapa). Estrutura modular, espelhando os nomes pedidos:
   - `sceneObjects/drawGuildBackground.ts` — fundo procedural (parede + bandeira da guilda +
     chão em grade), placeholder pro asset `guild_reception_bg`.
   - `sceneObjects/createReceptionistIdleCharacter.ts` — recepcionista com bob de idle +
     área de toque (alterna a fala). Aceita um `ReceptionistSpriteConfig` opcional: sem ele
     desenha o placeholder via `Phaser.Graphics`; com ele toca uma `Sprite` animada a partir do
     spritesheet carregado no `preload()` de `GuildReceptionScene.ts`.
   - `sceneObjects/createMissionBoardHotspot.ts` — mural de missões, visualmente em destaque
     (maior, dourado) com selo vermelho quando há missão vencendo hoje/atrasada.
   - `sceneObjects/createBuildingHotspot.ts` — desenho base de "prédio interativo" reaproveitado
     pelo mural e pelos atalhos.
   - `sceneObjects/createGuildShortcutButton.ts` — atalhos pra Biblioteca, Tesouraria, Sala do
     Tempo, Diário e Ajustes (rota `/regras`, que já embute o `Settings.tsx`).
   - `guildReceptionConfig.ts` — configuração dos atalhos (rota/cor/posição), as 5 mensagens
     fixas da recepcionista e as chaves de preload reservadas pros assets reais
     (`guild_reception_bg`, `receptionist_idle`, `mission_board`, `shortcut_*`, `xp_icon`,
     `coin_icon`, `reward_popup`, `dialog_box`) — nenhuma é carregada ainda, tudo é desenhado
     via `Phaser.Graphics`; basta trocar por `scene.load.image` quando os arquivos existirem.
   - `GuildReceptionCanvas.tsx` — wrapper React responsivo (mede largura via `ResizeObserver`,
     altura derivada `width * 1.05` clampada entre 320–440px), liga navegação e SFX.
   - `pages/GuildReceptionScreen.tsx` — tela em si: monta o canvas + `PixelDialogBox` (mensagem
     inicial reflete o estado real via `useGame()`/`generateMissions()` — prioriza missão
     urgente > pendente hoje > sequência ativa > saudação padrão; cada toque na recepcionista
     avança pra próxima das 5 mensagens) + `DailyMissionSummary` (lista as missões de hoje) +
     parágrafo de missões da semana.
   - Removidos (substituídos pela cena unificada): `ReceptionScene.ts`, `ReceptionCharacterScene.tsx`,
     `GuildMapScene.ts`, `GuildMapCanvas.tsx`. `drawPixelCharacterPlaceholder.ts` continua sendo
     o helper compartilhado de desenho do personagem.
   - **Decisões conscientes que desviam da carta literal do pedido** (documentando o porquê):
     `GameTopBar` **não** foi recriado dentro do Phaser — já existe como componente DOM global
     em `App.tsx`, renderizado em toda tela; duplicá-lo dentro do canvas mostraria nível/XP/moedas
     duas vezes na home. `RewardPopup` não foi plugado nesta tela porque missões só são
     concluídas no Mural (`MissionBoard.tsx`), que já dispara o popup — a recepção apenas navega
     pra lá. Testado via Playwright headless: 1 canvas no DOM, zero erros de console, toque na
     recepcionista cicla a fala, toque no mural navega pra `/missoes`, toque num atalho
     (Biblioteca) navega pra `/biblioteca`.
   - **Correção feita numa rodada seguinte**: a consolidação inicial tinha perdido o suporte a
     spritesheet real da recepcionista (a `ReceptionScene.ts` antiga aceitava `spriteUrl`, mas o
     `createReceptionistIdleCharacter.ts` novo só desenhava o placeholder, sem nenhum jeito de
     carregar arte real). Corrigido: `guildReceptionConfig.ts` ganhou
     `ReceptionistSpriteConfig`/`RECEPTIONIST_SPRITE` (hoje `null`); `GuildReceptionScene.ts`
     ganhou um `preload()` que carrega o spritesheet via `this.load.spritesheet(...)` quando
     `RECEPTIONIST_SPRITE` não é `null`; `createReceptionistIdleCharacter.ts` agora recebe esse
     config como argumento opcional e cria uma `Phaser.GameObjects.Sprite` animada em vez do
     placeholder. Pra ativar: salvar o arquivo em `frontend/public/game/characters/`, preencher
     `RECEPTIONIST_SPRITE` com `url`/`frameSize`/`frameCount`/`fps`. Testado via Playwright
     headless com `RECEPTIONIST_SPRITE` ainda `null` (caminho do placeholder): 1 canvas, zero
     erros de console.
7. **Próximo**: avaliar com o usuário se quer mais gameplay (item collection visual, animação
   de conclusão de missão) — não implementar isso sem alinhar escopo primeiro, é fácil
   estourar o tempo aqui. Também falta decidir se a acessibilidade de navegação por
   teclado/leitor de tela da recepção (hoje só por toque/clique no canvas) importa pro usuário —
   não foi implementada nessa rodada porque o app é de uso pessoal, mas vale perguntar antes
   de assumir que não é necessário.
8. **Importante**: Phaser e React não devem competir pelo mesmo DOM. Cada cena Phaser vive
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
