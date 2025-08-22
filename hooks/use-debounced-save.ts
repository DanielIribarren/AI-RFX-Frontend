"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export interface DebouncedSaveConfig {
  delay?: number
  maxWait?: number // Tiempo máximo antes de forzar el guardado
  immediate?: boolean // Ejecutar inmediatamente en la primera llamada
  leading?: boolean // Ejecutar al inicio del periodo de debounce
  trailing?: boolean // Ejecutar al final del periodo de debounce
}

export interface DebouncedSaveState {
  isPending: boolean
  isExecuting: boolean
  lastExecuted: Date | null
  callCount: number
  pendingValue: any
}

export function useDebouncedSave<T>(
  saveFunction: (value: T) => Promise<void>,
  config: DebouncedSaveConfig = {}
) {
  const {
    delay = 1000,
    maxWait = 5000,
    immediate = false,
    leading = false,
    trailing = true
  } = config

  const [state, setState] = useState<DebouncedSaveState>({
    isPending: false,
    isExecuting: false,
    lastExecuted: null,
    callCount: 0,
    pendingValue: null
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastCallTimeRef = useRef<number>(0)
  const hasExecutedLeadingRef = useRef<boolean>(false)
  const pendingValueRef = useRef<T | null>(null)

  // Función para limpiar timeouts
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current)
      maxWaitTimeoutRef.current = null
    }
  }, [])

  // Función para ejecutar el guardado
  const executeSave = useCallback(async (value: T, source: 'leading' | 'trailing' | 'maxWait' | 'immediate') => {
    if (state.isExecuting) return // Evitar ejecuciones concurrentes

    try {
      setState(prev => ({ 
        ...prev, 
        isExecuting: true, 
        isPending: false,
        pendingValue: null
      }))

      await saveFunction(value)

      setState(prev => ({ 
        ...prev, 
        isExecuting: false,
        lastExecuted: new Date(),
        callCount: prev.callCount + 1
      }))

      console.log(`✅ Debounced save executed (${source}):`, value)
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isExecuting: false,
        isPending: false
      }))
      
      console.error(`❌ Debounced save failed (${source}):`, error)
      throw error
    }
  }, [saveFunction, state.isExecuting])

  // Función principal de guardado debounced
  const debouncedSave = useCallback((value: T) => {
    const now = Date.now()
    lastCallTimeRef.current = now
    pendingValueRef.current = value

    setState(prev => ({ 
      ...prev, 
      isPending: true,
      pendingValue: value
    }))

    // Limpiar timeout existente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Ejecutar inmediatamente si es la primera llamada y immediate=true
    if (immediate && state.callCount === 0) {
      executeSave(value, 'immediate')
      return
    }

    // Ejecutar al inicio si leading=true y no se ha ejecutado recientemente
    if (leading && !hasExecutedLeadingRef.current) {
      hasExecutedLeadingRef.current = true
      executeSave(value, 'leading')
      
      // Resetear el flag después del delay
      setTimeout(() => {
        hasExecutedLeadingRef.current = false
      }, delay)
      return
    }

    // Configurar timeout para maxWait si no existe
    if (!maxWaitTimeoutRef.current && maxWait > 0) {
      maxWaitTimeoutRef.current = setTimeout(() => {
        if (pendingValueRef.current !== null) {
          executeSave(pendingValueRef.current, 'maxWait')
          clearTimeouts()
        }
      }, maxWait)
    }

    // Configurar timeout principal para trailing execution
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        if (pendingValueRef.current !== null) {
          executeSave(pendingValueRef.current, 'trailing')
          clearTimeouts()
        }
      }, delay)
    }
  }, [delay, maxWait, immediate, leading, trailing, executeSave, state.callCount])

  // Función para cancelar guardado pendiente
  const cancel = useCallback(() => {
    clearTimeouts()
    pendingValueRef.current = null
    setState(prev => ({ 
      ...prev, 
      isPending: false,
      pendingValue: null
    }))
  }, [clearTimeouts])

  // Función para forzar guardado inmediato
  const flush = useCallback(async () => {
    if (pendingValueRef.current !== null) {
      const value = pendingValueRef.current
      clearTimeouts()
      await executeSave(value, 'immediate')
    }
  }, [clearTimeouts, executeSave])

  // Cleanup en desmontaje
  useEffect(() => {
    return () => {
      clearTimeouts()
    }
  }, [clearTimeouts])

  // Función para obtener estadísticas
  const getStats = useCallback(() => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTimeRef.current
    const timeSinceLastExecution = state.lastExecuted 
      ? now - state.lastExecuted.getTime() 
      : null

    return {
      callCount: state.callCount,
      isPending: state.isPending,
      isExecuting: state.isExecuting,
      timeSinceLastCall,
      timeSinceLastExecution,
      pendingValue: state.pendingValue,
      config: { delay, maxWait, immediate, leading, trailing }
    }
  }, [state, delay, maxWait, immediate, leading, trailing])

  return {
    debouncedSave,
    cancel,
    flush,
    state,
    getStats,
    utils: {
      clearTimeouts,
      isPending: state.isPending,
      isExecuting: state.isExecuting,
      lastExecuted: state.lastExecuted
    }
  }
}
