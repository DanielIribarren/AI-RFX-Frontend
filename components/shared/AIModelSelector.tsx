"use client"

import { useState } from "react"
import { ChevronDown, Bot, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface AiModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
}

const AI_MODELS = [
  {
    id: "chatgpt-4o",
    name: "ChatGPT-4o",
    provider: "OpenAI",
    description: "Advanced language model with superior reasoning",
    color: "bg-green-500",
  },
  {
    id: "gemini",
    name: "Gemini",
    provider: "Google",
    description: "Multimodal AI with strong analytical capabilities",
    color: "bg-primary-light",
  },
]

export function AiModelSelector({ selectedModel, onModelChange }: AiModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentModel = AI_MODELS.find((model) => model.id === selectedModel) || AI_MODELS[0]

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 px-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-muted focus:bg-muted focus:text-gray-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${currentModel.color}`} />
            <span>{currentModel.name}</span>
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-2">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Select AI Model</div>
        {AI_MODELS.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => handleModelSelect(model.id)}
            className="flex items-start gap-3 p-3 cursor-pointer hover:bg-secondary rounded-md"
          >
            <div className="flex items-center gap-2 flex-1">
              <div className={`w-2 h-2 rounded-full ${model.color} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{model.name}</span>
                  <span className="text-xs text-muted-foreground">{model.provider}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{model.description}</p>
              </div>
            </div>
            {selectedModel === model.id && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
          </DropdownMenuItem>
        ))}
        <div className="border-t border-gray-100 mt-2 pt-2">
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            <Bot className="h-3 w-3 inline mr-1" />
            AI model will be used for RFX analysis and proposal generation
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
