"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

interface TemplateOption {
  id: string
  name: string
  emoji: string
  description: string
  tone: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  is_custom: boolean
}

interface TemplateSelectorProps {
  selectedTemplate: string
  onSelectTemplate: (templateId: string) => void
  disabled?: boolean
}

const FALLBACK_TEMPLATES: TemplateOption[] = [
  {
    id: "custom",
    name: "Personalizado",
    emoji: "🎨",
    description: "Usa tu branding personalizado (logo, colores, estilo propio)",
    tone: "según branding del usuario",
    colors: { primary: "#6366f1", secondary: "#8b5cf6", accent: "#a78bfa" },
    is_custom: true,
  },
  {
    id: "corporate",
    name: "Corporativo",
    emoji: "🏢",
    description: "Diseño formal y profesional para empresas",
    tone: "formal, profesional",
    colors: { primary: "#2c3e50", secondary: "#34495e", accent: "#3498db" },
    is_custom: false,
  },
  {
    id: "wedding",
    name: "Boda",
    emoji: "💒",
    description: "Diseño elegante y romántico para bodas",
    tone: "elegante, romántico",
    colors: { primary: "#d4af37", secondary: "#8b7355", accent: "#e8b4b8" },
    is_custom: false,
  },
  {
    id: "celebration",
    name: "Celebración",
    emoji: "🎉",
    description: "Diseño festivo para cumpleaños y fiestas",
    tone: "festivo, alegre",
    colors: { primary: "#ff6b6b", secondary: "#4ecdc4", accent: "#ffe66d" },
    is_custom: false,
  },
  {
    id: "event",
    name: "Evento",
    emoji: "🎪",
    description: "Diseño moderno para conferencias y eventos",
    tone: "moderno, dinámico",
    colors: { primary: "#5d5fef", secondary: "#9b9bff", accent: "#ff7b7b" },
    is_custom: false,
  },
  {
    id: "invoice",
    name: "Factura",
    emoji: "📄",
    description: "Diseño minimalista estilo cotización formal",
    tone: "minimalista, limpio",
    colors: { primary: "#000000", secondary: "#666666", accent: "#0066cc" },
    is_custom: false,
  },
]

export function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
  disabled = false,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateOption[]>(FALLBACK_TEMPLATES)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
        const res = await fetch(`${baseUrl}/api/templates`)
        if (res.ok) {
          const json = await res.json()
          if (json.data && json.data.length > 0) {
            setTemplates(json.data)
          }
        }
      } catch {
        // Use fallback templates silently
      }
    }
    fetchTemplates()
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">
          Estilo del Presupuesto
        </h4>
        <Badge variant="outline" className="text-xs">
          {templates.find((t) => t.id === selectedTemplate)?.name || "Personalizado"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.id
          return (
            <Card
              key={template.id}
              onClick={() => !disabled && onSelectTemplate(template.id)}
              className={`relative cursor-pointer transition-all p-3 ${
                disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"
              } ${
                isSelected
                  ? "ring-2 ring-primary border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
            >
              {isSelected && (
                <div className="absolute top-1.5 right-1.5">
                  <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{template.emoji}</span>
                  <span className="text-xs font-semibold truncate">{template.name}</span>
                </div>

                <div className="flex gap-1">
                  {!template.is_custom &&
                    Object.values(template.colors).map((color, i) => (
                      <div
                        key={i}
                        className="h-2.5 w-2.5 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  {template.is_custom && (
                    <span className="text-[10px] text-muted-foreground italic">
                      Tu branding
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                  {template.description}
                </p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
