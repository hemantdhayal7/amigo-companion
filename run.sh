#!/usr/bin/env bash
set -e

# Add cargo to PATH if installed via rustup
export PATH="$PATH:$HOME/.cargo/bin:/Volumes/Scratch/toolchains/cargo/bin"

echo "=========================================="
echo "  🥬 Starting Amigo Study Companion App   "
echo "  📹 Real-time Voice & Webcam Calls Active "
echo "=========================================="

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# 1. Start Signaling Server in background
echo "📡 Starting Amigo Signaling Server on port 4000..."
node server.js &
SERVER_PID=$!

cleanup() {
  echo ""
  echo "🛑 Stopping Amigo processes..."
  kill $SERVER_PID 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Check if user wants HTTPS for cross-computer LAN browser video calls
if [ "$1" == "--https" ] || [ "$2" == "--https" ]; then
  export VITE_HTTPS=true
  echo "🔒 Serving over HTTPS (Enables camera/mic across different computers on Wi-Fi)"
fi

# 2. Check if user wants native Tauri or Web preview
if command -v cargo &> /dev/null && [ "$1" != "--web" ] && [ "$2" != "--web" ]; then
  echo "🖥️  Running as Native Desktop Floating Overlay (Tauri 2)..."
  npx @tauri-apps/cli dev
else
  echo "🌐 Running in Web/Browser Mode (Vite on port 5173)..."
  npx vite --port 5173 --host
fi
