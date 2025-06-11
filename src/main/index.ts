import { app, BrowserWindow, ipcMain, globalShortcut, } from 'electron'
import { electronApp} from '@electron-toolkit/utils'
import { WindowManager } from './manager/windowManager'
import { sendKeys } from 'sendkey'
import { join } from 'path'
import { spawn, ChildProcessWithoutNullStreams  } from 'child_process'
import { existsSync, mkdirSync } from 'fs'


let gatewayProcess: ChildProcessWithoutNullStreams | null = null

function restartGateway() {
  stopGateway()

  const llmGateway = join(app.getAppPath(), 'llm-gateway', 'llm_gateway.js')
  if (!existsSync(llmGateway)) {
    console.warn('llm-gateway not found, please check the path:', llmGateway)
    return
  }
  const exePath = app.getPath('exe')
  const llmGatewayArgs = [llmGateway, "--port=30027", "--headless"]
  console.log('llmGateway:', exePath, llmGatewayArgs)

  gatewayProcess = spawn(exePath, llmGatewayArgs , {
    env: {
      "LLM_GATEWAY_KEY_STORE_FILE" : join(app.getPath('userData'), 'llmkeys.json'),
      "ELECTRON_RUN_AS_NODE": "1",
    },
    detached: true,
  });
}

function stopGateway() {
  if (gatewayProcess) {
    gatewayProcess.kill()
    console.log('gatewayProcess killed', gatewayProcess.killed)
    gatewayProcess = null
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.ai-tools')

  const llmResponsesDir = app.getPath('userData') + '/llmResponses'

  // ensure the user data directory exists
  if (!existsSync(llmResponsesDir)) {
    console.log('Creating user data directory:', llmResponsesDir)
    mkdirSync(llmResponsesDir, { recursive: true })
  }


  WindowManager.getInstance().createWindow()

  // register global shortcuts Ctrl+Q
  globalShortcut.register('CommandOrControl+Q', () => {
    const mainWindow = WindowManager.getInstance().mainWindow
    if (mainWindow) {
      // do copy on current window
      sendKeys('ctrl+c')
      setTimeout(() => {
        mainWindow.webContents.send('CtrlQ')
      }, 200)

      mainWindow.showInactive()
    }
  })

  // start the gateway and listen for the restart event
  restartGateway()
  ipcMain.on('restartGateway', restartGateway)


  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) WindowManager.getInstance().createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    stopGateway()
  }
})

