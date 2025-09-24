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

# Build backend
echo "===> Building backend"
npm run build

## Build admin
#echo "===> Building Admin UI"
#npx medusa build --admin-only

# Install fresh
echo "===> Installing production dependencies"
cd .medusa/server
npm install --legacy-peer-deps

# xProduction env
echo "===> Copying production environment"
cp ../../.env .env.production || true


# Start PM2 apps
echo "===> Starting PM2 apps"
for app in "${PM2_APPS[@]}"; do
  pm2 start "$app"
done

echo "Build finished"
