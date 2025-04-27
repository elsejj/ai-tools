import { app, BrowserWindow, ipcMain, globalShortcut, } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { WindowManager } from './manager/windowManager'
import { sendKeys } from 'sendkey'
// import { join } from 'path'
// import { spawn, ChildProcessWithoutNullStreams  } from 'child_process'


//let gatewayProcess: ChildProcessWithoutNullStreams | null = null

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.ai-tools')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })


  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  WindowManager.getInstance().createWindow()

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


  // const llmGateway = join(app.getAppPath(), 'llm-gateway', 'llm_gateway.js')
  // const exePath = app.getPath('exe')
  // const llmGatewayArgs = [llmGateway, "--port=30027", "--headless"]
  // console.log('llmGateway:', exePath, llmGatewayArgs)

  // gatewayProcess = spawn(exePath, llmGatewayArgs , {
  //   env: {
  //    "LLM_GATEWAY_KEY_STORE_FILE" : join(app.getPath('userData'), 'llmkeys.json'), 
  //    "ELECTRON_RUN_AS_NODE": "1",
  //   },
  //   detached: true,
  // });


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
    // if (gatewayProcess) {
    //   gatewayProcess.kill()
    //   console.log('gatewayProcess killed', gatewayProcess.killed)
    //   gatewayProcess = null
    // }
  }
})

