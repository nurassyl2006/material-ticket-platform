#!/usr/bin/env bash
# ==============================================================================
# EduOps & Athenaeum Library Database Backup Utility
# Creates timestamped snapshot backups of SQLite databases with record counts.
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
TIMESTAMP="$(date '+%Y%m%d_%H%M%S')"
BACKUP_DIR="${HOME}/db-backups/${TIMESTAMP}"

mkdir -p "$BACKUP_DIR"

echo "=================================================="
echo "📦 Backing up EduOps & Library Databases"
echo "Timestamp:   $TIMESTAMP"
echo "Destination: $BACKUP_DIR"
echo "=================================================="

# 1. Platform DB (Tickets, Inventory, Users)
PLATFORM_DB="$ROOT_DIR/server/data/platform.db"
if [ -f "$PLATFORM_DB" ]; then
  cp "$PLATFORM_DB" "$BACKUP_DIR/platform.db"
  [ -f "${PLATFORM_DB}-wal" ] && cp "${PLATFORM_DB}-wal" "$BACKUP_DIR/platform.db-wal" 2>/dev/null || true
  [ -f "${PLATFORM_DB}-shm" ] && cp "${PLATFORM_DB}-shm" "$BACKUP_DIR/platform.db-shm" 2>/dev/null || true
  echo "✅ Backed up platform.db ($(du -h "$BACKUP_DIR/platform.db" | cut -f1))"
else
  echo "⚠️ platform.db not found at $PLATFORM_DB"
fi

# 2. Library DB (Books, Loans, Borrowers)
LIBRARY_DB="$ROOT_DIR/library-system/server/data/library.db"
if [ -f "$LIBRARY_DB" ]; then
  cp "$LIBRARY_DB" "$BACKUP_DIR/library.db"
  [ -f "${LIBRARY_DB}-wal" ] && cp "${LIBRARY_DB}-wal" "$BACKUP_DIR/library.db-wal" 2>/dev/null || true
  [ -f "${LIBRARY_DB}-shm" ] && cp "${LIBRARY_DB}-shm" "$BACKUP_DIR/library.db-shm" 2>/dev/null || true
  echo "✅ Backed up library.db ($(du -h "$BACKUP_DIR/library.db" | cut -f1))"
else
  echo "⚠️ library.db not found at $LIBRARY_DB"
fi

# Retain last 30 snapshots
find "${HOME}/db-backups" -mindepth 1 -maxdepth 1 -type d | sort -r | tail -n +31 | xargs rm -rf 2>/dev/null || true

echo "=================================================="
echo "🎉 Backup completed successfully!"
echo "📁 Total snapshots kept in ${HOME}/db-backups: $(find "${HOME}/db-backups" -mindepth 1 -maxdepth 1 -type d | wc -l)"
echo "=================================================="
