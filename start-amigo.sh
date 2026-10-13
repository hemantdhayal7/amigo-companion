#!/usr/bin/env bash
# Amigo Study Companion - Native Floating Desktop Launcher
set -e

# If running non-interactively (e.g., from desktop launcher or autostart), log output
if [ ! -t 1 ]; then
  exec >> /tmp/amigo-desktop.log 2>&1
fi

DIR="$( cd "$( dirname "$( readlink -f "${BASH_SOURCE[0]}" )" )" && pwd )"
cd "$DIR"

export DISPLAY="${DISPLAY:-:0}"
export WAYLAND_DISPLAY="${WAYLAND_DISPLAY:-wayland-0}"
export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

echo "=========================================="
echo "  🥬 Starting Amigo Study Companion      "
echo "  🚀 Native Floating Desktop App         "
echo "  ⏰ $(date)"
echo "=========================================="

# 0. Compile frontend if dist/ does not exist, if FORCE_BUILD=1, or if src/ has newer changes
if [ ! -f "$DIR/dist/index.html" ] || [ "$FORCE_BUILD" = "1" ] || [ -n "$(find "$DIR/src" -newer "$DIR/dist/index.html" 2>/dev/null)" ]; then
  echo "🔨 Compiling latest UI & WebRTC engine..."
  npm run build
fi

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

# 2. Launch Native Floating App (Electron with --no-sandbox and --ozone-platform=x11 for Linux dragging)
if [ -x "$DIR/node_modules/.bin/electron" ]; then
  echo "🖥️  Running Amigo as always-on-top floating desktop companion..."
  exec "$DIR/node_modules/.bin/electron" "$DIR/electron-main.cjs" --no-sandbox --ozone-platform=x11 "$@"
elif command -v npx &> /dev/null; then
  echo "🖥️  Running Amigo via npx electron..."
  exec npx electron "$DIR/electron-main.cjs" --no-sandbox --ozone-platform=x11 "$@"
else
  echo "🌐 Falling back to default browser..."
  xdg-open "$AMIGO_URL"
  if [ -n "$SERVER_PID" ]; then
    wait "$SERVER_PID"
  fi
fi
