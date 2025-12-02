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
import type { 
  ChatMessage, 
  RFXChange, 
  ChatResponse, 
  RFXUpdateChatPanelProps 
} from "./types"

export default function RFXUpdateChatPanel({
  isOpen,
  onClose,
  rfxId,
  rfxData,
  onUpdate
}: RFXUpdateChatPanelProps) {
  // ==================== ESTADO ====================
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ==================== EFECTOS ====================
  
  // Cargar historial al abrir
  useEffect(() => {
    if (isOpen && messages.length === 0) {
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
      const response = await api.chat.getHistory(rfxId)
      
      if (response.messages && response.messages.length === 0) {
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
        setMessages(response.messages || [])
      }
    } catch (error) {
      console.error("Error loading chat history:", error)
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

      // Agregar respuesta de la IA
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.message,
        timestamp: new Date().toISOString(),
        metadata: {
          confidence: response.confidence,
          changes: response.changes,
          requiresConfirmation: response.requires_confirmation,
          options: response.options
        }
      }

      setMessages(prev => [...prev, assistantMessage])

      // ⭐ APLICAR CAMBIOS INMEDIATAMENTE (si no requiere confirmación)
      if (response.changes && response.changes.length > 0 && !response.requires_confirmation) {
        onUpdate(response.changes)
        toast.success(`✅ ${response.changes.length} cambio(s) aplicado(s)`, {
          description: response.changes.map(c => c.description).join(', ')
        })
      }

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

  // ==================== RENDER ====================
  
  if (!isOpen) return null

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-screen bg-white border-l shadow-2xl transition-all duration-300 z-50",
        isMinimized ? "w-16" : "w-[30%]",
        "flex flex-col"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💬</span>
          {!isMinimized && (
            <div>
              <h3 className="font-semibold text-gray-900">Actualizar RFX</h3>
              <p className="text-xs text-gray-500">Asistente con IA</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
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
          <ScrollArea className="flex-1 p-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={cn(
                    "flex animate-slide-down",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}>
                    <div className={cn(
                      "max-w-[80%] rounded-lg p-3 shadow-sm",
                      message.role === "user" 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-100 text-gray-900"
                    )}>
                      {/* Contenido del mensaje */}
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      
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
                              className="w-full justify-start bg-white hover:bg-gray-50"
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
                        <div className="mt-2 text-xs opacity-75">
                          Confianza: {Math.round(message.metadata.confidence * 100)}%
                        </div>
                      )}
                      
                      {/* Timestamp */}
                      <div className={cn(
                        "text-xs mt-1",
                        message.role === "user" ? "text-blue-100" : "text-gray-500"
                      )}>
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
                  <div className="flex justify-start animate-slide-down">
                    <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-gray-900 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-xs text-gray-500">Procesando...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t bg-gray-50">
            {/* Archivos adjuntos preview */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-sm">
                    <Paperclip className="h-3 w-3" />
                    <span className="max-w-[100px] truncate">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje... (Shift+Enter para nueva línea)"
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={isTyping}
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping}
                  title="Adjuntar archivo"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  disabled={!inputValue.trim() || isTyping}
                  onClick={handleSendMessage}
                  title="Enviar mensaje"
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
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
