#!/bin/bash

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Activating virtual environment..."
source "$ROOT/venv/bin/activate"

echo "Killing any old server processes..."
pkill -f jarvis_server.py || true
pkill -f nutrimate_server.py || true
pkill -f "node server.js" || true
sleep 1

echo "Installing required Python dependencies..."
pip install flask flask-cors google-generativeai python-dotenv pymongo

echo ""
echo "🚀 Starting MATE AI server on port 5003..."
cd "$ROOT/services/jarvis-mate"
python jarvis_server.py &
JARVIS_PID=$!

echo ""
echo "🥗 Starting NutriMate server on port 5004..."
cd "$ROOT/services/nutrimate"
python nutrimate_server.py &
NUTRI_PID=$!

echo ""
echo "🌐 Starting Main Web Server on port 5002..."
cd "$ROOT/services/backend"
npm install
node server.js &
NODE_PID=$!

echo ""
echo "=============================================================="
echo "✅ All servers are starting in the background!"
echo "MATE AI     → http://localhost:5003"
echo "NutriMate   → http://localhost:5004"
echo "Web App     → http://localhost:5002 (Open this in your browser!)"
echo "Press Ctrl+C to stop all servers."
echo "=============================================================="

# Handle clean exit
trap "kill $JARVIS_PID $NUTRI_PID $NODE_PID" EXIT

wait
