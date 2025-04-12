import { BrowserWindow } from "electron";
import { is } from '@electron-toolkit/utils'
import { join } from "path";
import icon from '../../../resources/logo.jpg?asset'



export class WindowManager {
  private static instance: WindowManager;
  private _mainWindow: BrowserWindow | null = null;

  private constructor() {}

  public static getInstance(): WindowManager {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager();
    }
    return WindowManager.instance;
  }

  get mainWindow(): BrowserWindow{
    if (!this._mainWindow) {
      throw new Error("Main window is not initialized");
    }
    return this._mainWindow;
  }

  public createWindow(): void {
    if (this._mainWindow) {
      console.log("Main window already exists");
      return;
    }
    
    this._mainWindow = new BrowserWindow({
      width: 500,
      height: 700,
      autoHideMenuBar: true,
      show: false,
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        webSecurity: false,
        webviewTag: true,
        allowRunningInsecureContent: true,
        devTools: true,
      },
    });


    this._mainWindow.setAlwaysOnTop(true);


    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this._mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      console.log("Loading file: ", __dirname, '../renderer/index.html')
      this._mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    this._mainWindow.once('ready-to-show', () => {
      this._mainWindow?.show();
    });

    this._mainWindow.webContents.on('before-input-event', (_event, input) => {
      if (input.type === 'keyDown' && input.key === 'F12') {
        this._mainWindow?.webContents.toggleDevTools();
      }
    });
  }

  public closeWindow(): void {
    console.log("Closing the current window");
    // Logic to close the current window
  }
}