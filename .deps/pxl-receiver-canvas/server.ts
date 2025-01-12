import * as net from 'net';
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';

// --------------------------------------------------------------------------
// CanvasMetadata and signatures have to be mirrored
// in the dotnet / node implementations.
//
// see:
//   src/Pxl.BufferedHttpCanvas/BufferedHttpCanvas.fs
//   src/Pxl.Core/Canvas.fs
//   src/pxl-local-display/src/domain.ts
//   src/pxl-local-display/src/server.ts
// --------------------------------------------------------------------------
export type CanvasMetadata = {
  width: number,
  height: number,
  fps: number,
}

const invariantServicePorts = {
  http: 5001,
  tcp: 5002
}

const bpp = 3;

const expressApp = express();

function setupMetadata(
  canvasMetadata: CanvasMetadata
) {
  expressApp.get('/metadata', (_req: Request, res: Response) => {
    res.json(canvasMetadata);
  });
}

function setupFramesHttp(
  canvasMetadata: CanvasMetadata,
  onFramesReceived: (frames: Uint8Array) => void
) {
  // Middleware to parse byte array
  // 40mb: bei 50 FPS und 1 minuten buffer
  expressApp.use(bodyParser.raw({
    type: 'application/octet-stream',
    limit: '5mb'
  }));

  expressApp.post('/pushFrames', (req: Request, res: Response) => {
    const { width, height } = canvasMetadata;
    const frameLength = width * height * bpp;
    const expectedLength = frameLength;

    const byteArray: Uint8Array = req.body;
    if (byteArray.length !== expectedLength) {
      console.error('Invalid byte array length. Expected', expectedLength, 'but got', byteArray.length);
      res.sendStatus(400);
      return;
    }

    onFramesReceived(byteArray);
    res.sendStatus(200);
  });
}

function serveHttp() {
  const port = invariantServicePorts.http;
  expressApp.listen(
    port,
    () => console.log(`Serving frames (HTTP) on port ${port}`));
}

export async function serveFramesTcp(
  canvasMetadata: CanvasMetadata,
  onFrameReceived: (frame: Uint8Array) => void
) {
  const { width, height } = canvasMetadata;
  const frameLength = width * height * bpp;
  const expectedLength = frameLength;

  const server = net.createServer((socket) => {
    console.log('Client connected');

    socket.setMaxListeners(0);

    let buffer = Buffer.alloc(0);
    socket.on('data', (data: Buffer) => {
      buffer = Buffer.concat([buffer, data]);
      while (buffer.length >= expectedLength) {
        const message = buffer.subarray(0, expectedLength);
        onFrameReceived(new Uint8Array(message));
        buffer = buffer.subarray(expectedLength);
      }
    });

    socket.on('end', () => {
      console.log('Client disconnected');
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  });

  const port = invariantServicePorts.tcp;
  server.listen(port, () => {
    console.log(`Serving frames (TCP) on port ${port}`);
  });
}

export function startServer(
  width: number,
  height: number,
  fps: number,
  onFrameReceived: (frame: Uint8Array) => void
) {
  const canvasMetadata = {
    fps: fps,
    width: width,
    height: height,
  };

  setupMetadata(canvasMetadata);
  setupFramesHttp(canvasMetadata, onFrameReceived);
  serveHttp();

  serveFramesTcp(canvasMetadata, onFrameReceived);
}
