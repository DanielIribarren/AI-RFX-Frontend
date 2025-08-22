"use client"

import { useState, useCallback, useRef } from "react"

export interface RollbackState<T> {
  originalValue: T
  currentValue: T
  isRollingBack: boolean
  rollbackHistory: Array<{
    timestamp: Date
    from: T
    to: T
    reason: string
  }>
}

export interface RollbackConfig {
  enableAutoRollback?: boolean
  showRollbackNotification?: boolean
  maxHistorySize?: number
  rollbackDelay?: number // Delay antes del rollback automático
}

export function useRollback<T>(
  initialValue: T,
  config: RollbackConfig = {}
) {
  const {
    enableAutoRollback = true,
    showRollbackNotification = true,
    maxHistorySize = 10,
    rollbackDelay = 1000
  } = config

  const [state, setState] = useState<RollbackState<T>>({
    originalValue: initialValue,
    currentValue: initialValue,
    isRollingBack: false,
    rollbackHistory: []
  })

  const rollbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Función para actualizar el valor original (cuando se confirma un cambio exitoso)
  const commitValue = useCallback((value: T) => {
    setState(prev => ({
      ...prev,
      originalValue: value,
      currentValue: value
    }))
  }, [])

  // Función para actualizar el valor actual (temporalmente)
  const updateValue = useCallback((value: T) => {
    setState(prev => ({
      ...prev,
      currentValue: value
    }))
  }, [])

  // Función para realizar rollback manual
  const rollback = useCallback((reason: string = "Manual rollback") => {
    setState(prev => {
      const newHistory = [
        {
          timestamp: new Date(),
          from: prev.currentValue,
          to: prev.originalValue,
          reason
        },
        ...prev.rollbackHistory.slice(0, maxHistorySize - 1)
      ]

      return {
        ...prev,
        currentValue: prev.originalValue,
        isRollingBack: true,
        rollbackHistory: newHistory
      }
    })

    // Resetear el estado de rollback después de un breve delay
    setTimeout(() => {
      setState(prev => ({ ...prev, isRollingBack: false }))
    }, 300)

    if (showRollbackNotification) {
      console.log(`🔄 Rollback performed: ${reason}`)
    }
  }, [maxHistorySize, showRollbackNotification])

  // Función para programar rollback automático
  const scheduleAutoRollback = useCallback((reason: string = "Backend rejection") => {
    if (!enableAutoRollback) return

    // Limpiar rollback previo si existe
    if (rollbackTimeoutRef.current) {
      clearTimeout(rollbackTimeoutRef.current)
    }

    rollbackTimeoutRef.current = setTimeout(() => {
      rollback(reason)
    }, rollbackDelay)
  }, [enableAutoRollback, rollback, rollbackDelay])

  // Función para cancelar rollback automático programado
  const cancelAutoRollback = useCallback(() => {
    if (rollbackTimeoutRef.current) {
      clearTimeout(rollbackTimeoutRef.current)
      rollbackTimeoutRef.current = null
    }
  }, [])

  // Función para manejar éxito de guardado
  const handleSaveSuccess = useCallback((value: T) => {
    cancelAutoRollback()
    commitValue(value)
  }, [cancelAutoRollback, commitValue])

  // Función para manejar error de guardado
  const handleSaveError = useCallback((error: Error, autoRollback = true) => {
    if (autoRollback && enableAutoRollback) {
      scheduleAutoRollback(`Save failed: ${error.message}`)
    }
  }, [enableAutoRollback, scheduleAutoRollback])

  // Función para verificar si hay cambios pendientes
  const hasChanges = useCallback((): boolean => {
    return JSON.stringify(state.currentValue) !== JSON.stringify(state.originalValue)
  }, [state.currentValue, state.originalValue])

  // Función para obtener el último rollback
  const getLastRollback = useCallback(() => {
    return state.rollbackHistory[0] || null
  }, [state.rollbackHistory])

  // Función para limpiar historial
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      rollbackHistory: []
    }))
  }, [])

  // Función para crear un checkpoint (guardar estado actual como original)
  const createCheckpoint = useCallback(() => {
    setState(prev => ({
      ...prev,
      originalValue: prev.currentValue
    }))
  }, [])

  // Función para restaurar a un punto específico del historial
  const restoreFromHistory = useCallback((index: number) => {
    const historyItem = state.rollbackHistory[index]
    if (historyItem) {
      updateValue(historyItem.to)
    }
  }, [state.rollbackHistory, updateValue])

  // Función para comparar valores y detectar diferencias
  const getDifferences = useCallback((): string[] => {
    const differences: string[] = []
    
    if (typeof state.currentValue === 'object' && typeof state.originalValue === 'object') {
      // Comparación simple para objetos
      const currentKeys = Object.keys(state.currentValue as any)
      const originalKeys = Object.keys(state.originalValue as any)
      
      const allKeys = [...new Set([...currentKeys, ...originalKeys])]
      
      for (const key of allKeys) {
        const currentVal = (state.currentValue as any)[key]
        const originalVal = (state.originalValue as any)[key]
        
        if (JSON.stringify(currentVal) !== JSON.stringify(originalVal)) {
          differences.push(`${key}: ${originalVal} → ${currentVal}`)
        }
      }
    } else if (state.currentValue !== state.originalValue) {
      differences.push(`${state.originalValue} → ${state.currentValue}`)
    }
    
    return differences
  }, [state.currentValue, state.originalValue])

  return {
    state,
    rollback,
    commitValue,
    updateValue,
    scheduleAutoRollback,
    cancelAutoRollback,
    handleSaveSuccess,
    handleSaveError,
    hasChanges,
    getLastRollback,
    clearHistory,
    createCheckpoint,
    restoreFromHistory,
    getDifferences,
    utils: {
      enableAutoRollback,
      showRollbackNotification,
      maxHistorySize,
      rollbackDelay
    }
  }
}
