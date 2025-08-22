"use client"

import type React from "react"
// This patch enables multiple file uploads, list preview and removal.
import { useState, useRef, useEffect } from "react"
import { Upload, FileText, AlertCircle, CheckCircle, Wifi, WifiOff, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { api, type RFXRequest, type RFXResponse, APIError, useAPICall } from "@/lib/api"

interface FileUploaderProps {
  onFileProcessed: (text: string) => void
  onRFXProcessed: (data: RFXResponse) => void
  isLoading: boolean
}

export default function FileUploader({ onFileProcessed, onRFXProcessed, isLoading }: FileUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isFileSelected, setIsFileSelected] = useState(false)
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const fileInputRef = useRef<HTMLInputElement>(null)
  // NEW: keep selected files in state so we can remove them
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  
  // Use the new API error handler
  const { handleAPIError } = useAPICall()

  // Check service status on component mount
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

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("🔍 DEBUG: handleFileChange called")
    const files = Array.from(e.target.files ?? [])
    setFileError(null)
    if (files.length === 0) {
      setIsFileSelected(false)
      return
    }
    // Merge new files with existing, dedupe by name+size+lastModified
    setSelectedFiles(prev => {
      const merged = [...prev]
      for (const f of files) {
        const exists = merged.some(m => m.name === f.name && m.size === f.size && m.lastModified === f.lastModified)
        if (!exists) merged.push(f)
      }
      setIsFileSelected(merged.length > 0)
      setFileName(merged.length === 1 ? merged[0].name : `${merged.length} archivos seleccionados`)
      return merged
    })
    // Reset input so user can re-select the same file again if needed
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleProcessFile = async () => {
    console.log("🎯 DEBUG: handleProcessFile called with fileName(s):", fileName)
    if (!selectedFiles || selectedFiles.length === 0) {
      setFileError("No hay archivo seleccionado")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setIsFileSelected(false)
    setFileError("")

    try {
      // Use files from state (supports removal before upload)
      for (const f of selectedFiles) if (f.size === 0) throw new Error(`El archivo "${f.name}" está vacío`)

      const rfxId = `RFX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Build FormData with files[]
      const form = new FormData()
      form.append("id", rfxId)
      form.append("tipo_rfx", "catering")
      for (const f of selectedFiles) form.append("files", f)

      console.log("📤 Enviando archivo al servicio RFX:", {
        files: selectedFiles.map(f => ({ name: f.name, sizeMB: (f.size/1024/1024).toFixed(2) })), rfxId, tipo: "catering"
      })

      // Simulate upload progress with more realistic progression
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval)
            return 85
          }
          return prev + Math.random() * 15 + 5
        })
      }, 300)

      // Ensure api.processRFX can handle FormData (see API helper change below).
      const response = await api.processRFX(form as any)

      clearInterval(progressInterval)
      setUploadProgress(100)

      console.log("📥 Respuesta del servicio RFX:", response)

      // Check if the response was successful
      if (response.status === "success") {
        // Call the parent component callbacks
        onRFXProcessed(response)
        onFileProcessed("Documento RFX procesado exitosamente con IA")
        
        console.log("✅ RFX procesado exitosamente:", {
          rfxId: response.data?.id,
          solicitante: response.data?.requester_name || response.data?.nombre_cliente || response.data?.nombre_solicitante,
          productos: (response.data?.products || response.data?.productos || []).length,
          propuestaId: response.propuesta_id
        })
      } else {
        throw new Error(response.error || response.message || "Error al procesar el documento RFX")
      }
    } catch (error) {
      console.error("❌ Error processing RFX:", error)
      
      // Use the enhanced error handler
      const errorInfo = handleAPIError(error)
      
      // Set user-friendly error message based on error type
      let userMessage = "Error al procesar el documento RFX"
      
      if (error instanceof APIError) {
        switch (error.status) {
          case 400:
            userMessage = "El archivo no es válido o faltan datos requeridos. Verifique que sea un PDF, DOCX o TXT válido."
            break
          case 413:
            userMessage = "El archivo es demasiado grande. El tamaño máximo permitido es 16MB."
            break
          case 422:
            userMessage = "No se pudo extraer información del documento. Asegúrese de que contenga texto legible."
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
      
      setFileError(userMessage)
      setIsFileSelected(true) // Allow user to try again
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Service Status Indicator */}
          <div className="w-full mb-2">
            <div className="flex items-center justify-center gap-2 text-xs">
              {serviceStatus === 'checking' && (
                <>
                  <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-600 rounded-full"></div>
                  <span className="text-gray-500">Verificando servicio RFX...</span>
                </>
              )}
              {serviceStatus === 'online' && (
                <>
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">Servicio RFX conectado</span>
                </>
              )}
              {serviceStatus === 'offline' && (
                <>
                  <WifiOff className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">Servicio RFX no disponible</span>
                </>
              )}
            </div>
          </div>

          <div className="rounded-full bg-blue-100 p-3">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold">📄 Procesador RFX con IA</h2>
          <p className="text-sm text-gray-500 text-center max-w-md">
            Sube un documento RFx (PDF, DOCX o TXT) para procesarlo automáticamente con inteligencia artificial. 
            El sistema extraerá productos, fechas, información del solicitante y empresa, y generará una propuesta comercial personalizada.
          </p>

          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
            multiple
            accept=".pdf,.doc,.docx,.txt,.xlsx,.csv,.png,.jpg,.jpeg,.tiff,.zip"
          />

        {/* NEW: Selected files list with remove buttons */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <ul className="divide-y divide-gray-200 rounded-md border">
              {selectedFiles.map(f => {
                const key = `${f.name}-${f.lastModified}-${f.size}`
                const sizeMB = (f.size / 1024 / 1024).toFixed(2)
                return (
                  <li key={key} className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{f.name}</span>
                      <span className="text-xs text-gray-500">({sizeMB} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFiles(prev => prev.filter(m => !(m.name === f.name && m.size === f.size && m.lastModified === f.lastModified)))
                        if (fileInputRef.current) fileInputRef.current.value = ""
                        const nextLen = selectedFiles.length - 1
                        setIsFileSelected(nextLen > 0)
                        setFileName(nextLen === 1 ? selectedFiles[0]?.name ?? "" : (nextLen > 1 ? `${nextLen} archivos seleccionados` : ""))
                      }}
                      className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                      aria-label={`Eliminar ${f.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                )
              })}
            </ul>
            {selectedFiles.length > 1 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFiles([])
                    setIsFileSelected(false)
                    setFileName("")
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  className="text-xs underline"
                >
                  Quitar todos
                </button>
              </div>
            )}
          </div>
        )}

          {fileError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          )}

          {isUploading ? (
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs">
                <span>🤖 Procesando RFX: {fileName}</span>
                <span>{uploadProgress.toFixed(0)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-center text-gray-500">Extrayendo datos con IA...</p>
            </div>
          ) : fileName && (isLoading || isUploading) ? (
            <div className="w-full space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>{fileName}</span>
              </div>
              <div className="flex justify-center">
                <Button disabled className="w-40">
                  <span className="animate-pulse">{isUploading ? "🤖 Procesando RFX..." : "📊 Analizando..."}</span>
                </Button>
              </div>
            </div>
          ) : fileName && isFileSelected ? (
            <div className="w-full space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>{fileName}</span>
              </div>
              <div className="flex justify-center gap-2">
                <Button 
                  onClick={handleProcessFile} 
                  className="bg-black hover:bg-black-700 text-white"
                  disabled={serviceStatus === 'offline'}
                >
                  Procesar RFX con IA
                </Button>
                <Button variant="outline" onClick={handleButtonClick} className="bg-transparent">
                  Cambiar archivo
                </Button>
              </div>
              {serviceStatus === 'offline' && (
                <p className="text-xs text-red-500 text-center">
                  El servicio RFX no está disponible. Verifique la conexión.
                </p>
              )}
            </div>
          ) : fileName ? (
            <div className="w-full space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>{fileName}</span>
              </div>
              <div className="flex justify-center">
                <Button variant="outline" onClick={handleButtonClick} className="mr-2 bg-transparent">
                  Cambiar archivo
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={handleButtonClick} className="gap-2">
              <Upload className="h-4 w-4" />
              Seleccionar archivos
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
