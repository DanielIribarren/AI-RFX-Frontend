"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { X, Minimize2, Maximize2, Paperclip, Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useCredits } from "@/contexts/CreditsContext"
import { LowCreditsAlert } from "@/components/credits/LowCreditsAlert"
import type {
  ChatMessage,
  RFXChange,
  ChatResponse,
  RFXUpdateChatPanelProps
} from "./types"

// Costo de un mensaje de chat (según documentación)
const CHAT_MESSAGE_COST = 5

export default function RFXUpdateChatPanel({
  isOpen,
  onClose,
  rfxId,
  rfxData,
  onUpdate
}: RFXUpdateChatPanelProps) {
  // ==================== HOOKS ====================
  const { credits, checkCredits, refreshCredits } = useCredits()
  
  // ==================== ESTADO ====================
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Estado para redimensionamiento
  const [panelWidth, setPanelWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rfx-chat-panel-width')
      return saved ? parseInt(saved) : 440
    }
    return 440
  })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ==================== EFECTOS ====================

  // Cargar historial al abrir o cuando cambia el rfxId
  useEffect(() => {
    if (isOpen) {
      loadChatHistory()
    }
  }, [isOpen, rfxId])

  // Auto-scroll al último mensaje
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus en textarea al abrir
  useEffect(() => {
    if (isOpen && !isMinimized) {
      textareaRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  // ==================== FUNCIONES ====================

  const loadChatHistory = async () => {
    setIsLoadingHistory(true)
    try {
      console.log('📜 Loading chat history for RFX:', rfxId)
      const response = await api.chat.getHistory(rfxId)
      console.log('📥 Chat history response:', response)

      if (response.messages && response.messages.length === 0) {
        console.log('💬 No messages in history, showing welcome message')
        // Mensaje de bienvenida
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: `¡Hola! Soy tu asistente de actualización de RFX.

Puedo ayudarte a:
• Agregar productos nuevos
• Modificar cantidades o precios
• Cambiar fecha, lugar o cliente
• Eliminar productos
• Procesar archivos con cambios

Escribe tu solicitud abajo ↓`,
          timestamp: new Date().toISOString(),
          metadata: { type: "welcome" }
        }])
      } else {
        console.log(`✅ Loaded ${response.messages?.length || 0} messages from history`)
        setMessages(response.messages || [])
      }
    } catch (error) {
      console.error("❌ Error loading chat history:", error)
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "¡Hola! ¿En qué puedo ayudarte con este RFX?",
        timestamp: new Date().toISOString()
      }])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachedFiles.length === 0) return
    if (isTyping) return

    // Crear mensaje del usuario
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
      files: attachedFiles.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      }))
    }

    // Agregar mensaje del usuario inmediatamente
    setMessages(prev => [...prev, userMessage])

    // Guardar valores y limpiar input
    const messageToSend = inputValue.trim()
    const filesToSend = [...attachedFiles]
    setInputValue("")
    setAttachedFiles([])

    // Mostrar indicador de "typing"
    setIsTyping(true)

    try {
      // Llamar al backend (IA procesa)
      const response: ChatResponse = await api.chat.send(
        rfxId,
        messageToSend,
        {
          current_products: rfxData.productos || [],
          current_total: rfxData.total || 0,
          delivery_date: rfxData.fechaEntrega,
          delivery_location: rfxData.lugarEntrega,
          client_name: rfxData.solicitante,
          client_email: rfxData.emailSolicitante
        },
        filesToSend
      )

      // Debug: Log de la respuesta completa
      console.log('📥 Chat response received:', response);
      console.log('📝 Message field:', response.message);
      console.log('🔍 Response type:', typeof response);
      
      // Agregar respuesta de la IA
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.message || JSON.stringify(response, null, 2),
        timestamp: new Date().toISOString(),
        metadata: {
          confidence: response.confidence,
          changes: response.changes,
          requiresConfirmation: response.requires_confirmation,
          options: response.options
        }
      }

      console.log('💬 Assistant message content:', assistantMessage.content);
      setMessages(prev => [...prev, assistantMessage])

      // ⭐ APLICAR CAMBIOS INMEDIATAMENTE (si no requiere confirmación)
      if (response.changes && response.changes.length > 0 && !response.requires_confirmation) {
        onUpdate(response.changes)
        toast.success(`✅ ${response.changes.length} cambio(s) aplicado(s)`, {
          description: response.changes.map(c => c.description).join(', ')
        })
      }

      // Refrescar créditos después de enviar mensaje
      await refreshCredits()

    } catch (error) {
      console.error("Error sending message:", error)

      // Mensaje de error
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `❌ Lo siento, ocurrió un error al procesar tu solicitud.

${error instanceof Error ? error.message : "Error desconocido"}

Por favor, intenta de nuevo o reformula tu solicitud.`,
        timestamp: new Date().toISOString(),
        metadata: { type: "error" }
      }

      setMessages(prev => [...prev, errorMessage])
      toast.error("Error al procesar mensaje")
    } finally {
      setIsTyping(false)
    }
  }

  const handleConfirmOption = async (optionValue: string, context: any) => {
    setIsTyping(true)

    try {
      const response = await api.chat.confirm(rfxId, optionValue, context)

      // Agregar mensaje de confirmación
      const confirmMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: `Opción seleccionada: ${optionValue}`,
        timestamp: new Date().toISOString()
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.message,
        timestamp: new Date().toISOString(),
        metadata: {
          confidence: response.confidence,
          changes: response.changes
        }
      }

      setMessages(prev => [...prev, confirmMessage, assistantMessage])

      // Aplicar cambios
      if (response.changes && response.changes.length > 0) {
        onUpdate(response.changes)
        toast.success(`✅ ${response.changes.length} cambio(s) aplicado(s)`)
      }

    } catch (error) {
      console.error("Error confirming option:", error)
      toast.error("Error al confirmar opción")
    } finally {
      setIsTyping(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const files = Array.from(e.target.files)

    // Validar tamaño (max 10MB por archivo)
    const invalidFiles = files.filter(f => f.size > 10 * 1024 * 1024)
    if (invalidFiles.length > 0) {
      toast.error("Algunos archivos son muy grandes (máx 10MB)")
      return
    }

    // Validar tipo
    const validTypes = ['.pdf', '.jpg', '.jpeg', '.png']
    const invalidTypes = files.filter(f =>
      !validTypes.some(type => f.name.toLowerCase().endsWith(type))
    )
    if (invalidTypes.length > 0) {
      toast.error("Solo se permiten archivos PDF, JPG y PNG")
      return
    }

    setAttachedFiles(files)
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // ==================== REDIMENSIONAMIENTO ====================

  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true)
    setResizeStartX(e.clientX)
    setResizeStartWidth(panelWidth)
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return

    const deltaX = resizeStartX - e.clientX
    const newWidth = Math.max(320, Math.min(800, resizeStartWidth + deltaX))
    setPanelWidth(newWidth)
  }

  const handleResizeEnd = () => {
    if (!isResizing) return

    setIsResizing(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    
    // Guardar en localStorage
    localStorage.setItem('rfx-chat-panel-width', panelWidth.toString())
  }

  // Efecto para manejar mouse events globales
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing, resizeStartX, resizeStartWidth, panelWidth])

  // ==================== RENDER ====================

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "fixed right-0 top-0 bottom-0 bg-background border-l transition-all duration-300 z-50 flex flex-col",
        isMinimized ? "w-16" : ""
      )}
      style={isMinimized ? {} : { width: panelWidth }}
    >
      {/* Handle de redimensionamiento */}
      {!isMinimized && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 bg-transparent hover:bg-accent cursor-ew-resize z-10"
          onMouseDown={handleResizeStart}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b shrink-0">
        {!isMinimized && (
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Actualizar RFX</h3>
            <span className="text-xs text-muted-foreground">Asistente con IA</span>
          </div>
        )}

        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <ScrollArea className="flex-1 px-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4 py-4 max-w-full">
                {messages.map((message) => (
                  <div key={message.id} className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}>
                    <div className={cn(
                      "max-w-full rounded-2xl px-4 py-2.5 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}>
                      {/* Contenido del mensaje */}
                      <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>

                      {/* Archivos adjuntos */}
                      {message.files && message.files.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.files.map((file, idx) => (
                            <div key={idx} className="text-xs opacity-75 flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              {file.name}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Opciones de confirmación */}
                      {message.metadata?.requiresConfirmation && message.metadata?.options && (
                        <div className="mt-3 space-y-2">
                          {message.metadata.options.map((option) => (
                            <Button
                              key={option.value}
                              variant="outline"
                              size="sm"
                              className="w-full justify-start bg-background hover:bg-accent"
                              onClick={() => handleConfirmOption(option.value, option.context)}
                              disabled={isTyping}
                            >
                              <span className="mr-2">{option.emoji}</span>
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Metadata */}
                      {message.metadata?.confidence !== undefined && (
                        <div className="mt-2 text-xs opacity-60">
                          Confianza: {Math.round(message.metadata.confidence * 100)}%
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="text-xs mt-1.5 opacity-50">
                        {new Date(message.timestamp).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Indicador de typing */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-full rounded-2xl px-4 py-2.5 bg-muted">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-xs text-muted-foreground">Procesando...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t shrink-0">
            {/* Low Credits Alert */}
            {credits && !checkCredits(CHAT_MESSAGE_COST) && (
              <div className="mb-3">
                <LowCreditsAlert
                  currentCredits={credits.credits_available}
                  requiredCredits={CHAT_MESSAGE_COST}
                  variant="compact"
                />
              </div>
            )}

            {/* Archivos adjuntos preview */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-1.5 bg-muted px-2.5 py-1.5 rounded-md text-sm">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span className="max-w-[120px] truncate text-xs">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-end">
              <div className="relative flex-1">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje..."
                  className="min-h-[52px] max-h-[120px] resize-none pr-10 rounded-xl"
                  disabled={isTyping}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping}
                  title="Adjuntar archivo"
                  className="absolute right-2 bottom-2 h-7 w-7"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="icon"
                disabled={!inputValue.trim() || isTyping || (credits ? !checkCredits(CHAT_MESSAGE_COST) : false)}
                onClick={handleSendMessage}
                title={
                  credits && !checkCredits(CHAT_MESSAGE_COST)
                    ? "Créditos insuficientes"
                    : "Enviar mensaje"
                }
                className="h-[52px] w-[52px] rounded-xl shrink-0"
              >
                {isTyping ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </>
      )}
    </div>
  )
}
