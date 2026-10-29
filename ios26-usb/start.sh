#!/data/data/com.termux/files/usr/bin/sh
# One-command launcher for Termux: verifies the USB key, builds if needed,
# starts the server and opens it in the default Android browser.
set -e
cd "$(dirname "$0")"

PORT="${PORT:-8026}"
URL="http://localhost:$PORT"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is missing. Run: pkg install nodejs-lts"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

if [ ! -f dist/index.html ] || [ -n "$(find src index.html -newer dist/index.html 2>/dev/null | head -n 1)" ]; then
  echo "Building..."
  npm run build
fi

echo "Checking USB key..."
if node scripts/check-usb.mjs; then
  echo "USB key verified."
else
  echo "USB key not verified yet - the app will wait on the USB screen."
fi

if command -v termux-wake-lock >/dev/null 2>&1; then
  termux-wake-lock || true
fi

PORT="$PORT" node server.mjs &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null; command -v termux-wake-unlock >/dev/null 2>&1 && termux-wake-unlock' INT TERM EXIT

sleep 1
if command -v termux-open-url >/dev/null 2>&1; then
  termux-open-url "$URL"
else
  echo "Open $URL in Chrome."
fi

wait $SERVER_PID
