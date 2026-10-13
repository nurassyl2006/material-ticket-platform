#!/usr/bin/env bash
# ==============================================================================
# EduOps Platform - Automatic Server Updater
# Periodically checks GitHub origin/main for new commits.
# If changes are found, automatically pulls, builds, and restarts the service.
# ==============================================================================

set -e

# Target repository directory (defaults to ~/material-ticket-platform)
REPO_DIR="${1:-$HOME/material-ticket-platform}"
LOG_FILE="$HOME/autoupdate.log"

# Keep log file size manageable (keep last 500 lines if over 1MB)
if [ -f "$LOG_FILE" ] && [ $(wc -c < "$LOG_FILE") -gt 1048576 ]; then
  tail -n 500 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi

if [ ! -d "$REPO_DIR" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Directory $REPO_DIR does not exist." >> "$LOG_FILE"
  exit 1
fi

cd "$REPO_DIR"

# Ensure git safe directory for cron environments
git config --global --add safe.directory "$REPO_DIR" 2>/dev/null || true

# Fetch latest changes from GitHub without touching current working tree
if ! git fetch origin main > /dev/null 2>&1; then
  # Network unreachable or git fetch failed; exit silently to retry on next cycle
  exit 0
fi

LOCAL_HASH=$(git rev-parse HEAD 2>/dev/null || echo "")
REMOTE_HASH=$(git rev-parse origin/main 2>/dev/null || echo "")

# Only proceed if there is an actual new commit on remote
if [ -n "$REMOTE_HASH" ] && [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
  echo "==================================================" >> "$LOG_FILE"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🚀 New update detected on origin/main!" >> "$LOG_FILE"
  echo "Current commit: $LOCAL_HASH" >> "$LOG_FILE"
  echo "Target commit:  $REMOTE_HASH" >> "$LOG_FILE"

  # Reset cleanly to origin/main (avoids merge conflict prompts; ignores SQLite db)
  git reset --hard origin/main >> "$LOG_FILE" 2>&1

  # Load Node & npm in cron non-interactive environment
  export NVM_DIR="$HOME/.nvm"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck source=/dev/null
    \. "$NVM_DIR/nvm.sh"
  fi
  export PATH="$PATH:/usr/local/bin:/usr/bin:/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin"

  # Install any new dependencies if package.json changed
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📦 Running npm install..." >> "$LOG_FILE"
  npm install --no-audit --no-fund >> "$LOG_FILE" 2>&1

  # Rebuild the production frontend client bundle
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔨 Building client bundle (npm run build)..." >> "$LOG_FILE"
  npm run build >> "$LOG_FILE" 2>&1

  # Restart service cleanly
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔄 Reloading EduOps server process..." >> "$LOG_FILE"
  if command -v pm2 >/dev/null 2>&1 && pm2 describe eduops >/dev/null 2>&1; then
    pm2 reload eduops >> "$LOG_FILE" 2>&1
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] PM2 process 'eduops' reloaded." >> "$LOG_FILE"
  elif command -v pm2 >/dev/null 2>&1; then
    pm2 restart all >> "$LOG_FILE" 2>&1 || pm2 start server/index.js --name eduops >> "$LOG_FILE" 2>&1
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] PM2 process reloaded." >> "$LOG_FILE"
  elif systemctl --user is-active --quiet eduops 2>/dev/null; then
    systemctl --user restart eduops >> "$LOG_FILE" 2>&1
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] systemd user service 'eduops' restarted." >> "$LOG_FILE"
  elif sudo systemctl is-active --quiet eduops 2>/dev/null; then
    sudo systemctl restart eduops >> "$LOG_FILE" 2>&1
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] systemd system service 'eduops' restarted." >> "$LOG_FILE"
  else
    pkill -f 'node.*server/index.js' || true
    sleep 1
    nohup node server/index.js >> "$HOME/server.log" 2>&1 &
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Standalone server restarted with nohup (PID $!)." >> "$LOG_FILE"
  fi

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Auto-update successfully completed to $REMOTE_HASH" >> "$LOG_FILE"
fi
