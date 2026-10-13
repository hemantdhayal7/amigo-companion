#!/usr/bin/env bash
# Amigo Study Companion - Native Floating Desktop Launcher
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================="
echo "  🥬 Starting Amigo Study Companion      "
echo "  🚀 Native Floating Desktop App         "
echo "=========================================="

# 0. Always compile latest frontend changes into dist/
echo "🔨 Compiling latest UI & WebRTC engine..."
npm run build

# 1. Start backend server in background if not already running
if ! curl -s -f http://localhost:4000/api/health >/dev/null 2>&1; then
  echo "📡 Booting Amigo local server on port 4000..."
  node server.js > /tmp/amigo-server.log 2>&1 &
  SERVER_PID=$!
  for i in {1..25}; do
    if curl -s -f http://localhost:4000/api/health >/dev/null 2>&1; then
      break
    fi
    sleep 0.2
  done
fi

cleanup() {
  if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

export AMIGO_URL="http://localhost:4000"

# 2. Launch Native Floating App (Electron)
if [ -x "$DIR/node_modules/.bin/electron" ]; then
  echo "🖥️  Running Amigo as always-on-top floating desktop companion..."
  exec "$DIR/node_modules/.bin/electron" "$DIR/electron-main.cjs" "$@"
elif command -v npx &> /dev/null; then
  echo "🖥️  Running Amigo via npx electron..."
  exec npx electron "$DIR/electron-main.cjs" "$@"
else
  echo "🌐 Falling back to default browser..."
  xdg-open "$AMIGO_URL"
  if [ -n "$SERVER_PID" ]; then
    wait "$SERVER_PID"
  fi
fi
