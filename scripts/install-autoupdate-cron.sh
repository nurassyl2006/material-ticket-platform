#!/usr/bin/env bash
# ==============================================================================
# EduOps Platform - Auto-Update Cron Installer
# Sets up a 5-minute recurring crontab entry for autoupdate.sh on the server
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTOUPDATE_SCRIPT="$SCRIPT_DIR/autoupdate.sh"

if [ ! -f "$AUTOUPDATE_SCRIPT" ]; then
  echo "❌ Error: autoupdate.sh not found at $AUTOUPDATE_SCRIPT"
  exit 1
fi

chmod +x "$AUTOUPDATE_SCRIPT"

# Define the cron schedule line (runs every 5 minutes)
CRON_CMD="*/5 * * * * /bin/bash $AUTOUPDATE_SCRIPT >/dev/null 2>&1"

# Check if cron job already exists in crontab
CURRENT_CRON=$(crontab -l 2>/dev/null || true)

if echo "$CURRENT_CRON" | grep -Fq "$AUTOUPDATE_SCRIPT"; then
  echo "ℹ️  EduOps autoupdate cron job is already installed:"
  echo "$CURRENT_CRON" | grep -F "$AUTOUPDATE_SCRIPT"
else
  # Append new cron job
  (echo "$CURRENT_CRON"; echo "$CRON_CMD") | crontab -
  echo "✅ Successfully installed EduOps autoupdate cron job!"
  echo "📅 Schedule: Every 5 minutes (*/5 * * * *)"
  echo "📜 Target:   $AUTOUPDATE_SCRIPT"
  echo "🪵 Log file:  $HOME/autoupdate.log"
fi
