// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer, remote } = require('electron');

// פונקציה להצגת חלון התראה כאשר הסוללה נמוכה
function showLowBatteryAlert(level) {
  console.log(`Low battery alert: ${level}%`);
}

// פונקציה לסגירת חלון ההתראה כאשר המחשב מחובר לחשמל
function closeLowBatteryAlert() {
  console.log('Charging started, closing alert');
}

// ייצוא הפונקציות כדי שיהיו זמינות בקובץ index.html
module.exports = {
  showLowBatteryAlert,
  closeLowBatteryAlert
};
