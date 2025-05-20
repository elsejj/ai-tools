import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      clipboard: Electron.Clipboard,
      copyImage: (dataUrl: string) => void,
    }
  }
}
