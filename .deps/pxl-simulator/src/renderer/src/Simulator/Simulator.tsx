import './Simulator.css';
import { useEffect, useState } from 'react';
import { Frame } from '../domain';
import LedMatrix from '@renderer/LedMatrix/LedMatrix';
import ControlPanel from '@renderer/ControlPanel/ControlPanel';
import * as Config from 'src/config';
import { createBuffer } from '../../../../../pxl-receiver-canvas/buffer';

const config = Config.defaultConfig;

function Simulator() {
  const [lastError, _setLastError] = useState<string | undefined>(undefined);

  const blackScreen = Array.from({ length: config.width * config.height }).map(
    () => '#000',
  );

  const [frame, setFrame] = useState<Frame>({
    number: 0,
    data: blackScreen,
  });

  const rgbBytesToStringColor = (bytes: Uint8Array) => {
    const bpp = 3;
    const colors: string[] = new Array(bytes.length / bpp);
    for (let i = 0; i < bytes.length; i += bpp) {
      colors.push(`rgb(${bytes[i]}, ${bytes[i + 1]}, ${bytes[i + 2]})`);
    }
    return colors;
  };

  useEffect(() => {
    let frameCount = 0;

    const clearDisplay = () => {
      frameCount = 0;
      setFrame({ number: frameCount, data: blackScreen });
    };

    const pxlBuffer = createBuffer(
      config.width,
      config.height,
      config.fps,
      config.frameBufferSize,
      config.relativeFbDelayUntilStart,
      config.turnOffDelayAfterBufferUnderrun,
      config.cyclicBufferLogEveryMs,
      (pixels: Uint8Array) => {
        frameCount += 1;
        setFrame({ number: frameCount, data: rgbBytesToStringColor(pixels) });
      },
      clearDisplay,
      // clearDisplay,
      () => { },
    );

    pxlBuffer.startProcessingLoop();

    window.pxlApi.onMessageReceived((msg) => {
      switch (msg.tag) {
        case 'onFramesReceived':
          pxlBuffer.pushFrame(msg.framesBuffer);
          // window.pxlApi.messageProcessed(msg.id, undefined);
          break;

        default:
          // @ts-ignore
          const _exhaustiveness: never = msg;
      }
    });
  }, []);

  return (
    <div id="simulator">
      <h1>PXL Simulator</h1>
      <div className="ar">
        <LedMatrix frame={frame} />
      </div>
      <ControlPanel frameNumber={frame.number} />
      {lastError && <p className="error">{lastError}</p>}
    </div>
  );
}

export default Simulator;
