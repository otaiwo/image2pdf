#!/bin/bash

# Health Check Monitoring Script
# Setup as a cron job or systemd timer to monitor application health
# Usage: ./scripts/health-monitor.sh

set -e

# Configuration
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-https://your-domain.com/api/health}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-https://hooks.slack.com/services/YOUR/WEBHOOK/URL}"
LOG_FILE="/var/www/html/storage/logs/health-monitor.log"
MAX_RETRIES=3
RETRY_DELAY=5

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Alert function
alert() {
    local message=$1
    local severity=$2
    
    log "⚠️ ALERT: $message"
    
    # Send to Slack if webhook is configured
    if [ -n "$ALERT_WEBHOOK" ] && [ "$ALERT_WEBHOOK" != "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" ]; then
        curl -X POST "$ALERT_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"[$severity] Health Check Alert\", \"blocks\": [{\"type\": \"section\", \"text\": {\"type\": \"mrkdwn\", \"text\": \"*$severity*\n$message\"}}]}" \
            2>/dev/null || true
    fi
}

# Check health function
check_health() {
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log "Health check attempt $attempt/$MAX_RETRIES..."
        
        response=$(curl -s -w "\n%{http_code}" "$HEALTH_CHECK_URL" 2>/dev/null || echo "error")
        http_code=$(echo "$response" | tail -n 1)
        body=$(echo "$response" | head -n -1)
        
        if [ "$http_code" = "200" ]; then
            log "✓ Health check passed (HTTP $http_code)"
            
            # Parse health status from response
            status=$(echo "$body" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
            if [ "$status" = "healthy" ]; then
                log "✓ All services are healthy"
                return 0
            elif [ "$status" = "degraded" ]; then
                log "⚠️ Services are degraded"
                alert "Application is in degraded state. Check $HEALTH_CHECK_URL for details" "WARNING"
                return 1
            fi
            return 0
        else
            log "✗ Health check failed (HTTP $http_code)"
            
            if [ $attempt -lt $MAX_RETRIES ]; then
                log "Retrying in ${RETRY_DELAY}s..."
                sleep $RETRY_DELAY
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    alert "Application health check failed after $MAX_RETRIES attempts\nURL: $HEALTH_CHECK_URL\nLast HTTP code: $http_code" "CRITICAL"
    return 1
}

# Check specific endpoints
check_endpoints() {
    local endpoints=(
        "/api/health"
        "/api/status"
        "/api/user"
    )
    
    for endpoint in "${endpoints[@]}"; do
        url="https://your-domain.com$endpoint"
        http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        
        if [ "$http_code" = "200" ] || [ "$http_code" = "401" ]; then
            log "✓ $endpoint: HTTP $http_code"
        else
            log "✗ $endpoint: HTTP $http_code"
            alert "Endpoint $endpoint is not responding correctly (HTTP $http_code)" "WARNING"
        fi
    done
}

# Check queue jobs
check_queue() {
    # This requires SSH access to production
    # Adjust based on your deployment method
    log "Checking queue jobs status..."
    
    # Example: ssh user@host 'php artisan queue:failed'
    # For now, just log
    log "Queue monitoring requires SSH access to production"
}

# Main execution
log "=== Starting Health Check Monitor ==="

if check_health; then
    log "✓ Health check completed successfully"
    check_endpoints
    check_queue
else
    log "✗ Health check FAILED"
    exit 1
fi

log "=== Health Check Monitor Completed ==="
