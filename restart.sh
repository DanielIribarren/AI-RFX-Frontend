#!/bin/bash

echo "🔄 REINICIANDO FRONTEND COMPLETAMENTE..."

# 1. Matar todos los procesos de Node/Next.js
echo "1. Matando procesos de Node.js..."
pkill -f "next"
pkill -f "npm"
sleep 2

# 2. Limpiar cachés
echo "2. Limpiando cachés..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .cache

# 3. Reinstalar dependencias (por si acaso)
echo "3. Reinstalando dependencias..."
npm install --legacy-peer-deps

# 4. Build limpio
echo "4. Build limpio..."
npm run build

# 5. Iniciar servidor
echo "5. Iniciando servidor de desarrollo..."
echo "🌐 Ve a: http://localhost:3004"
echo "🔍 Ctrl+Shift+R para refresh forzado"
npm run dev
