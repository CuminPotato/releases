import { BrowserWindow } from 'electron';
import { startServer } from '../../../pxl-receiver-canvas/server';
import * as Interop from '../interop';
import * as Config from '../config';

let currMsgId = 0;

async function sendToUi(mainWindow: BrowserWindow, msg: Interop.UiMessage) {
  currMsgId += 1;

  // mainWindow.webContents.send(Interop.mainChannelName, { currMsgId, ...msg });
  mainWindow.webContents.postMessage(Interop.mainChannelName, { currMsgId, ...msg });

  // TODO: wait for response
  return Promise.resolve();
}

export function startPxlServer(mainWindow: BrowserWindow) {
  const config = Config.defaultConfig;

  startServer(
    config.width,
    config.height,
    config.fps,
    framesBuffer => sendToUi(mainWindow, { tag: 'onFramesReceived', framesBuffer }));
}
