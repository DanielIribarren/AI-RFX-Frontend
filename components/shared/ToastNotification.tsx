"use client"

import { useEffect } from "react"
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "warning"

interface ToastNotificationProps {
  isOpen: boolean
  onClose: () => void
  type: ToastType
  title: string
  message?: string
  duration?: number
}

export function ToastNotification({
  isOpen,
  onClose,
  type,
  title,
  message,
  duration = 4000,
}: ToastNotificationProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-destructive" />,
    warning: <AlertCircle className="h-5 w-5 text-orange-600" />,
  }

  const styles = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-orange-50 border-orange-200",
  }

  const titleStyles = {
    success: "text-green-900",
    error: "text-red-900",
    warning: "text-orange-900",
  }

  const messageStyles = {
    success: "text-green-700",
    error: "text-red-700",
    warning: "text-orange-700",
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
      <div
        className={cn(
          "min-w-[320px] max-w-md rounded-lg border p-4 shadow-lg",
          styles[type]
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
          <div className="flex-1 min-w-0">
            <p className={cn("font-semibold text-sm", titleStyles[type])}>
              {title}
            </p>
            {message && (
              <p className={cn("mt-1 text-sm", messageStyles[type])}>
                {message}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
