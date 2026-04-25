#!/bin/bash

echo "🔍 Testing MindCare AI Services Configuration..."
echo ""

# Test Backend
echo "1️⃣  Backend Service (Port 5002):"
grep "PORT=" services/backend/.env || echo "❌ PORT not set in backend .env"
echo ""

# Test Jarvis-Mate
echo "2️⃣  MATE AI Service (Port 5003):"
grep "PORT=" services/jarvis-mate/.env || echo "❌ PORT not set in jarvis-mate .env"
echo ""

# Test NutriMate
echo "3️⃣  NutriMate Service (Port 5004):"
grep "PORT=" services/nutrimate/.env || echo "❌ PORT not set in nutrimate .env"
echo ""

# Test config.js
echo "4️⃣  Frontend Configuration:"
grep -A 2 "DEVELOPMENT:" apps/frontend/assets/js/config.js | head -3
echo ""

echo "✅ Configuration check complete!"
echo ""
echo "To start all services, run:"
echo "  bash scripts/start_ais.sh"
