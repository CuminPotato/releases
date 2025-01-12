class CombinedFrameBuffer {
  private readonly _frames: Uint8Array[] = [];
  private readonly _frameLength: number;

  constructor(width: number, height: number, private readonly frameBufferSize: number) {
    this._frameLength = width * height * bpp;
  }

  pushFrame(frame: Uint8Array) {
    if (frame.length !== this._frameLength)
      throw new Error(`Pushing a frame with wrong length: ${frame.length} instead of ${this._frameLength}`);

    // Drtop the oldest frame in case of buffer overflow
    if (this._frames.length >= this.frameBufferSize)
      this._frames.shift();
    this._frames.push(frame);
  }

  get remainingFrameCount(): number {
    return this._frames.length;
  }

  get hasFrames(): boolean {
    return this._frames.length > 0;
  }

  tryNextFrame(): Uint8Array | undefined {
    return this._frames.shift();
  }
}

export const bpp = 3;

type TransmissionSyncedState = {
  startProcessingAt: Date,
}

type WaitingForNewTransmissionState = {
  waitingSince: Date
}

type State
  = { tag: 'processingFrame', nextFrameAt: Date }
  | { tag: 'waitingForNewTransmission' } & WaitingForNewTransmissionState
  | { tag: 'transmissionSynced' } & TransmissionSyncedState;

export type PxlBuffer = Readonly<{
  fps: number;
  frameBufferSize: number;
  pushFrame: (frame: Uint8Array) => void;
  startProcessingLoop: () => { stopProcessingLoop: () => void };
}>;

export function createBuffer
  (
    width: number,
    height: number,
    fps: number,
    frameBufferSize: number,
    relativeFbDelayUntilStart: number,
    cyclicLogEveryMs: number | undefined,
    processFrame: (buffer: Uint8Array) => void,
    clearDisplay: () => void,
    onBufferUnderrun: () => void,
  ): PxlBuffer {

  const frameBuffer = new CombinedFrameBuffer(width, height, frameBufferSize);
  const durationForOneFrame = 1000 / fps;

  let state: State = {
    tag: 'waitingForNewTransmission',
    waitingSince: new Date()
  };

  let lastLogTimestamp = new Date();
  let framesCountSinceLastLog = 0;

  function processState(): State {
    const now = new Date();

    switch (state.tag) {

      case 'processingFrame': {
        if (state.nextFrameAt > now)
          return state;

        const framePxlx = frameBuffer.tryNextFrame();
        if (framePxlx === undefined) {
          console.warn(`Buffer underrun; lost transmission  - waiting for new transmission ...`);
          onBufferUnderrun();
          return {
            tag: 'waitingForNewTransmission',
            waitingSince: now
          };
        } else {
          processFrame(framePxlx);
          framesCountSinceLastLog++;
          // TODO: we still could have the effect of requiring to skip some frames
          return { tag: 'processingFrame', nextFrameAt: new Date(state.nextFrameAt.getTime() + durationForOneFrame) };
        }
      }

      case 'waitingForNewTransmission': {
        if (frameBuffer.hasFrames) {
          const frameBufferProcessingDuration = frameBufferSize * 1000 / fps * relativeFbDelayUntilStart;

          console.log(`New transmission synced - start processing in ${frameBufferProcessingDuration}ms ...`);
          return {
            tag: 'transmissionSynced',
            startProcessingAt: new Date(now.getTime() + frameBufferProcessingDuration),
          };
        }

        return state;
      }

      case 'transmissionSynced':
        if (state.startProcessingAt < now) {
          console.log('Sync delay awaited - starting processing in the next frame ...');
          return { tag: 'processingFrame', nextFrameAt: now };
        }

        return state;

      default:
        const _exhaustive: never = state;
        return _exhaustive;
    }
  }

  const pushFrame = (newBackBuffer: Uint8Array) => {
    frameBuffer.pushFrame(newBackBuffer);
  }

  let isStarted = false;

  function startProcessingLoop() {
    if (isStarted) {
      throw new Error('Processing loop already started');
    }

    const doWork = () => {
      const timePassedSinceLastLog = new Date().getTime() - lastLogTimestamp.getTime();
      if (cyclicLogEveryMs !== undefined && timePassedSinceLastLog > cyclicLogEveryMs) {
        console.log(`Processed frames: ${framesCountSinceLastLog} (FPS = ${framesCountSinceLastLog / (timePassedSinceLastLog / 1000)})  -  Frames left in buffer: ${frameBuffer.remainingFrameCount}`);
        framesCountSinceLastLog = 0;
        lastLogTimestamp = new Date();
      }

      state = processState();
    }

    isStarted = true;

    const handle = setInterval(() => doWork(), durationForOneFrame / 20);

    const stopProcessingLoop = () => {
      clearInterval(handle);
      clearDisplay();
      isStarted = false;
    }

    return { stopProcessingLoop };
  }

  return {
    fps,
    frameBufferSize,
    pushFrame,
    startProcessingLoop
  };
}
