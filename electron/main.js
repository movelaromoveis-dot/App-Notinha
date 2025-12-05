const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const { autoUpdater } = require('electron-updater')

let backendProcess = null
let mainWindow = null

function startBackendIfNeeded() {
  // Only spawn backend if the packaged app explicitly requests it
  // Use environment variable INCLUDE_BACKEND=true when building/running
  if (app.isPackaged && process.env.INCLUDE_BACKEND === 'true') {
    const backendPath = path.join(process.resourcesPath || __dirname, '..', 'backend', 'server.js')
    try {
      backendProcess = spawn(process.execPath, [backendPath], { detached: false, stdio: 'inherit' })
      backendProcess.on('error', (err) => console.error('Backend process error', err))
      backendProcess.on('exit', (code) => console.log('Backend exited', code))
      console.log('Started backend process from', backendPath)
    } catch (err) {
      console.error('Failed to start backend process', err)
    }
  }
}

function stopBackendIfRunning() {
  if (backendProcess && !backendProcess.killed) {
    try { backendProcess.kill(); } catch (e) { /* ignore */ }
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  mainWindow = win
  const url = process.env.APP_URL
  if (app.isPackaged) {
    // Load the built Vite files from the packaged `dist` folder
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html')
    win.loadFile(indexPath).catch(err => {
      console.error('Failed to load packaged index.html', err)
    })
  } else {
    win.loadURL(url || 'http://localhost:5173')
  }
  return win
}

app.whenReady().then(() => {
  startBackendIfNeeded()
  createWindow()
  
  // Setup auto-updater
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify()
  }
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  stopBackendIfRunning()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('generate-pdf', async (_event, data) => {
  return { ok: true }
})

// Auto-updater event handlers
autoUpdater.on('update-available', () => {
  console.log('Update available')
  if (mainWindow) {
    mainWindow.webContents.send('update-available')
  }
})

autoUpdater.on('update-downloaded', () => {
  console.log('Update downloaded, will install on app quit')
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded')
  }
})

autoUpdater.on('error', (err) => {
  console.error('Auto-updater error:', err)
})

ipcMain.handle('install-update', async () => {
  autoUpdater.quitAndInstall()
})
