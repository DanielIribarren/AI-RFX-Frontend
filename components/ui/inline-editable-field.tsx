"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Edit3, CheckCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface InlineEditableFieldProps {
  value: string | number
  onSave: (value: string | number) => Promise<void> | void
  type?: "text" | "number" | "textarea" | "email" | "tel" | "date"
  placeholder?: string
  className?: string
  label: string
  validate?: (value: string | number) => string | null
  disabled?: boolean
  originalText?: string
}

export default function InlineEditableField({
  value,
  onSave,
  type = "text",
  placeholder,
  className,
  label,
  validate,
  disabled = false,
  originalText
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value?.toString() || "")
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  const handleEdit = () => {
    if (disabled) return
    setIsEditing(true)
    setEditValue(value?.toString() || "")
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value?.toString() || "")
    setError(null)
  }

  const handleSave = async () => {
    // Built-in validation by type if no external validate provided
    const runValidation = (val: string | number): string | null => {
      if (validate) return validate(val)
      const str = String(val).trim()
      if (type === "email") {
        if (!str) return null
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(str) ? null : "Email inválido"
      }
      if (type === "tel") {
        if (!str) return null
        const phoneRegex = /^[+]?[-()\s\d]{7,}$/
        return phoneRegex.test(str) ? null : "Teléfono inválido"
      }
      if (type === "date") {
        if (!str) return null
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(str)) return "Formato de fecha inválido (YYYY-MM-DD)"
        const d = new Date(str)
        return isNaN(d.getTime()) ? "Fecha inválida" : null
      }
      if (type === "number") {
        const num = parseFloat(str)
        return isNaN(num) ? "Número inválido" : null
      }
      // text/textarea default
      return str.length > 200 ? "Texto demasiado largo (máx. 200 caracteres)" : null
    }

    const validationError = runValidation(type === "number" ? parseFloat(editValue) : editValue)
    if (validationError) {
      setError(validationError)
      setSaveStatus("error")
      return
    }

    setSaveStatus("saving")
    setError(null)

    try {
      const finalValue = type === "number" ? parseFloat(editValue) || 0 : editValue
      await onSave(finalValue)
      setIsEditing(false)
      setSaveStatus("saved")
      // brief visual confirmation
      setTimeout(() => setSaveStatus("idle"), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
      setSaveStatus("error")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && type !== "textarea") {
      handleSave()
    } else if (e.key === "Enter" && e.ctrlKey && type === "textarea") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  const displayValue = value || "Haz clic para editar..."
  const isEmpty = !value || value.toString().trim() === ""

  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <dt className="text-sm font-medium text-gray-700">{label}:</dt>
        </div>
        
        <div className="flex items-start gap-2">
          {type === "textarea" ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "flex-1 min-h-[80px] transition-colors duration-200",
                error ? "border-red-300 bg-red-50" : saveStatus === "saved" ? "border-green-300 bg-green-50" : saveStatus === "saving" ? "border-amber-300 bg-amber-50" : "border-gray-300 bg-white focus:border-blue-400 focus:ring-blue-200"
              )}
              disabled={saveStatus === "saving"}
              autoFocus
            />
          ) : (
            <Input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "flex-1 transition-colors duration-200",
                error ? "border-red-300 bg-red-50" : saveStatus === "saved" ? "border-green-300 bg-green-50" : saveStatus === "saving" ? "border-amber-300 bg-amber-50" : "border-gray-300 bg-white focus:border-blue-400 focus:ring-blue-200"
              )}
              disabled={saveStatus === "saving"}
              autoFocus
            />
          )}
          
          {/* Botones minimalistas según diseño */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Confirmar */}
            <Button
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm"
            >
              <CheckCircle className="h-3 w-3" />
            </Button>
            
            {/* Cancelar */}
            <Button
              onClick={handleCancel}
              disabled={saveStatus === "saving"}
              className="h-8 w-8 p-0 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 bg-white shadow-sm"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
        
        {type === "textarea" && (
          <p className="text-xs text-gray-500">
            Presiona Ctrl+Enter para guardar, Escape para cancelar
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <dt className="text-sm font-medium text-gray-700">{label}:</dt>
      </div>
      
      <div className="group border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors duration-200">
        <div className="py-4 px-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            {/* Valor editable */}
            <div 
              className="flex-1 flex items-center justify-between group-hover:bg-white/80 rounded-md px-2 py-1 -mx-2 -my-1 transition-colors duration-200 cursor-pointer"
              onClick={handleEdit}
            >
              <dd className={cn(
                "text-sm font-medium",
                isEmpty ? "text-gray-400" : "text-gray-900"
              )}>
                {displayValue}
              </dd>
              
              {/* Indicador de edición */}
              {!disabled && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs">
                    <Edit3 className="h-3 w-3" />
                    <span className="hidden sm:inline">Editar</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {originalText && (
        <div className="mt-1 text-xs text-gray-500 italic">
          Texto original: "{originalText.slice(0, 100)}{originalText.length > 100 ? '...' : ''}"
        </div>
      )}
    </div>
  )
}
