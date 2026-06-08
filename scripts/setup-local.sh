#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22 or newer is required." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required." >&2
  exit 1
fi

node_major="$(node -p "Number(process.versions.node.split('.')[0])")"
if [ "$node_major" -lt 22 ]; then
  echo "Node.js 22 or newer is required. Current version: $(node --version)" >&2
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example."
else
  echo "Keeping existing .env."
fi

mkdir -p var/uploads var/logs openapi
npm ci

cat <<'EOF'

Backend setup complete.

Before starting the app, make sure MongoDB is available at the MONGODB_URI in .env.
If MongoDB is not at the default URI, edit MONGODB_URI in .env before starting.

Start the backend:
  npm run start:dev

Start the frontend in another terminal:
  cd ../jacobi-solutions.fountain-life-notebook.frontend
  npm run setup:local
  npm run dev
EOF
