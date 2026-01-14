"use client"

import { useState, useRef, useEffect } from "react"
import { Check, X, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

interface EditableTitleProps {
  title: string
  onSave: (newTitle: string) => Promise<void>
  className?: string
  disabled?: boolean
}

export function EditableTitle({ 
  title, 
  onSave, 
  className,
  disabled = false 
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(title)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync with external title changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(title)
    }
  }, [title, isEditing])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    const trimmedValue = editValue.trim()
    
    // Don't save if empty or unchanged
    if (!trimmedValue || trimmedValue === title) {
      setIsEditing(false)
      setEditValue(title)
      return
    }

    setIsSaving(true)
    try {
      await onSave(trimmedValue)
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving title:", error)
      setEditValue(title) // Revert on error
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(title)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  if (disabled) {
    return (
      <h1 className={cn("text-3xl font-bold text-gray-900", className)}>
        {title}
      </h1>
    )
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
          className={cn(
            "text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-primary-light outline-none",
            "focus:border-primary transition-colors",
            isSaving && "opacity-50 cursor-not-allowed",
            className
          )}
          style={{ width: `${Math.max(editValue.length * 20, 200)}px` }}
        />
        {isSaving && (
          <div className="text-sm text-muted-foreground">Guardando...</div>
        )}
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2">
      <h1 
        className={cn(
          "text-3xl font-bold text-gray-900 cursor-pointer hover:text-primary transition-colors",
          className
        )}
        onClick={() => !disabled && setIsEditing(true)}
      >
        {title}
      </h1>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
        title="Editar título"
      >
        <Pencil className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  )
}
