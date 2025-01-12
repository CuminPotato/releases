import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import * as Interop from '../interop'

const pxlApi: Interop.Api = {
  onMessageReceived: (callback: (msg: Interop.UiMessage & { id: number }) => void) => {
    electronAPI.ipcRenderer.on(Interop.mainChannelName, (_, data) => {
      callback(data);
    });
  },
  messageProcessed: <TResponse>(msgId: number, response: TResponse) => {
    electronAPI.ipcRenderer.send(Interop.mainChannelName, { id: msgId, response });
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (!process.contextIsolated) {
  throw new Error('contextIsolated is not enabled');
}

contextBridge.exposeInMainWorld('electron', electronAPI);
contextBridge.exposeInMainWorld('pxlApi', pxlApi);
