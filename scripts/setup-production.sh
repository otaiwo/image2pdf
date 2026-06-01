#!/bin/bash

# Quick production setup script
# Usage: ./scripts/setup-production.sh

set -e

echo "🚀 PDFMaster AI - Production Setup"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production not found${NC}"
    echo "Copy .env.production.example to .env.production and configure"
    exit 1
fi

# Load environment
export $(cat .env.production | xargs)

echo -e "${BLUE}1. Installing dependencies...${NC}"
composer install --no-interaction --optimize-autoloader --no-dev
npm ci && npm run build

echo -e "${BLUE}2. Running database migrations...${NC}"
php artisan migrate --force

echo -e "${BLUE}3. Generating app key...${NC}"
php artisan key:generate --force || true

echo -e "${BLUE}4. Publishing assets...${NC}"
php artisan vendor:publish --tag=public --force || true

echo -e "${BLUE}5. Caching configuration...${NC}"
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo -e "${BLUE}6. Setting permissions...${NC}"
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

echo -e "${BLUE}7. Testing application...${NC}"
php artisan tinker --execute="echo 'DB Connection: ' . (\DB::connection()->getPdo() ? 'OK' : 'FAILED')"

echo -e "${GREEN}✓ Production setup completed!${NC}"
echo ""
echo "Next steps:"
echo "  1. docker-compose up -d"
echo "  2. Verify health: curl https://your-domain.com/api/health"
echo "  3. Check queue: docker-compose exec app php artisan queue:work"
echo "  4. Monitor logs: docker-compose logs -f app"
