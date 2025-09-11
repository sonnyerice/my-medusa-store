#!/usr/bin/env bash
# Simplified Medusa update script with PM2 stop/start and package.json/package-lock.json backups

set -euo pipefail

DIR="$HOME/my-medusa-store"
PM2_APPS=("medusa-backend-production" "storefront-loja" "storefront-goodluckrooster")

echo "===> Entering $DIR"
cd "$DIR"

# Stop PM2 apps
echo "===> Stopping PM2 apps"
for app in "${PM2_APPS[@]}"; do
  pm2 stop "$app" || true
done

# Backups
TS="$(date +%F_%H%M%S)"
PKG_BAK="package.json.bak.$TS"
LOCK_BAK="package-lock.json.bak.$TS"

if [[ -f package.json ]]; then
  cp package.json "$PKG_BAK"
  echo "===> Backup created: $PKG_BAK"
fi

if [[ -f package-lock.json ]]; then
  cp package-lock.json "$LOCK_BAK"
  echo "===> Backup created: $LOCK_BAK"
fi

# Update Medusa packages
echo "===> Updating Medusa packages"
npx npm-check-updates -u -f '/^@medusajs\//'

# Clean dependencies
echo "===> Cleaning old dependencies"
rm -rf node_modules package-lock.json

# Install fresh
echo "===> Installing development dependencies"
npm install

# Run migrations
echo "===> Running DB migrations"
npx medusa db:migrate

# Build backend
echo "===> Building backend"
npm run build

# Build admin
echo "===> Building Admin UI"
npx medusa build --admin-only

# Install fresh
echo "===> Installing production dependencies"
cd .medusa/server
npm install --legacy-peer-deps

# Production env
echo "===> Copying production environment"
cp ../../.env .env.production || true


# Start PM2 apps
echo "===> Starting PM2 apps"
for app in "${PM2_APPS[@]}"; do
  pm2 start "$app"
done

echo "Update finished"
