#!/bin/bash

# Database Restore Cron Job Script
# Schedule with crontab: 0 2 * * * /var/www/html/scripts/backup-cron.sh

set -e

# Configuration
LOG_FILE="/var/www/html/storage/logs/backup.log"
BACKUP_SCRIPT="/var/www/html/scripts/backup.sh"

# Create log file if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Run backup
log "Starting scheduled backup..."

if [ -x "$BACKUP_SCRIPT" ]; then
    if "$BACKUP_SCRIPT" backup s3 >> "$LOG_FILE" 2>&1; then
        log "Backup completed successfully"
    else
        log "Backup FAILED - check logs above"
        # Send alert (implement your alerting mechanism)
        # Example: curl -X POST https://alerts.example.com/backup-failed
    fi
else
    log "Backup script not found or not executable: $BACKUP_SCRIPT"
fi

# Clean up old backups from local storage (keep 30 days)
log "Cleaning up old local backups..."
find /var/www/html/storage/backups -name "db_backup_*.sql.gz" -mtime +30 -delete

log "Scheduled backup task completed"
