#!/usr/bin/env bash
set -euo pipefail

npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run contract:export
