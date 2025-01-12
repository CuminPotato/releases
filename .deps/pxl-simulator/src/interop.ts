export const mainChannelName = 'main';

export type UiMessage =
  | { tag: 'onFramesReceived', framesBuffer: Uint8Array }

export type Api = {
  onMessageReceived: (callback: (msg: UiMessage & { id: number }) => void) => void;
  messageProcessed: <TResponse>(msgId: number, response: TResponse) => void;
};
