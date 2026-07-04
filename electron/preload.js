const { contextBridge } = require("electron");

// Flag simples pro app React saber que está rodando dentro do shell
// desktop (ver isElectron() em frontend/src/platform.ts) — o suficiente
// pra escolher o layout amplo em vez do layout mobile.
contextBridge.exposeInMainWorld("desktopShell", {
  isElectron: true,
});
