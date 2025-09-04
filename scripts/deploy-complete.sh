#!/bin/bash

# 🚀 Script Completo de Deploy para AI-RFX Frontend
# ================================================

set -e  # Detener en cualquier error

echo "🚀 INICIANDO DEPLOY COMPLETO DE AI-RFX FRONTEND"
echo "==============================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "Este script debe ejecutarse desde la raíz del proyecto (donde está package.json)"
    exit 1
fi

# 1. Limpiar procesos anteriores
log "1. Limpiando procesos anteriores..."
pkill -f "next" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
sleep 2

# 2. Limpiar caché y archivos temporales
log "2. Limpiando cachés y archivos temporales..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .cache
rm -rf out
rm -rf dist

# 3. Verificar e instalar dependencias
log "3. Verificando dependencias..."
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    log "Instalando dependencias..."
    npm ci --legacy-peer-deps
else
    log "Dependencias ya instaladas y actualizadas"
fi

# 4. Verificar variables de entorno
log "4. Verificando configuración..."
if [ ! -f ".env.local" ] && [ -z "$NEXT_PUBLIC_API_URL" ]; then
    warning "No se encontró .env.local y no hay NEXT_PUBLIC_API_URL configurado"
    warning "Esto puede causar problemas en el deploy"
fi

# 5. Ejecutar linting
log "5. Ejecutando linting..."
if npm run lint --silent; then
    success "Linting pasó exitosamente"
else
    warning "Linting encontró advertencias (continuando...)"
fi

# 6. Build de producción
log "6. Ejecutando build de producción..."
if npm run build; then
    success "Build completado exitosamente"
else
    error "Build falló"
    exit 1
fi

# 7. Deploy a Vercel
log "7. Iniciando deploy a Vercel..."

# Verificar si hay argumentos de deploy
DEPLOY_ARGS=""
if [ "$1" == "--preview" ]; then
    DEPLOY_ARGS=""
    log "Deploy de preview (rama actual)"
elif [ "$1" == "--prod" ]; then
    DEPLOY_ARGS="--prod"
    log "Deploy de producción"
else
    # Por defecto, detectar automáticamente
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    if [ "$CURRENT_BRANCH" == "main" ] || [ "$CURRENT_BRANCH" == "master" ]; then
        DEPLOY_ARGS="--prod"
        log "Detectada rama principal, deploy de producción"
    else
        DEPLOY_ARGS=""
        log "Detectada rama $CURRENT_BRANCH, deploy de preview"
    fi
fi

# Ejecutar deploy
if command -v vercel &> /dev/null; then
    if vercel $DEPLOY_ARGS; then
        success "Deploy completado exitosamente!"
        
        # Mostrar información del deploy
        log "Información del deploy:"
        if [ -f ".vercel/project.json" ]; then
            PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
            echo "  📋 Project ID: $PROJECT_ID"
        fi
        
        echo "  🌐 Dashboard: https://vercel.com/dashboard"
        echo "  📊 Analytics: https://vercel.com/analytics"
    else
        error "Deploy falló"
        exit 1
    fi
else
    error "Vercel CLI no está instalado"
    echo ""
    echo "Para instalar Vercel CLI:"
    echo "  npm install -g vercel"
    echo ""
    exit 1
fi

# 8. Hook de post-deploy (opcional)
if [ -f "scripts/post-deploy.sh" ]; then
    log "8. Ejecutando hook de post-deploy..."
    bash scripts/post-deploy.sh
fi

echo ""
success "🎉 DEPLOY COMPLETO EXITOSO!"
echo "=========================="
log "El proyecto ha sido desplegado exitosamente"

# Mostrar siguiente pasos
echo ""
echo "📝 Próximos pasos:"
echo "  • Verificar que la aplicación funcione correctamente"
echo "  • Revisar logs en Vercel Dashboard"
echo "  • Configurar deploy hooks si es necesario"
echo ""
