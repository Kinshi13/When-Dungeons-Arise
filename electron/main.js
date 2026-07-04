const { app, BrowserWindow, Tray, Menu, nativeImage } = require("electron");
const path = require("node:path");

// Casca fina — só carrega o mesmo build web do app (frontend/dist), sem
// nenhuma dependência do Capacitor (o pacote comunitário de integração
// Capacitor+Electron está abandonado desde 2023, ver commit). O app React é
// o mesmo em qualquer plataforma; só o layout muda pra tela larga (ver
// isElectron()/platform.ts no frontend), e as chamadas de plugin nativo do
// Capacitor (notificações, etc.) já são puladas sozinhas fora do Android
// (isNativePlatform() já cobre isso — o app já roda como PWA hoje sem elas).

// Empacotado: o dist vem copiado pra resources/dist (ver "extraResources"
// no package.json). Rodando direto da fonte (npm start): usa o build ao
// lado, em frontend/dist.
const DIST_DIR = app.isPackaged
  ? path.join(process.resourcesPath, "dist")
  : path.join(__dirname, "..", "frontend", "dist");
const DEV_SERVER_URL = process.env.ELECTRON_DEV_SERVER_URL;

let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: "Lembretes — Guilda de Aventureiros",
    backgroundColor: "#f3ead9",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (DEV_SERVER_URL) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(DIST_DIR, "index.html"));
  }

  // Minimizar pra bandeja em vez de fechar — a "Secretária" fica disponível
  // mesmo com a janela fechada (avisos/lembretes continuam rodando).
  mainWindow.on("close", (event) => {
    if (app.isQuitting) return;
    event.preventDefault();
    mainWindow.hide();
  });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon.isEmpty() ? nativeImage.createFromNamedImage("NSImageNameApplicationIcon") : icon);
  tray.setToolTip("Lembretes — Guilda de Aventureiros");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Abrir", click: () => mainWindow?.show() },
      { type: "separator" },
      {
        label: "Sair",
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ])
  );
  tray.on("click", () => mainWindow?.show());
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on("window-all-closed", () => {
  // Não encerra ao fechar a janela (fica na bandeja) — só window-all-closed
  // de verdade quando o usuário escolhe "Sair" no menu da bandeja.
  if (process.platform !== "darwin" && app.isQuitting) app.quit();
});
