"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Trash2, Send, Lightbulb } from "lucide-react"

interface ChatInputCardProps {
  onSubmit?: (instruction: string) => void
  onClear?: () => void
  placeholder?: string
  isLoading?: boolean
  isDisabled?: boolean
  maxLength?: number
}

const SUGGESTED_INSTRUCTIONS = [
  "incluir descuento por volumen del 10%",
  "agregar costos de mantenimiento anual",
  "incluir garantía extendida de 2 años",
  "aplicar descuento por pago anticipado",
  "agregar costo de instalación especializada",
  "incluir training para 5 usuarios",
  "considerar precio especial por ser cliente frecuente"
]

export default function ChatInputCard({
  onSubmit,
  onClear,
  placeholder = "Ej: 'incluir descuento por volumen', 'agregar costos de mantenimiento', 'aplicar descuento por pago anticipado'...",
  isLoading = false,
  isDisabled = false,
  maxLength = 500
}: ChatInputCardProps) {
  
  const [instruction, setInstruction] = useState("")
  const [appliedInstructions, setAppliedInstructions] = useState<string[]>([])

  const handleSubmit = () => {
    const trimmedInstruction = instruction.trim()
    if (!trimmedInstruction || isLoading || isDisabled) return

    // Add to applied instructions
    setAppliedInstructions(prev => [...prev, trimmedInstruction])
    
    // Call parent submit handler
    if (onSubmit) {
      onSubmit(trimmedInstruction)
    }
    
    // Clear input
    setInstruction("")
  }

  const handleClear = () => {
    setInstruction("")
    setAppliedInstructions([])
    if (onClear) {
      onClear()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInstruction(suggestion)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const removeAppliedInstruction = (index: number) => {
    setAppliedInstructions(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Card className={isDisabled ? "opacity-50" : ""}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-xl">💬</span>
          Instrucciones Personalizadas
        </CardTitle>
        <CardDescription>
          Agrega requerimientos específicos que se incluirán en la generación del presupuesto
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Applied Instructions */}
        {appliedInstructions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Instrucciones Aplicadas:
            </h4>
            <div className="flex flex-wrap gap-2">
              {appliedInstructions.map((instruction, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-blue-100 text-blue-800 text-xs px-3 py-1 flex items-center gap-1"
                >
                  {instruction}
                  <button
                    onClick={() => removeAppliedInstruction(index)}
                    className="ml-1 hover:text-blue-600"
                    disabled={isDisabled}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Text Input */}
        <div className="space-y-2">
          <Textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading || isDisabled}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Presiona Ctrl+Enter para enviar</span>
            <span>{instruction.length}/{maxLength}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!instruction.trim() || isLoading || isDisabled}
            className="gap-2 flex-1"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⚙️</span>
                Aplicando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Aplicar
              </>
            )}
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            disabled={!instruction.trim() && appliedInstructions.length === 0 || isLoading || isDisabled}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Limpiar
          </Button>
        </div>

        {/* Suggestions */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <h4 className="text-sm font-medium text-gray-700">
              Sugerencias:
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUGGESTED_INSTRUCTIONS.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isDisabled}
                className="text-left text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💡 {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>💡 Tip:</strong> Sé específico en tus instrucciones. Por ejemplo: 
            "aplicar descuento del 15% por ser cliente frecuente" en lugar de solo "descuento".
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
