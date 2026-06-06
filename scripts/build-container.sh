#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:-fountain-life-notebook-api}"

npm run verify
docker build -t "$IMAGE_NAME" .
