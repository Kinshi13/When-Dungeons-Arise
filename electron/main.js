const { app, BrowserWindow, Tray, Menu, nativeImage, protocol, net } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

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

// Um esquema próprio (em vez de carregar o index.html direto via file://)
// — o Chromium trata o carregamento de <script type="module"> via file://
// como uma origem "null" e bloqueia por CORS mesmo com caminhos relativos,
// deixando a janela em branco (só a cor de fundo aparecia). Registrado como
// "standard" + "secure" pra se comportar como uma origem http normal.
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

let mainWindow = null;
let tray = null;

function registerAppProtocol() {
  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    const relativePath = decodeURIComponent(url.pathname);
    let filePath = path.join(DIST_DIR, relativePath);
    // Fallback pro index.html em qualquer caminho que não bata com um
    // arquivo real — cobre um F5 numa rota "funda" do React Router, que
    // não existe como arquivo (o roteamento é só client-side).
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, "index.html");
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });
}

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
    mainWindow.loadURL("app://local/index.html");
  }

  // Temporário pra diagnosticar a tela em branco relatada mesmo depois do
  // fix do protocolo app:// — abre o DevTools destacado sempre, pra dar pra
  // ver no Console/Network o que exatamente está falhando a carregar.
  // Remover depois de confirmado o que era.
  mainWindow.webContents.openDevTools({ mode: "detach" });
  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error("[did-fail-load]", errorCode, errorDescription, validatedURL);
  });
  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    console.log("[renderer console]", level, message, `(${sourceId}:${line})`);
  });

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
  registerAppProtocol();
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
