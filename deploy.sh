#!/bin/bash
set -e

APP_DIR="/var/www/trollscan"
REPO_BRANCH="main"

echo "=== TROLLSCAN DEPLOY ==="

cd "$APP_DIR"

echo "[1/5] Pulling latest code..."
git pull origin "$REPO_BRANCH"

echo "[2/5] Installing dependencies..."
pnpm install --frozen-lockfile

echo "[3/5] Building..."
pnpm build

echo "[4/5] Copying static assets to standalone..."
cp -r public .next/standalone/public 2>/dev/null || true
cp -r .next/static .next/standalone/.next/static

echo "[5/5] Restarting PM2..."
pm2 reload ecosystem.config.cjs --update-env

echo "=== DEPLOY COMPLETE ==="
pm2 status trollscan
