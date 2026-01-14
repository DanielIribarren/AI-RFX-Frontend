/**
 * Toast Helper
 * 
 * Wrapper para sonner que proporciona una API simple y consistente
 * para mostrar notificaciones toast en toda la aplicación.
 * 
 * Reemplaza el componente custom ToastNotification con sonner de shadcn/ui.
 */

import { toast as sonnerToast } from "sonner"

export type ToastType = "success" | "error" | "warning" | "info"

interface ToastOptions {
  title: string
  message?: string
  duration?: number
}

/**
 * Muestra un toast de éxito
 */
export function showSuccessToast(options: ToastOptions) {
  const { title, message, duration = 4000 } = options
  
  sonnerToast.success(title, {
    description: message,
    duration,
  })
}

/**
 * Muestra un toast de error
 */
export function showErrorToast(options: ToastOptions) {
  const { title, message, duration = 4000 } = options
  
  sonnerToast.error(title, {
    description: message,
    duration,
  })
}

/**
 * Muestra un toast de advertencia
 */
export function showWarningToast(options: ToastOptions) {
  const { title, message, duration = 4000 } = options
  
  sonnerToast.warning(title, {
    description: message,
    duration,
  })
}

/**
 * Muestra un toast informativo
 */
export function showInfoToast(options: ToastOptions) {
  const { title, message, duration = 4000 } = options
  
  sonnerToast.info(title, {
    description: message,
    duration,
  })
}

/**
 * Muestra un toast genérico (para compatibilidad con código existente)
 */
export function showToast(type: ToastType, options: ToastOptions) {
  switch (type) {
    case "success":
      showSuccessToast(options)
      break
    case "error":
      showErrorToast(options)
      break
    case "warning":
      showWarningToast(options)
      break
    case "info":
      showInfoToast(options)
      break
  }
}

// Re-export toast para uso directo si es necesario
export { sonnerToast as toast }
