#!/bin/bash
set -e

cd .deps
npm i

cd pxl-simulator
npm i
npm run build
npm run dev
