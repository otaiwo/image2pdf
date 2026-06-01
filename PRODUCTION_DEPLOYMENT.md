# Production Deployment Guide

## Overview
This guide covers deploying the PDFMaster AI application to production with all security, monitoring, and reliability features.

## Prerequisites

- Docker & Docker Compose
- SSL/TLS certificates (Let's Encrypt recommended)
- Cloud storage (AWS S3, GCP Cloud Storage, or similar)
- Optional: Sentry account for error tracking
- Optional: DataDog or similar for monitoring
- Optional: SendGrid account for email

## Step 1: Environment Configuration

### Create Production Environment File

```bash
cp .env.production.example .env.production
```

### Fill in Required Secrets

```bash
# Database
DB_HOST=your-rds-endpoint.rds.amazonaws.com  # or Cloud SQL, or local MySQL
DB_PASSWORD=<generate-strong-password>

# Redis
REDIS_PASSWORD=<generate-strong-password>

# OpenAI
OPENAI_API_KEY=sk-...

# AWS/Storage
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET=your-pdf-storage

# Sentry
SENTRY_DSN=https://key@sentry.io/project-id

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

**⚠️ IMPORTANT**: Never commit `.env.production` - use your infrastructure's secret management:
- AWS Secrets Manager
- GCP Secret Manager
- HashiCorp Vault
- Kubernetes Secrets

## Step 2: Database Setup

### Option A: Self-Hosted MySQL (Docker)

Already included in `docker-compose.yml`. Run:

```bash
docker-compose up db -d
docker-compose exec app php artisan migrate --force
docker-compose exec app php artisan seed:run
```

### Option B: AWS RDS

1. Create RDS MySQL instance (8.0+)
2. Update `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD` in `.env.production`
3. Run migrations:

```bash
docker-compose exec app php artisan migrate --force --database=production
```

### Option C: Google Cloud SQL

1. Create Cloud SQL MySQL instance
2. Configure Cloud Proxy or public IP access
3. Update connection parameters
4. Run migrations

## Step 3: Redis/Cache Setup

### Option A: Docker (included)

```bash
docker-compose up redis -d
```

### Option B: AWS ElastiCache

1. Create ElastiCache Redis cluster
2. Update `REDIS_HOST` and `REDIS_PASSWORD`
3. Ensure security groups allow access

### Option C: GCP Memorystore

1. Create Memorystore Redis instance
2. Configure Cloud SQL proxy or direct VPC access
3. Update connection details

## Step 4: SSL/TLS Setup

### Using Let's Encrypt + Certbot

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Update nginx config
cp docker/nginx-ssl.conf docker/nginx.conf

# Enable auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### In Docker

Add to docker-compose.yml:

```yaml
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
  - /var/lib/letsencrypt:/var/lib/letsencrypt
```

## Step 5: File Storage

### AWS S3 Setup

```bash
# Create S3 bucket
aws s3 mb s3://your-pdf-storage --region us-east-1

# Enable versioning (for backup)
aws s3api put-bucket-versioning \
  --bucket your-pdf-storage \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket your-pdf-storage \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
    }]
  }'

# Create backup bucket
aws s3 mb s3://your-backups-bucket
```

### GCP Cloud Storage

```bash
gsutil mb -l us-central1 gs://your-pdf-storage
gsutil versioning set on gs://your-pdf-storage
```

## Step 6: Start Application

```bash
# Pull latest code
git pull origin main

# Build Docker images
docker-compose build

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec app php artisan migrate --force

# Generate app key
docker-compose exec app php artisan key:generate

# Clear cache
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan config:cache
```

## Step 7: Monitoring & Health Checks

### Health Check Endpoint

```bash
# Test health check
curl https://your-domain.com/api/health

# Response:
# {
#   "status": "healthy",
#   "timestamp": "2024-01-15T10:30:00Z",
#   "checks": {
#     "database": {"healthy": true},
#     "redis": {"healthy": true},
#     "cache": {"healthy": true}
#   }
# }
```

### Load Balancer Configuration

Configure your load balancer to use `/api/health` as health check endpoint:

**AWS ALB:**
- Path: `/api/health`
- Interval: 30 seconds
- Timeout: 5 seconds
- Healthy threshold: 2
- Unhealthy threshold: 3

**GCP Load Balancer:**
- Path: `/api/health`
- Check interval: 30 seconds
- Timeout: 5 seconds

### Set Up Monitoring Alerts

```bash
# Option 1: Sentry (Error Tracking)
# Already configured via SENTRY_DSN

# Option 2: DataDog
# Configure datadog agent in docker-compose.yml

# Option 3: CloudWatch (AWS)
# Configure CloudWatch agent on EC2/ECS instance
```

## Step 8: Backup Strategy

### Automated Daily Backups

```bash
# Edit crontab on production server
crontab -e

# Add:
0 2 * * * cd /var/www/html && /bin/bash scripts/backup-cron.sh
```

Or use GitHub Actions (already configured in `.github/workflows/backup.yml`):

```bash
# Set required secrets in GitHub:
# - PRODUCTION_HOST
# - PRODUCTION_USER
# - PRODUCTION_SSH_KEY
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
# - BACKUP_BUCKET
```

### Restore from Backup

```bash
# List available backups
./scripts/backup.sh list

# Restore specific backup
./scripts/backup.sh restore /var/www/html/storage/backups/db_backup_20240115_020000.sql.gz
```

## Step 9: CI/CD Pipeline

### GitHub Actions Setup

1. Push code to GitHub
2. Actions automatically:
   - Run tests
   - Build frontend
   - Check code quality
   - Build Docker image
   - Deploy to production (on main branch)

### Required Secrets in GitHub

```
PRODUCTION_HOST
PRODUCTION_USER
PRODUCTION_SSH_KEY
DOCKER_USERNAME (optional, for Docker Hub)
DOCKER_PASSWORD (optional)
SLACK_WEBHOOK_URL (optional, for notifications)
AWS_ACCESS_KEY_ID (optional, for backups)
AWS_SECRET_ACCESS_KEY (optional)
BACKUP_BUCKET (optional)
```

### Manual Deployment

```bash
git pull origin main
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan cache:clear
php artisan config:cache
docker-compose restart app queue scheduler
```

## Step 10: Performance Optimization

### Enable Caching

```bash
# Cache config
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache
```

### Database Optimization

```bash
# Create database indexes
php artisan migrate

# Check slow queries
# Monitor in AWS CloudWatch / GCP Cloud Logging
```

### CDN Configuration (Optional)

```bash
# CloudFlare setup
# - Point DNS to CloudFlare nameservers
# - Enable cache for static assets
# - Enable HTTP/2 and Gzip

# Or AWS CloudFront
# - Create distribution pointing to your domain
# - Set cache TTL for static assets
```

## Monitoring & Maintenance

### Daily Checks

```bash
# Check application health
curl https://your-domain.com/api/health

# Check queue status
docker-compose exec app php artisan queue:failed

# Check error logs
tail -f storage/logs/laravel.log

# Check Sentry for errors
# Visit https://sentry.io
```

### Weekly Tasks

- Review error logs
- Check database performance
- Verify backups completed successfully
- Monitor disk space
- Review failed jobs

### Monthly Tasks

- Update dependencies
- Review SSL certificate expiration
- Analyze performance metrics
- Update security policies
- Test backup restoration procedure

## Security Best Practices

### API Security

- ✅ CORS properly configured
- ✅ Rate limiting enabled on all endpoints
- ✅ HTTPS/SSL enforced
- ✅ Security headers set (X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ HSTS enabled

### Database Security

- ✅ Strong passwords enforced
- ✅ Encryption at rest (S3, RDS)
- ✅ Regular backups
- ✅ Database connection encrypted
- ✅ Least privilege access

### File Upload Security

- ✅ File type validation
- ✅ File size limits
- ✅ Virus scanning (optional: ClamAV)
- ✅ S3 bucket encryption
- ✅ Public access blocked

### Secrets Management

- ✅ No secrets in code
- ✅ Use environment variables
- ✅ Rotate API keys regularly
- ✅ Use cloud provider secret management
- ✅ Audit secret access

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker-compose logs app

# Verify environment variables
docker-compose exec app env | grep APP_

# Check database connection
docker-compose exec app php artisan tinker
>>> \DB::connection()->getPdo();
```

### High Memory Usage

```bash
# Check queue jobs
docker-compose exec app php artisan queue:failed

# Monitor memory
docker stats image2pdf-app

# Clear old cache
php artisan cache:clear
```

### Database Connection Errors

```bash
# Test connection
docker-compose exec app php artisan tinker
>>> config('database.connections.mysql')

# Check RDS security group
# Verify credentials in .env.production
```

### SSL Certificate Errors

```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/your-domain/cert.pem -text -noout

# Renew certificate
sudo certbot renew --force-renewal

# Check nginx configuration
nginx -t
```

## Support & Further Resources

- [Laravel Docs](https://laravel.com/docs)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [AWS RDS Docs](https://docs.aws.amazon.com/rds/)
- [Sentry Docs](https://docs.sentry.io/)
- [Let's Encrypt Docs](https://letsencrypt.org/docs/)
