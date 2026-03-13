#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

MODE="${1:---auto}"

if ! command -v vercel >/dev/null 2>&1; then
  echo "❌ Vercel CLI no está instalado. Instala con: npm i -g vercel"
  exit 1
fi

if ! vercel whoami >/dev/null 2>&1; then
  echo "❌ No hay sesión activa en Vercel. Ejecuta: vercel login"
  exit 1
fi

if [ ! -f ".vercel/project.json" ]; then
  if [ -n "${VERCEL_PROJECT_NAME:-}" ]; then
    vercel link --yes --project "$VERCEL_PROJECT_NAME"
  else
    vercel link --yes
  fi
fi

if [[ "$MODE" == "--auto" ]]; then
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
  if [[ "$branch" == "main" || "$branch" == "master" ]]; then
    MODE="--prod"
  else
    MODE="--preview"
  fi
fi

case "$MODE" in
  --prod|production)
    echo "🚀 Deploy frontend a producción en Vercel"
    vercel deploy --prod --yes
    ;;
  --preview|preview)
    echo "🚀 Deploy frontend preview en Vercel"
    vercel deploy --yes
    ;;
  *)
    echo "Uso: ./scripts/deploy-vercel.sh [--auto|--prod|--preview]"
    exit 1
    ;;
esac
