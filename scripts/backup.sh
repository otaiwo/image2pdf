#!/bin/bash

# Database Backup Script
# Usage: ./scripts/backup.sh [mysql|s3]

set -e

BACKUP_DIR="/var/www/html/storage/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="${DB_DATABASE:-image2pdf}"
DB_USER="${DB_USERNAME:-app_user}"
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to backup MySQL database
backup_mysql() {
    echo "Backing up MySQL database: $DB_NAME..."
    
    BACKUP_FILE="$BACKUP_DIR/db_backup_${TIMESTAMP}.sql"
    
    # Prompt for password or use env variable
    if [ -z "$DB_PASSWORD" ]; then
        mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" > "$BACKUP_FILE"
    else
        mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"
    fi
    
    # Compress the backup
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    echo "✓ Database backup created: $BACKUP_FILE"
    
    # Return backup file path
    echo "$BACKUP_FILE"
}

# Function to upload backup to S3
backup_to_s3() {
    local backup_file=$1
    
    if [ -z "$AWS_ACCESS_KEY_ID" ]; then
        echo "✗ AWS credentials not configured. Skipping S3 upload."
        return 1
    fi
    
    echo "Uploading backup to S3..."
    
    BACKUP_FILENAME=$(basename "$backup_file")
    S3_PATH="s3://${BACKUP_BUCKET}/backups/$(date +%Y/%m/%d)/$BACKUP_FILENAME"
    
    aws s3 cp "$backup_file" "$S3_PATH" \
        --sse AES256 \
        --storage-class STANDARD_IA
    
    echo "✓ Backup uploaded to $S3_PATH"
    
    # Clean up old local backups (keep only 7 days)
    find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete
}

# Function to list backups
list_backups() {
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/db_backup_*.sql.gz 2>/dev/null || echo "No backups found"
}

# Function to restore from backup
restore_backup() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        echo "✗ Backup file not found: $backup_file"
        return 1
    fi
    
    echo "WARNING: This will restore from backup: $backup_file"
    echo "All current data will be REPLACED."
    read -p "Are you sure? Type 'YES' to confirm: " confirm
    
    if [ "$confirm" != "YES" ]; then
        echo "Restore cancelled."
        return 1
    fi
    
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"
    else
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$backup_file"
    fi
    
    echo "✓ Database restored successfully"
}

# Main script logic
case "${1:-backup}" in
    backup)
        BACKUP_FILE=$(backup_mysql)
        if [ "$2" = "s3" ]; then
            backup_to_s3 "$BACKUP_FILE"
        fi
        ;;
    restore)
        restore_backup "${2}"
        ;;
    list)
        list_backups
        ;;
    *)
        echo "Usage: $0 {backup|restore|list} [s3] [backup_file]"
        echo ""
        echo "Examples:"
        echo "  $0 backup              # Backup to local storage"
        echo "  $0 backup s3           # Backup to local + S3"
        echo "  $0 list                # List available backups"
        echo "  $0 restore /path/to/backup.sql.gz  # Restore from backup"
        exit 1
        ;;
esac
