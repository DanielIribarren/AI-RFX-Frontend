"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Paperclip, ArrowUp, X, FileText, ImageIcon, File, CheckCircle, WifiOff, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { api, type RFXResponse, APIError, useAPICall } from "@/lib/api"

interface RfxChatInputProps {
  onFileProcessed: (text: string) => void
  onRFXProcessed: (data: RFXResponse) => void
  isLoading: boolean
}

interface AttachedFile {
  file: File
  id: string
  preview?: string
}

export default function RfxChatInput({ onFileProcessed, onRFXProcessed, isLoading }: RfxChatInputProps) {
  const [message, setMessage] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [serviceStatus, setServiceStatus] = useState<"checking" | "online" | "offline">("checking")

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use the API error handler from the existing system
  const { handleAPIError } = useAPICall()

  // Check service status on component mount (like in FileUploader)
  useEffect(() => {
    const checkServiceHealth = async () => {
      try {
        await api.healthCheck()
        setServiceStatus('online')
      } catch (error) {
        console.warn('⚠️ RFX Service offline:', error)
        setServiceStatus('offline')
      }
    }

    checkServiceHealth()
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"
    }
  }, [message])

  // Handle file attachment
  const handleFileAttach = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("🔍 DEBUG: handleFileChange called")
    const files = Array.from(e.target.files || [])
    setError(null)

    if (files.length === 0) return

    // Process new files and merge with existing ones
    files.forEach((file) => {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const attachedFile: AttachedFile = { file, id }

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setAttachedFiles((prev) => prev.map((f) => (f.id === id ? { ...f, preview: e.target?.result as string } : f)))
        }
        reader.readAsDataURL(file)
      }

      // Check for existing files to avoid duplicates
      setAttachedFiles((prev) => {
        const exists = prev.some(f => 
          f.file.name === file.name && 
          f.file.size === file.size && 
          f.file.lastModified === file.lastModified
        )
        if (!exists) {
          return [...prev, attachedFile]
        }
        return prev
      })
    })

    // Reset input so user can re-select the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (file.type.includes("pdf")) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const canSubmit = () => {
    return (message.trim().length > 0 || attachedFiles.length > 0) && !isProcessing && !isLoading && serviceStatus === 'online'
  }

  const handleSubmit = async () => {
    console.log("🎯 DEBUG: handleSubmit called")
    if (!canSubmit()) return

    setIsProcessing(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Check for empty files
      for (const attachedFile of attachedFiles) {
        if (attachedFile.file.size === 0) {
          throw new Error(`El archivo "${attachedFile.file.name}" está vacío`)
        }
      }

      // Generate RFX ID
      const rfxId = `RFX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Build FormData with files and message (similar to FileUploader)
      const form = new FormData()
      form.append("id", rfxId)
      form.append("tipo_rfx", "catering")
      
      // Add text content if provided
      if (message.trim()) {
        form.append("contenido_extraido", message.trim())
      }
      
      // Add all attached files
      for (const attachedFile of attachedFiles) {
        form.append("files", attachedFile.file)
      }

      console.log("📤 Enviando solicitud RFX al servicio:", {
        rfxId,
        hasMessage: !!message.trim(),
        fileCount: attachedFiles.length,
        files: attachedFiles.map(af => ({ 
          name: af.file.name, 
          sizeMB: (af.file.size/1024/1024).toFixed(2) 
        })),
        tipo: "catering"
      })

      // Simulate upload progress with more realistic progression (like FileUploader)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval)
            return 85
          }
          return prev + Math.random() * 15 + 5
        })
      }, 300)

      // Call the real API
      const response = await api.processRFX(form as any)

      clearInterval(progressInterval)
      setUploadProgress(100)

      console.log("📥 Respuesta del servicio RFX:", response)

      // Check if the response was successful
      if (response.status === "success") {
        // Call the parent component callbacks
        onRFXProcessed(response)
        onFileProcessed(message.trim() || "Documento RFX procesado exitosamente con IA")
        
        console.log("✅ RFX procesado exitosamente:", {
          rfxId: response.data?.id,
          solicitante: response.data?.requester_name || response.data?.nombre_cliente || response.data?.nombre_solicitante,
          productos: (response.data?.products || response.data?.productos || []).length,
          propuestaId: response.propuesta_id
        })

        // Reset form on success
        setMessage("")
        setAttachedFiles([])
      } else {
        throw new Error(response.error || response.message || "Error al procesar el documento RFX")
      }
    } catch (error) {
      console.error("❌ Error processing RFX:", error)
      
      // Use the enhanced error handler from FileUploader
      const errorInfo = handleAPIError(error)
      
      // Set user-friendly error message based on error type
      let userMessage = "Error al procesar la solicitud RFX"
      
      if (error instanceof APIError) {
        switch (error.status) {
          case 400:
            userMessage = "Los datos no son válidos o faltan campos requeridos. Verifique que los archivos sean PDF, DOCX o TXT válidos."
            break
          case 413:
            userMessage = "Uno o más archivos son demasiado grandes. El tamaño máximo permitido es 16MB por archivo."
            break
          case 422:
            userMessage = "No se pudo extraer información del contenido. Asegúrese de que los documentos contengan texto legible."
            break
          case 500:
            userMessage = "Error interno del servidor. Por favor, inténtelo más tarde."
            break
          case 0:
            userMessage = "Error de conexión. Verifique su conexión a internet y que el servidor esté funcionando."
            break
          default:
            userMessage = error.message || userMessage
        }
      } else if (error instanceof Error) {
        userMessage = error.message
      }
      
      setError(userMessage)
    } finally {
      setIsProcessing(false)
      setUploadProgress(0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Service Status Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs">
        {serviceStatus === 'checking' && (
          <>
            <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-600 rounded-full"></div>
            <span className="text-gray-500">Verificando servicio RFX...</span>
          </>
        )}
        {serviceStatus === "online" && (
          <>
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span className="text-green-600">Servicio RFX conectado</span>
          </>
        )}
        {serviceStatus === "offline" && (
          <>
            <WifiOff className="h-3 w-3 text-red-500" />
            <span className="text-red-600">Servicio RFX no disponible</span>
          </>
        )}
      </div>

      {/* Processing Progress */}
      {isProcessing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-800">🤖 Procesando RFX con IA...</span>
            </div>
            <Progress value={uploadProgress} className="w-full h-2" />
            <p className="text-xs text-blue-600 mt-1">Extrayendo información y generando propuesta comercial</p>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Input Card */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          {/* Attached Files Preview */}
          {attachedFiles.length > 0 && (
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((attachedFile) => (
                  <div
                    key={attachedFile.id}
                    className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {attachedFile.preview ? (
                      <img
                        src={attachedFile.preview || "/placeholder.svg"}
                        alt={attachedFile.file.name}
                        className="h-6 w-6 object-cover rounded"
                      />
                    ) : (
                      getFileIcon(attachedFile.file)
                    )}
                    <span className="max-w-[150px] truncate">{attachedFile.file.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {formatFileSize(attachedFile.file.size)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(attachedFile.id)}
                      className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {/* Clear all files button */}
              {attachedFiles.length > 1 && (
                <div className="flex justify-end mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAttachedFiles([])}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Quitar todos los archivos
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe tu RFX o adjunta documentos para procesarlos con IA..."
              className="min-h-[60px] max-h-[200px] resize-none border-0 shadow-none focus-visible:ring-0 text-base placeholder:text-gray-400"
              disabled={isProcessing || isLoading}
            />
          </div>

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between p-4 pt-0">
            <div className="flex items-center gap-2">
              {/* Attach Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFileAttach}
                disabled={isProcessing || isLoading}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              {/* File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.xlsx,.csv,.png,.jpg,.jpeg,.tiff,.zip"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Status Text */}
              {attachedFiles.length > 0 && (
                <span className="text-xs text-gray-500">
                  {attachedFiles.length} archivo{attachedFiles.length !== 1 ? "s" : ""} adjunto
                  {attachedFiles.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="h-8 w-8 p-0 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </Button>
          </div>

          {/* Service Offline Warning */}
          {serviceStatus === 'offline' && (
            <div className="px-4 pb-4">
              <Alert variant="destructive">
                <WifiOff className="h-4 w-4" />
                <AlertDescription>
                  El servicio RFX no está disponible. Verifique la conexión.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Helper Text */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Puedes escribir instrucciones específicas y adjuntar documentos RFX (PDF, DOCX, TXT, imágenes, Excel)
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Presiona <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> para enviar,
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs ml-1">Shift + Enter</kbd> para nueva línea
        </p>
      </div>
    </div>
  )
}
