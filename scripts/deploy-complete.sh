#!/usr/bin/env bash
set -euo pipefail

# Wrapper de compatibilidad: flujo de deploy simplificado.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

exec "$SCRIPT_DIR/deploy-vercel.sh" "${1:---auto}"
