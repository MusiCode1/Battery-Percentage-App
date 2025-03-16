const electron = require("electron");
const { app, BrowserWindow, Tray, nativeImage, Menu } = electron;
const path = require("path");
const url = require("url");

const batteryMonitor = require("./app/battery-monitor");

// שמירת התייחסות גלובלית לחלונות ולסיסטם טריי
let mainWindow;
let tray;
let isQuitting = false;
const isDebugMode = process.env.DEBUG_BATTERY === "true";
console.log("Debug mode:", isDebugMode);

// יצירת החלון הראשי
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 150,
    height: 120,
    transparent: true,
    frame: false,
    resizable: false,
    icon: path.join(__dirname, "app/power.png"),
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "app/index.html"),
      protocol: "file:",
      slashes: true,
    })
  );

  if (isDebugMode) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

function toggleWindow() {
  if (mainWindow) {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  }
}

// יצירת אייקון בסיסטם טריי
function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, "app/power.png")
  );
  tray = new Tray(icon);

  tray.setToolTip("Battery Monitor");
  tray.on("click", toggleWindow);

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "הצג / הסתר את סמל הסוללה על המסך", click: toggleWindow },
      { label: "Exit", click: () => app.quit() },
    ])
  );
}

// אתחול האפליקציה
app.on("ready", () => {
  createWindow();
  createTray();

  // אתחול מודול ניטור הסוללה
  batteryMonitor.init(isDebugMode);
});

// מניעת סגירת האפליקציה כשהמשתמש סוגר את החלון הראשי
app.on("window-all-closed", (event) => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// סימון שהאפליקציה נסגרת כדי לאפשר סגירת החלון המוסתר
app.on("before-quit", () => {
  isQuitting = true;
  batteryMonitor.cleanup();
});
