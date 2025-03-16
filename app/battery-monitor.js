const { BrowserWindow, powerMonitor } = require("electron");
const path = require("path");
const url = require("url");
const si = require("systeminformation");

// משתנים לשמירת מצב הסוללה
let batteryLevel = 100;
let isCharging = true;
let batteryThreshold = 20; // הסף הרגיל הוא 20%
let previousBatteryState = { level: 100, charging: true };

 // האם זו הבדיקה הראשונה
let isFirstCheck = true;
let isDebugMode = false;

// חלון התראה
let alertWindow = null;

let checkInterval = null;


/**
 * אתחול מודול ניטור הסוללה
 * @param {boolean} debugMode - האם האפליקציה במצב דיבוג
 */
function init(debugMode) {
  isDebugMode = debugMode;

  // בדיקה ראשונית של מצב הסוללה
  checkBattery();

  // בדיקה תקופתית של מצב הסוללה (כל דקה)
  checkInterval = setInterval(checkBattery, 60000);

  // האזנה לאירועי חיבור/ניתוק מחשמל
  powerMonitor.on("on-ac", () => {
    console.log("Power connected");
    isCharging = true;
    closeAlertWindow();
  });

  powerMonitor.on("on-battery", () => {
    console.log("Power disconnected");
    isCharging = false;
  });
}

/**
 * פונקציה לבדיקת מצב הסוללה
 */
function checkBattery() {
  si.battery()
    .then((data) => {
      // שמירת המצב הקודם לפני העדכון
      previousBatteryState = {
        level: batteryLevel,
        charging: isCharging,
      };

      // עדכון המצב הנוכחי
      batteryLevel = data.percent;
      isCharging = data.isCharging || data.acConnected;

      console.log(`Battery level: ${batteryLevel}%, Charging: ${isCharging}`);

      // בדיקה אם במצב דיבוג - הגדרת הסף לאחוז אחד מתחת למצב הנוכחי רק בבדיקה הראשונה
      if (isDebugMode && isFirstCheck) {
        batteryThreshold = Math.max(1, batteryLevel - 1); // לפחות 1%
        console.log(`Debug mode: Setting threshold to ${batteryThreshold}%`);
        isFirstCheck = false; // מסמן שהבדיקה הראשונה הסתיימה
      }

      // הפרונט מתעדכן באופן עצמאי באמצעות API של הדפדפן

      // בדיקה אם הסוללה מתחת לסף ולא בטעינה
      if (batteryLevel <= batteryThreshold && !isCharging) {
        showLowBatteryAlert(batteryLevel);
      }

      // בדיקה אם המחשב חובר לחשמל (שינוי ממצב לא מחובר למצב מחובר)
      if (isCharging && !previousBatteryState.charging) {
        console.log("Charging started");
        closeAlertWindow();
      }
    })
    .catch((error) => {
      console.error("Error checking battery:", error);
    });
}

/**
 * פונקציה להצגת התראה על סוללה נמוכה
 * @param {number} level - אחוז הסוללה הנוכחי
 */
function showLowBatteryAlert(level) {
  // אם כבר יש חלון התראה פתוח, לא צריך ליצור חדש
  if (alertWindow) {
    return;
  }

  alertWindow = new BrowserWindow({
    width: 300,
    height: 200,
    alwaysOnTop: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  alertWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "alert.html"),
      protocol: "file:",
      slashes: true,
      search: `level=${level}`,
    })
  );

  alertWindow.on("closed", function () {
    alertWindow = null;
  });
}

/**
 * פונקציה לסגירת חלון ההתראה
 */
function closeAlertWindow() {
  if (alertWindow) {
    alertWindow.close();
    alertWindow = null;
  }
}

/**
 * פונקציה לניקוי משאבים בעת סגירת האפליקציה
 */
function cleanup() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }

  powerMonitor.removeAllListeners("on-ac");
  powerMonitor.removeAllListeners("on-battery");
}

module.exports = {
  init,
  cleanup,
  checkBattery,
};
