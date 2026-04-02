#!/bin/sh
# Start FastAPI backend in background, then start Vite frontend
cd "$(dirname "$0")"

# Start backend
server/.venv/bin/uvicorn app.main:app --port 8000 --app-dir server &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend..."
for i in $(seq 1 20); do
  if server/.venv/bin/python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" 2>/dev/null; then
    echo "Backend ready."
    break
  fi
  sleep 0.5
done

# Start frontend (blocks until killed)
cd client && /usr/local/bin/node node_modules/.bin/vite

# Kill backend on exit
kill $BACKEND_PID 2>/dev/null
