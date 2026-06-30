# Próximos passos — Guilda de Aventureiros

Este arquivo existe pra qualquer sessão nova (nuvem ou local) retomar o projeto sem precisar
reconstruir o contexto do zero. Leia isto antes de mexer em qualquer coisa.

## Onde estamos

O app foi **reescrito do zero como Android nativo** (Kotlin + Jetpack Compose), substituindo
completamente o stack antigo (React/TS/Vite/Capacitor/Phaser, que vivia em `frontend/`, removido
do repositório). Não houve migração de dados — é um MVP novo.

Reduzido a 3 áreas: **Recepção da Guilda** (missões), **Tesouraria** (finanças) e **Biblioteca**
(leitor de PDF/EPUB), navegáveis por swipe horizontal. Ver `README.md` pra descrição completa
das telas e do sistema de recompensas.

Arquitetura: `domain/` (modelos puros + regras de recompensa) → `data/` (Room: entidades, DAOs,
repositórios) → `ui/` (telas Compose + ViewModels), conectados por um `AppContainer` (service
locator manual, sem Hilt/Dagger) exposto via `GuildaApplication`.

Tudo isso já está **implementado, compilando e com APK de debug gerado** (`./gradlew
:app:assembleDebug`).

## Pendências conhecidas

- **Personagens/sprites animados**: não existem ainda — os 3 fundos de tela (recepção,
  tesouraria, biblioteca) são imagens estáticas derivadas das referências visuais originais.
  Se quiser personagens animados, é um trabalho novo de asset + integração.
- **EPUB sem formatação rica**: o parser (`ui/reader/EpubParser.kt`) extrai só texto puro do
  spine do EPUB (sem itálico/negrito/imagens inline) — decisão consciente de escopo pro MVP. Se
  precisar de fidelidade maior, vale avaliar uma biblioteca de EPUB de verdade.
- **Sem backend/sincronização**: tudo é local-first (Room/SQLite no próprio celular). O
  `backend/` antigo (Node/Express/Prisma) não é usado pelo app nativo; mantido só como
  referência histórica caso um dia se queira sincronizar dados entre aparelhos.
- **iOS**: não existe — o app é Android-only.

## Como retomar

1. Leia `README.md` (visão geral, sistema de recompensas, como compilar).
2. Rode `./gradlew :app:compileDebugKotlin` e `./gradlew :app:testDebugUnitTest` pra confirmar
   que tudo compila e os testes de gamificação passam.
3. Rode `./gradlew :app:assembleDebug` pra gerar um APK de debug novo em
   `app/build/outputs/apk/debug/app-debug.apk`.
