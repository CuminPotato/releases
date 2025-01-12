import { ElectronAPI } from '@electron-toolkit/preload';
import * as Interop from '../interop';

declare global {
  interface Window {
    electron: ElectronAPI;
    pxlApi: Interop.Api;
  }
}
