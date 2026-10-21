#!/usr/bin/env bash
# ==============================================================================
# Athenaeum Library System - Linux Systemd Keep-Alive Service Installer
# Guarantees the library system server is ALWAYS running 24/7, auto-starts on boot,
# and automatically recovers/restarts within 3 seconds if it ever crashes.
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LIB_DIR="$REPO_DIR/library-system"
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
SERVICE_FILE="$SYSTEMD_USER_DIR/athenaeum-library.service"

# Detect node binary path
NODE_BIN="$(which node 2>/dev/null || true)"
if [ -z "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
  if [ -d "$HOME/.nvm/versions/node" ]; then
    NODE_BIN="$(find "$HOME/.nvm/versions/node" -maxdepth 3 -type f -name node 2>/dev/null | sort -V | tail -n 1)"
  fi
fi

if [ -z "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="/usr/bin/node"
fi

echo "=================================================="
echo "📖 Installing Athenaeum Library System Service"
echo "=================================================="
echo "Repository:   $REPO_DIR"
echo "Library Dir:  $LIB_DIR"
echo "Node Binary:  $NODE_BIN"
echo "Service Path: $SERVICE_FILE"
echo "=================================================="

# 1. Ensure user systemd directory exists
mkdir -p "$SYSTEMD_USER_DIR"

# 2. Enable lingering so user services run even when user is logged out or after boot
if command -v loginctl >/dev/null 2>&1; then
  loginctl enable-linger "$USER" 2>/dev/null || true
  echo "✅ Enabled user lingering for '$USER'"
fi

# 3. Generate systemd unit file
cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Athenaeum Library System Daemon (Port 5002)
After=network.target

[Service]
Type=simple
WorkingDirectory=$LIB_DIR
ExecStart=$NODE_BIN server/index.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=LIBRARY_PORT=5002
Environment=PATH=$(dirname "$NODE_BIN"):/usr/local/bin:/usr/bin:/bin
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
EOF

# 4. Reload systemd daemon & activate service
systemctl --user daemon-reload
systemctl --user enable athenaeum-library.service
systemctl --user restart athenaeum-library.service

echo ""
echo "✅ Athenaeum Library System service successfully installed and started!"
echo "🔄 Auto-restart enabled: System will restart it in 3 seconds if it ever exits."
echo "⚡ Port: 5002 (http://localhost:5002/)"
echo ""
systemctl --user status athenaeum-library.service --no-pager || true
echo "=================================================="
