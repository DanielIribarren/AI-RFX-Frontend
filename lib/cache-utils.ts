"use client"

/**
 * Utilidades simples para manejo de cache
 * Principio KISS: Funciones helper directas sin complicaciones
 */

/**
 * Invalida el cache del sidebar de RFX recientes
 * Llama esto después de cualquier operación que modifique la lista de RFX
 */
export function invalidateSidebarCache() {
  const SIDEBAR_CACHE_KEY = 'sidebar-recent-rfx'
  
  try {
    localStorage.removeItem(SIDEBAR_CACHE_KEY)
    console.log('✅ Sidebar cache invalidated')
  } catch (error) {
    console.error('❌ Error invalidating sidebar cache:', error)
  }
}

/**
 * Invalida múltiples caches a la vez
 * Útil cuando una operación afecta varios componentes
 */
export function invalidateMultipleCaches(cacheKeys: string[]) {
  try {
    cacheKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    console.log(`✅ ${cacheKeys.length} cache(s) invalidated:`, cacheKeys)
  } catch (error) {
    console.error('❌ Error invalidating caches:', error)
  }
}

/**
 * Invalida todos los caches relacionados con RFX
 * Usar con precaución - solo cuando sea realmente necesario
 */
export function invalidateAllRFXCaches() {
  const RFX_CACHE_KEYS = [
    'sidebar-recent-rfx',
    // Agregar aquí otros cache keys relacionados con RFX si existen
  ]
  
  invalidateMultipleCaches(RFX_CACHE_KEYS)
}
