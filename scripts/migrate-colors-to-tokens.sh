#!/bin/bash

# Script para migrar colores hardcoded a tokens semánticos
# Basado en STYLE_GUIDE.md

echo "🎨 Iniciando migración de colores a tokens semánticos..."
echo ""

# Contador de cambios
CHANGES=0

# Función para reemplazar en archivos tsx
migrate_color() {
  local old_pattern=$1
  local new_pattern=$2
  local description=$3
  
  echo "📝 Migrando: $description"
  echo "   $old_pattern → $new_pattern"
  
  # Buscar y reemplazar en archivos .tsx
  local count=$(find app components -type f -name "*.tsx" -exec grep -l "$old_pattern" {} \; | wc -l)
  
  if [ $count -gt 0 ]; then
    find app components -type f -name "*.tsx" -exec sed -i '' "s/$old_pattern/$new_pattern/g" {} +
    CHANGES=$((CHANGES + count))
    echo "   ✅ $count archivos actualizados"
  else
    echo "   ⏭️  No se encontraron ocurrencias"
  fi
  echo ""
}

echo "=== FASE 1: Backgrounds ==="
echo ""

# Backgrounds principales
migrate_color 'bg-white"' 'bg-background"' "Fondo principal blanco"
migrate_color 'bg-white ' 'bg-background ' "Fondo principal blanco (con espacio)"
migrate_color 'bg-black"' 'bg-foreground"' "Fondo negro"
migrate_color 'bg-black ' 'bg-foreground ' "Fondo negro (con espacio)"

# Backgrounds grises
migrate_color 'bg-gray-50"' 'bg-secondary"' "Fondo secundario gris claro"
migrate_color 'bg-gray-50 ' 'bg-secondary ' "Fondo secundario gris claro (con espacio)"
migrate_color 'bg-gray-100"' 'bg-muted"' "Fondo sutil gris"
migrate_color 'bg-gray-100 ' 'bg-muted ' "Fondo sutil gris (con espacio)"

echo "=== FASE 2: Text Colors ==="
echo ""

# Colores de texto
migrate_color 'text-black"' 'text-foreground"' "Texto principal negro"
migrate_color 'text-black ' 'text-foreground ' "Texto principal negro (con espacio)"
migrate_color 'text-white"' 'text-background"' "Texto blanco sobre fondos oscuros"
migrate_color 'text-white ' 'text-background ' "Texto blanco sobre fondos oscuros (con espacio)"
migrate_color 'text-gray-600"' 'text-muted-foreground"' "Texto secundario gris"
migrate_color 'text-gray-600 ' 'text-muted-foreground ' "Texto secundario gris (con espacio)"
migrate_color 'text-gray-500"' 'text-muted-foreground"' "Texto secundario gris medio"
migrate_color 'text-gray-500 ' 'text-muted-foreground ' "Texto secundario gris medio (con espacio)"
migrate_color 'text-gray-400"' 'text-muted-foreground\/60"' "Texto deshabilitado"
migrate_color 'text-gray-400 ' 'text-muted-foreground\/60 ' "Texto deshabilitado (con espacio)"

echo "=== FASE 3: Borders ==="
echo ""

# Bordes
migrate_color 'border-gray-200"' 'border"' "Borde estándar"
migrate_color 'border-gray-200 ' 'border ' "Borde estándar (con espacio)"
migrate_color 'border-gray-300"' 'border-input"' "Borde de inputs"
migrate_color 'border-gray-300 ' 'border-input ' "Borde de inputs (con espacio)"

echo "=== FASE 4: Brand Colors ==="
echo ""

# Colores de marca (solo los más comunes, revisar manualmente los específicos)
migrate_color 'bg-indigo-600"' 'bg-primary"' "Color de marca principal"
migrate_color 'bg-indigo-600 ' 'bg-primary ' "Color de marca principal (con espacio)"
migrate_color 'text-indigo-600"' 'text-primary"' "Texto color de marca"
migrate_color 'text-indigo-600 ' 'text-primary ' "Texto color de marca (con espacio)"
migrate_color 'border-indigo-500"' 'border-primary"' "Borde color de marca"
migrate_color 'border-indigo-500 ' 'border-primary ' "Borde color de marca (con espacio)"

echo "=== FASE 5: Destructive Colors ==="
echo ""

# Colores destructivos
migrate_color 'bg-red-600"' 'bg-destructive"' "Fondo destructivo"
migrate_color 'bg-red-600 ' 'bg-destructive ' "Fondo destructivo (con espacio)"
migrate_color 'text-red-600"' 'text-destructive"' "Texto destructivo"
migrate_color 'text-red-600 ' 'text-destructive ' "Texto destructivo (con espacio)"

echo ""
echo "✅ Migración completada"
echo "📊 Total de archivos modificados: $CHANGES"
echo ""
echo "⚠️  IMPORTANTE: Revisar manualmente:"
echo "   - Colores específicos de estado (green, blue, yellow, orange)"
echo "   - Colores con opacidad personalizada"
echo "   - Casos especiales que requieren colores hardcoded"
echo ""
echo "🔍 Siguiente paso: Ejecutar 'npm run build' para verificar"
