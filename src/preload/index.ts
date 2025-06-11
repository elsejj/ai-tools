import { contextBridge, clipboard, nativeImage, NativeImage } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { getClipboardFiles } from 'sendkey'
import { writeFile, readFile } from 'fs/promises'
import { homedir } from 'os'



function isImageFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return ['png', 'jpg', 'jpeg', 'bmp'].includes(ext || '')
}

function llmResponsesDir(): string {
  // return the user data directory path in a cross-platform way
  const homeDir = homedir()
  const appName = 'ai-tools'
  if (process.platform === 'win32') {
    return `${homeDir}\\AppData\\Roaming\\${appName}\\llmResponses`
  } else if (process.platform === 'darwin') {
    return `${homeDir}/Library/Application Support/${appName}/llmResponses`
  } else {
    return `${homeDir}/.config/${appName}/llmResponses`
  }
}

// Custom APIs for renderer
const api = {
  clipboard: clipboard,
  llmResponsesDir: llmResponsesDir(),
  getClipboardFiles: getClipboardFiles,
  copyImage: (dataUrl: string) => {
    clipboard.clear()
    const image = nativeImage.createFromDataURL(dataUrl)
    clipboard.writeImage(image)
  },
  saveTextFile: async (fileName: string, content: string) : Promise<void> => {
    return writeFile(fileName, content, 'utf8')
  },
  readFile: async (fileName: string): Promise<string | NativeImage> => {
    try {
      if (isImageFile(fileName)) {
        const imageBuffer = await readFile(fileName)
        return  nativeImage.createFromBuffer(imageBuffer)
      }else{
        return await readFile(fileName, 'utf8')
      }
    } catch (error) {
      console.error('Error reading file:', error)
      throw error
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
