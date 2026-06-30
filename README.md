# Lembretes — Guilda de Aventureiros

App de produtividade gamificado: lembretes, calendário, finanças, notas e biblioteca de PDF/EPUB, todos reorganizados como uma **Guilda de Aventureiros** em pixel art. Concluir tarefas reais dá XP e moedas, sobe de nível, mantém sequência diária — mas por baixo do tema é o mesmo gerenciador pessoal de sempre. Disponível como app Android instalável (APK) com notificações locais.

**Salas da guilda (barra inferior, Recepção no centro como tela principal):**
- **Mural de Missões** (`/missoes`) — seus lembretes/tarefas viram missões diárias, semanais e especiais. Concluir uma dá XP + moedas.
- **Tesouraria** (`/tesouraria`) — finanças, contas a pagar e calculadora, em abas.
- **Recepção da Guilda** (`/`) — tela inicial: recepcionista, resumo do dia, atalhos para todas as salas.
- **Sala do Tempo** (`/sala-do-tempo`) — calendário mensal.
- **Diário do Aventureiro** (`/diario`) — notas rápidas, com opção de transformar uma nota em missão.

Arraste para a esquerda/direita no meio da tela pra navegar entre as 5 salas da barra inferior.

**Acessíveis pela Recepção:**
- **Biblioteca da Guilda** (`/biblioteca`) — estante de PDFs/EPUBs importados, com leitor embutido em tela cheia (toque esquerda/direita pra virar página, duplo toque pra zoom, progresso salvo por livro). Ler 20 minutos rende XP.
- **Livro de Regras** (`/regras`) — configurações do app.
- **Perfil do Aventureiro** (`/perfil`, acessível tocando na barra de XP no topo) — nível, XP, moedas e sequência diária.

**Sistema de recompensas:** tarefa simples +10 XP/moedas, média +25, importante +50; ler 20min +30 XP; nota criada +10 XP; despesa registrada +15 XP; conta paga +15 XP/+10 moedas; combo de 3 missões no dia +50 XP bônus; sequência diária dá bônus crescente de moedas. Atrasar uma missão não tira XP — só zera o combo do dia.

**Visual e som:** tela de carregamento com logo, ícones de navegação desenhados sob medida, fundo animado (loop de GIF com leve desfoque), efeito de moeda ao trocar de aba, efeito de gota ao preencher campos, som de página ao virar no leitor. Personagens (recepcionista, bibliotecária, tesoureira...) usam um placeholder pixelado animado em CSS até spritesheets reais serem adicionados em `frontend/public/game/`. Em Ajustes (Livro de Regras) dá pra controlar volume dos efeitos, ligar/desligar música de fundo, escolher o tamanho da interface (Original / -25% / -50%) e desativar animações para economizar desempenho.

**100% offline e independente**: todos os dados ficam salvos no próprio celular (localStorage do app). Não precisa de internet, de Wi-Fi, nem de um computador ligado para funcionar — o app é totalmente autossuficiente.

## Estrutura

- `frontend/` — App React + TypeScript + Vite, empacotado como Android nativo via Capacitor. Único componente necessário para usar o app.
- `backend/` — API Node.js + Express + TypeScript + Prisma (SQLite), **não é mais usada pelo app**. Ficou no repositório apenas como base caso um dia você queira sincronizar dados entre vários aparelhos; hoje pode ser ignorada.

## Como rodar localmente (navegador desktop)

```bash
cd frontend
npm install
npm run dev
```

O app sobe em `http://localhost:5173` e já funciona sozinho (sem precisar do backend).

## Instalar no celular Android (APK)

O app já vem empacotado como projeto Android em `frontend/android/`. Um APK de debug pronto está em [lembretes-app-debug.apk](./lembretes-app-debug.apk).

1. Copie `lembretes-app-debug.apk` para o celular (cabo USB, Google Drive, etc.).
2. No celular, abra o arquivo e permita "instalar de fontes desconhecidas" se solicitado.
3. Abra o app **Lembretes**. Na tela **Ajustes**, toque em "Ativar notificações" e permita.

Não precisa de Wi-Fi, do PC ligado, nem de nenhuma configuração de rede — o app funciona completamente sozinho assim que instalado.

### Gerar um novo APK após alterações no código

```bash
cd frontend
npm run build:android
cd android
./gradlew clean assembleDebug
```

O APK gerado fica em `frontend/android/app/build/outputs/apk/debug/app-debug.apk`. Use `clean` sempre que alterar arquivos em `public/` (imagens, áudio) — o build incremental às vezes não detecta essas mudanças e empacota um APK desatualizado/maior do que o necessário.

### Sobre os dados

Os dados (lembretes, gastos, contas, notas) ficam salvos no armazenamento local do app no celular. Documentos importados (PDF/EPUB) ficam num banco local separado (IndexedDB), pensado pra arquivos maiores. Tudo persiste entre usos normais, mas é apagado se você desinstalar o app ou limpar os dados dele nas configurações do Android — não há backup automático na nuvem.

### Notificações

As notificações são **locais** (agendadas no próprio celular pelo Android) — não dependem de nenhum servidor para disparar no horário certo.

### Assets visuais e sonoros

Os arquivos de imagem/áudio originais (em alta resolução, antes de otimizar) ficam em `design-source/assets-ref/`, fora da pasta `public` do frontend — não são empacotados no app. As versões usadas de fato no app (otimizadas, pequenas) ficam em `frontend/public/` (`logo-star.png`, `ambient-bg.gif`, `sfx/`, `music/`). Se quiser trocar algum visual, edite o arquivo otimizado direto ou gere um novo a partir do `design-source` usando `scripts/optimize-assets.js`. Os ícones da barra de navegação são desenhados em código (`frontend/src/icons2.tsx`), não vêm de imagem.
