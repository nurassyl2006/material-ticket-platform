#!/usr/bin/env bash
# ==============================================================================
# Athenaeum Library System - Standalone Keep-Alive Monitor
# Runs periodically (or via cron/supervisor) to ensure port 5002 is always alive.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LIB_DIR="$REPO_DIR/library-system"
PORT="${LIBRARY_PORT:-5002}"
HEALTH_URL="http://127.0.0.1:${PORT}/api/health"

# Check if responding
if curl -s -m 3 "$HEALTH_URL" | grep -q '"status":"ok"'; then
  exit 0
fi

# Fallback: check if /api/books responds (auth required is also ok)
if curl -s -m 3 "http://127.0.0.1:${PORT}/api/books?limit=1" | grep -q 'success'; then
  exit 0
fi

# Not responding: start library system
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ Athenaeum Library is DOWN on port $PORT. Restarting..." >> "$HOME/library-monitor.log"

# Detect node binary
NODE_BIN="$(which node 2>/dev/null || true)"
if [ -z "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
  if [ -d "$HOME/.nvm/versions/node" ]; then
    NODE_BIN="$(find "$HOME/.nvm/versions/node" -maxdepth 3 -type f -name node 2>/dev/null | sort -V | tail -n 1)"
  fi
fi
if [ -z "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="/usr/bin/node"
fi

# If systemd service is available, prefer systemd restart
if command -v systemctl >/dev/null 2>&1 && systemctl --user is-enabled athenaeum-library >/dev/null 2>&1; then
  systemctl --user restart athenaeum-library >> "$HOME/library-monitor.log" 2>&1
  exit 0
fi

# Otherwise, kill stale processes and restart with nohup
pkill -f 'node.*library-system/server/index.js' 2>/dev/null || true
sleep 1
cd "$LIB_DIR"
nohup "$NODE_BIN" server/index.js >> "$HOME/library.log" 2>&1 &
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Started Athenaeum Library (PID $!) with nohup." >> "$HOME/library-monitor.log"
