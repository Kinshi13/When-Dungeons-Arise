# Stella Founds

App financeiro pessoal com estética astral (Stella/Baka Studio). Projeto novo,
independente do app antigo neste repositório (`frontend/`), construído com
React + TypeScript + Vite, preparado para Android (Capacitor), PWA e Desktop.

## Rodando localmente

```bash
cd stella-founds
npm install
npm run dev
```

## Build para Android

```bash
npm run build:android
```

Isso builda o web app, gera o service worker do PWA e sincroniza os assets
com o projeto nativo em `android/`. Para gerar um APK, abra `android/` no
Android Studio (requer Android SDK instalado) ou rode `./gradlew assembleDebug`
dentro de `android/`.

## PWA

O app é instalável como PWA (manifest + service worker via `vite-plugin-pwa`,
ícones em `public/icons/`). Rodar `npm run build && npm run preview` e abrir
no navegador permite testar a instalação.

## Estrutura

- `src/core/` — modelos, services, repositories, storage, adapters de plataforma
  (regra de negócio, sem UI)
- `src/core/platform/` — abstrações `PlatformAdapter`, `NotificationAdapter`,
  `ExportAdapter` com implementações web; trocáveis por implementações nativas
  (Capacitor) sem alterar features/UI
- `src/features/` — telas por domínio (home, finance, bills, subscriptions, calendar, reports, settings)
- `src/ui/` — design system, componentes, navegação, Stella Core, parallax
- `src/assets/` — imagens e decoração visual
- `android/` — projeto nativo Android gerado pelo Capacitor

## Status

MVP financeiro completo (Fases 1–11): fundação, Home, lançamentos financeiros,
Contas com filtros, recorrência, calendário financeiro, relatórios, estética
Stella, parallax, Stella Core avançado (constelação orgânica animada) e
preparação multiplataforma (adapters, PWA, Capacitor/Android).
