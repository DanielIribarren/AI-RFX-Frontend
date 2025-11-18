"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

interface CacheOptions {
  key: string
  expiryMinutes?: number
}

/**
 * Hook simple de cache con localStorage
 * Principio KISS: Solo lo esencial - leer cache, guardar cache, expiración
 */
export function useCachedData<T>(
  fetchFn: () => Promise<T>,
  options: CacheOptions
) {
  const { key, expiryMinutes = 5 } = options
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // ✅ Usar ref para estabilizar fetchFn y evitar loop infinito
  const fetchFnRef = useRef(fetchFn)
  useEffect(() => {
    fetchFnRef.current = fetchFn
  }, [fetchFn])

  // Cargar datos (cache primero, luego API si necesario)
  const load = useCallback(async (forceRefresh = false) => {
    setIsLoading(true)

    try {
      // 1. Intentar cache si no es refresh forzado
      if (!forceRefresh) {
        const cached = localStorage.getItem(key)
        if (cached) {
          const { data: cachedData, expiry } = JSON.parse(cached)
          if (Date.now() < expiry) {
            setData(cachedData)
            setIsLoading(false)
            return // ⚡ Cache hit - retorno inmediato
          }
        }
      }

      // 2. Cache miss o expirado - llamar API
      const freshData = await fetchFnRef.current()
      setData(freshData)

      // 3. Guardar en cache
      localStorage.setItem(key, JSON.stringify({
        data: freshData,
        expiry: Date.now() + (expiryMinutes * 60 * 1000)
      }))

    } catch (error) {
      console.error('Error loading data:', error)
      // En caso de error, intentar usar cache aunque esté expirado
      const cached = localStorage.getItem(key)
      if (cached) {
        const { data: cachedData } = JSON.parse(cached)
        setData(cachedData)
      }
    } finally {
      setIsLoading(false)
    }
  }, [key, expiryMinutes]) // ✅ fetchFn YA NO está en dependencias

  // Cargar en mount
  useEffect(() => {
    load()
  }, [load])

  // Refresh manual (forzar API)
  const refresh = useCallback(() => load(true), [load])

  return { data, isLoading, refresh }
}
