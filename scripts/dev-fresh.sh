#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[dev:fresh] Project: $ROOT_DIR"
echo "[dev:fresh] Stopping previous Next dev process on :3004 (if any)..."
if lsof -ti tcp:3004 >/dev/null 2>&1; then
  lsof -ti tcp:3004 | xargs kill -9 >/dev/null 2>&1 || true
fi

echo "[dev:fresh] Cleaning build cache..."
rm -rf .next node_modules/.cache

echo "[dev:fresh] Active local API config (.env.local):"
if [ -f .env.local ]; then
  if command -v rg >/dev/null 2>&1; then
    rg "NEXT_PUBLIC_API_URL|NEXT_PUBLIC_AUTH_API_URL|AUTH_API_URL|API_URL" .env.local || true
  else
    grep -E "NEXT_PUBLIC_API_URL|NEXT_PUBLIC_AUTH_API_URL|AUTH_API_URL|API_URL" .env.local || true
  fi
else
  echo "  (missing .env.local)"
fi

echo "[dev:fresh] Starting Next.js with webpack on :3004..."
exec npx next dev --webpack -p 3004
