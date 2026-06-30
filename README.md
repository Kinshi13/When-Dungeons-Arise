# Guilda de Aventureiros

App de produtividade gamificado, agora **nativo Android** (Kotlin + Jetpack Compose). Reduzido a um MVP com 3 áreas:

- **Recepção da Guilda** — mural de missões (tarefas diárias), XP, moedas, nível e sequência diária. Criar/aceitar/concluir missões dá recompensas.
- **Tesouraria** — registrar gastos do dia, contas a pagar, valores a receber e uma calculadora simples. Ações financeiras também geram XP/moedas.
- **Biblioteca** — importar e ler PDF/EPUB, com progresso salvo por item. Toque na direita avança página, na esquerda volta, duplo toque dá zoom.

Navegação entre as 3 áreas é por swipe horizontal. **100% offline**: todos os dados ficam no banco local (Room/SQLite) do próprio celular.

## Estrutura

- `app/` — projeto Android nativo (Kotlin + Jetpack Compose), única parte necessária para rodar o app:
  - `domain/` — modelos puros e regras de recompensa (XP, moedas, níveis).
  - `data/` — entidades Room, DAOs e repositórios.
  - `ui/` — telas Compose, componentes do design system pixelado e ViewModels.
- `backend/` — API antiga (Node/Express/Prisma), não usada pelo app nativo. Mantida apenas como referência histórica.

## Sistema de recompensas

- Missão simples: +10 XP / +10 moedas
- Missão média: +25 XP / +25 moedas
- Missão importante: +50 XP / +50 moedas
- Bônus de 3 missões concluídas no dia: +50 XP
- 20 minutos de leitura: +30 XP / +20 moedas
- Registrar uma despesa: +10 XP
- Pagar uma conta: +20 XP / +15 moedas

Missões atrasadas **não são punidas** — continuam dando a recompensa completa, só não contam para o bônus diário de 3 missões.

## Como compilar

Pré-requisitos: JDK 17 e Android SDK (cmdline-tools + platform 36 + build-tools).

```bash
./gradlew :app:assembleDebug
```

O APK de debug fica em `app/build/outputs/apk/debug/app-debug.apk`.

### Rodar os testes

```bash
./gradlew :app:testDebugUnitTest
```

### Instalar no celular

1. Copie o APK gerado para o celular.
2. Abra o arquivo e permita "instalar de fontes desconhecidas" se solicitado.
3. Abra o app **Guilda de Aventureiros**.

### Sobre os dados

Todos os dados (missões, progresso, finanças, biblioteca) ficam no banco Room local do app. Documentos importados (PDF/EPUB) são copiados para o armazenamento interno do app. Tudo persiste entre usos normais, mas é apagado se você desinstalar o app ou limpar os dados dele nas configurações do Android — não há backup automático na nuvem.
