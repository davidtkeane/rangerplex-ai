#!/bin/bash
# RangerPlex Shutdown Script
# Kills all RangerPlex-related servers cleanly

# Update PM2 if out of date (suppress output if not installed)
if command -v pm2 &> /dev/null; then
    pm2 update &>/dev/null
fi

echo "🛑 Shutting down RangerPlex servers..."

# Define ports to check and kill
PORTS=(3000 5173 5555 5005)

for PORT in "${PORTS[@]}"; do
    # Find process on this port
    PID=$(lsof -ti :$PORT 2>/dev/null)

    if [ -n "$PID" ]; then
        echo "   Killing process on port $PORT (PID: $PID)"
        kill -9 $PID 2>/dev/null
    fi
done

# Also kill any lingering node processes related to rangerplex
pkill -f "proxy_server.js" 2>/dev/null
pkill -f "vite.*rangerplex" 2>/dev/null

# Kill PM2 processes if running
if command -v pm2 &> /dev/null; then
    pm2 delete rangerplex-server 2>/dev/null
    pm2 delete rangerplex-vite 2>/dev/null
fi

echo "✅ All RangerPlex servers stopped"
echo ""
echo "Ports checked: ${PORTS[*]}"

# Verify ports are free
echo ""
echo "Port status:"
for PORT in "${PORTS[@]}"; do
    if lsof -i :$PORT &>/dev/null; then
        echo "   ⚠️  Port $PORT is still in use"
    else
        echo "   ✅ Port $PORT is free"
    fi
done
