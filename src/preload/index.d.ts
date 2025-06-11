import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      clipboard: Electron.Clipboard,
      copyImage: (dataUrl: string) => void,
      getClipboardFiles: () => string[] | undefined,
      saveTextFile: (fileName: string, content: string) => Promise<void>,
      llmResponsesDir: string
      readFile: (fileName: string) => Promise<string | Electron.NativeImage>
    }
  }
}
