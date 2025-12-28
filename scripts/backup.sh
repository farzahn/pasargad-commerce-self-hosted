#!/bin/bash
# Self-Hosted E-Commerce Template - Backup Script
# Run daily via cron: 0 2 * * * /path/to/backup.sh

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "Starting backup..."

# Backup PocketBase data (SQLite + uploaded files)
if [ -d "$PROJECT_DIR/pb_data" ]; then
    log "Backing up PocketBase data..."
    tar -czf "$BACKUP_DIR/pocketbase_$DATE.tar.gz" \
        -C "$PROJECT_DIR" \
        pb_data pb_public 2>/dev/null || warn "pb_public not found, skipping"
    log "PocketBase backup complete: pocketbase_$DATE.tar.gz"
else
    warn "pb_data directory not found, skipping PocketBase backup"
fi

# Backup Umami PostgreSQL
if docker compose ps umami-db | grep -q "running"; then
    log "Backing up Umami database..."
    docker compose exec -T umami-db pg_dump -U umami umami > "$BACKUP_DIR/umami_$DATE.sql"
    gzip "$BACKUP_DIR/umami_$DATE.sql"
    log "Umami backup complete: umami_$DATE.sql.gz"
else
    warn "Umami database container not running, skipping backup"
fi

# Backup environment file (encrypted)
if [ -f "$PROJECT_DIR/.env" ]; then
    log "Backing up environment file..."
    # Note: In production, you should encrypt this with gpg or similar
    cp "$PROJECT_DIR/.env" "$BACKUP_DIR/env_$DATE.bak"
    log "Environment backup complete: env_$DATE.bak"
fi

# Create combined archive
log "Creating combined backup archive..."
cd "$BACKUP_DIR"
BACKUP_FILES=$(ls -1 *_$DATE* 2>/dev/null | tr '\n' ' ')
if [ -n "$BACKUP_FILES" ]; then
    tar -czf "backup_$DATE.tar.gz" $BACKUP_FILES
    rm -f $BACKUP_FILES
    log "Combined backup complete: backup_$DATE.tar.gz"
fi

# Cleanup old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
DELETED_COUNT=$(find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
log "Deleted $DELETED_COUNT old backup(s)"

# Show backup stats
BACKUP_SIZE=$(du -h "$BACKUP_DIR/backup_$DATE.tar.gz" 2>/dev/null | cut -f1)
TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)

log "===== Backup Summary ====="
log "Backup file: backup_$DATE.tar.gz ($BACKUP_SIZE)"
log "Total backups: $TOTAL_BACKUPS"
log "Total backup size: $TOTAL_SIZE"
log "Backup complete!"
