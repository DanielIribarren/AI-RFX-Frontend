"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Paperclip,
  ArrowUp,
  X,
  FileText,
  ImageIcon,
  File,
  CheckCircle,
  WifiOff,
  Loader2,
  AlertCircle,
  Search,
  Sparkles,
  ShoppingCart,
  BarChart3,
  Save,
  Bot,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { api, type RFXResponse, APIError, useAPICall } from "@/lib/api"

type StepState = "pending" | "active" | "done"
type StepId = "read" | "extract" | "ai" | "catalog" | "quality" | "save"

interface ProcessingStep {
  id: StepId
  label: string
  detail: string
  duration: number
}

const PROCESSING_STEPS: ProcessingStep[] = [
  {
    id: "read",
    label: "Leyendo documento",
    detail: "Analizando archivos adjuntos y contexto",
    duration: 500,
  },
  {
    id: "extract",
    label: "Extrayendo información del RFX",
    detail: "Detectando campos clave y estructura",
    duration: 700,
  },
  {
    id: "ai",
    label: "Identificando productos con IA",
    detail: "Relacionando requerimientos del evento",
    duration: 2400,
  },
  {
    id: "catalog",
    label: "Buscando precios en tu catálogo",
    detail: "Validando coincidencias por producto",
    duration: 1600,
  },
  {
    id: "quality",
    label: "Evaluando calidad",
    detail: "Verificando completitud y consistencia",
    duration: 900,
  },
  {
    id: "save",
    label: "Guardando propuesta",
    detail: "Registrando resultado en historial",
    duration: 700,
  },
]

const buildInitialStepStates = (): Record<StepId, StepState> =>
  PROCESSING_STEPS.reduce(
    (acc, step) => {
      acc[step.id] = "pending"
      return acc
    },
    {} as Record<StepId, StepState>
  )

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface RfxChatInputProps {
  onFileProcessed: (text: string) => void | Promise<void>
  onRFXProcessed: (data: RFXResponse) => void | Promise<void>
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
  const [stepStates, setStepStates] = useState<Record<StepId, StepState>>(buildInitialStepStates)
  const [catalogProducts, setCatalogProducts] = useState<string[]>([])
  const [rfxCode, setRfxCode] = useState<string>("")
  const [chipsVisible, setChipsVisible] = useState(0)
  const [qualityScore, setQualityScore] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [serviceStatus, setServiceStatus] = useState<"checking" | "online" | "offline">("checking")

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const simulationRunRef = useRef(0)
  const stepItemRefs = useRef<Record<StepId, HTMLDivElement | null>>({
    read: null,
    extract: null,
    ai: null,
    catalog: null,
    quality: null,
    save: null,
  })

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

  useEffect(() => {
    if (!isProcessing) {
      simulationRunRef.current += 1
      setStepStates(buildInitialStepStates())
      setCatalogProducts([])
      setRfxCode("")
      setChipsVisible(0)
      setQualityScore(null)
      return
    }

    const runId = simulationRunRef.current + 1
    simulationRunRef.current = runId

    const isCurrentRun = () => simulationRunRef.current === runId

    const runTimeline = async () => {
      setStepStates(buildInitialStepStates())
      setChipsVisible(0)
      setQualityScore(null)

      for (const step of PROCESSING_STEPS) {
        if (!isCurrentRun()) return

        setStepStates((prev) => ({ ...prev, [step.id]: "active" }))
        await sleep(step.duration)

        if (!isCurrentRun()) return
        setStepStates((prev) => ({ ...prev, [step.id]: "done" }))
      }
    }

    runTimeline()

    return () => {
      simulationRunRef.current += 1
    }
  }, [isProcessing])

  useEffect(() => {
    if (!isProcessing) {
      setChipsVisible(0)
      return
    }

    if (catalogProducts.length === 0) {
      setChipsVisible(0)
      return
    }

    let cancelled = false
    setChipsVisible(0)

    const animateChips = async () => {
      for (let index = 1; index <= catalogProducts.length; index++) {
        await sleep(85)
        if (cancelled) return
        setChipsVisible(index)
      }
    }

    animateChips()

    return () => {
      cancelled = true
    }
  }, [catalogProducts, isProcessing])

  const activeStepId = PROCESSING_STEPS.find((step) => stepStates[step.id] === "active")?.id ?? null

  useEffect(() => {
    if (!isProcessing || !activeStepId) return

    const activeStepNode = stepItemRefs.current[activeStepId]
    if (!activeStepNode) return

    activeStepNode.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
  }, [activeStepId, isProcessing])

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

  const getProductLabel = (product: any): string => {
    if (!product) return ""
    if (typeof product === "string") return product.trim()
    return String(
      product.product_name ||
      product.nombre ||
      product.name ||
      product.description ||
      ""
    ).trim()
  }

  const getExtractedProductsFromResponse = (response: RFXResponse): string[] => {
    const payload: any = response?.data || {}
    const fromProducts = Array.isArray(payload.products) ? payload.products : []
    const fromLegacyProducts = Array.isArray(payload.productos) ? payload.productos : []
    const fromRequested = Array.isArray(payload.requested_products) ? payload.requested_products : []

    const merged = [...fromProducts, ...fromLegacyProducts, ...fromRequested]
      .map(getProductLabel)
      .filter((name) => name.length > 0)

    return Array.from(new Set(merged)).slice(0, 30)
  }

  const normalizeScore = (value: unknown): number | null => {
    if (value === null || value === undefined) return null
    const parsed =
      typeof value === "string"
        ? Number(value.replace("%", "").trim())
        : Number(value)

    if (!Number.isFinite(parsed)) return null

    const normalized = parsed <= 1 ? parsed * 100 : parsed
    return Math.max(0, Math.min(100, Math.round(normalized)))
  }

  const getQualityScoreFromResponse = (response: RFXResponse): number | null => {
    const payload: any = response?.data || {}
    const metadata = payload.metadata_json || payload.metadatos || {}
    const validation = metadata.validation_status || {}
    const evaluationSummary = metadata.intelligent_evaluation?.execution_summary || {}

    const candidates = [
      payload.quality_score,
      metadata.quality_score,
      validation.completeness_ratio,
      validation.consolidated_score,
      evaluationSummary.consolidated_score,
      payload.requirements_confidence,
    ]

    for (const candidate of candidates) {
      const normalized = normalizeScore(candidate)
      if (normalized !== null) return normalized
    }

    return null
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

    try {
      // Check for empty files
      for (const attachedFile of attachedFiles) {
        if (attachedFile.file.size === 0) {
          throw new Error(`The file "${attachedFile.file.name}" is empty`)
        }
      }

      // ✅ FIX: Generate valid UUID v4 instead of custom format
      const rfxId = crypto.randomUUID()

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

      // Call the real API
      const response = await api.processRFX(form as any)

      console.log("📥 Respuesta del servicio RFX:", response)

      // Check if the response was successful
      if (response.status === "success") {
        const extractedProducts = getExtractedProductsFromResponse(response)
        const responseData: any = response.data || {}
        const resolvedRfxCode = String(
          responseData.rfx_code ||
          responseData.latest_proposal_code ||
          responseData.id ||
          ""
        )

        setCatalogProducts(extractedProducts)
        setRfxCode(resolvedRfxCode)
        setQualityScore(getQualityScoreFromResponse(response))
        setStepStates(
          PROCESSING_STEPS.reduce(
            (acc, step) => {
              acc[step.id] = "done"
              return acc
            },
            {} as Record<StepId, StepState>
          )
        )

        // Invalidar cache del sidebar para mostrar el nuevo RFX
        const SIDEBAR_CACHE_KEY = 'sidebar-recent-rfx'
        localStorage.removeItem(SIDEBAR_CACHE_KEY)
        console.log('🔄 Sidebar cache invalidated - new RFX will appear')
        
        // Call the parent component callbacks
        await sleep(450)
        await Promise.resolve(onRFXProcessed(response))
        await Promise.resolve(onFileProcessed(message.trim() || "Documento RFX procesado exitosamente con IA"))
        
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
      handleAPIError(error)
      
      // Set user-friendly error message based on error type
      let userMessage = "Error al procesar la solicitud RFX"
      
      if (error instanceof APIError) {
        switch (error.status) {
          case 400:
            // 🆕 Enhanced error message for file requirement
            if (error.message?.includes("File upload is required") || error.message?.includes("No file provided")) {
              userMessage = "A file is required by the backend. Attach an RFX document (PDF, DOCX, or TXT) to continue."
            } else {
              userMessage = "Input data is invalid or required fields are missing. Verify files are valid PDF, DOCX, or TXT."
            }
            break
          case 413:
            userMessage = "One or more files are too large. Maximum allowed size is 16MB per file."
            break
          case 422:
            userMessage = "Unable to extract information from the content. Make sure the documents contain readable text."
            break
          case 500:
            userMessage = "Internal server error. Please try again later."
            break
          case 0:
            userMessage = "Connection error. Check your internet connection and confirm the server is running."
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
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const getStepIcon = (stepId: StepId) => {
    switch (stepId) {
      case "read":
        return <FileText className="h-5 w-5" />
      case "extract":
        return <Search className="h-5 w-5" />
      case "ai":
        return <Sparkles className="h-5 w-5" />
      case "catalog":
        return <ShoppingCart className="h-5 w-5" />
      case "quality":
        return <BarChart3 className="h-5 w-5" />
      case "save":
        return <Save className="h-5 w-5" />
      default:
        return <File className="h-5 w-5" />
    }
  }

  const completedSteps = PROCESSING_STEPS.filter((step) => stepStates[step.id] === "done").length
  const progressValue = (completedSteps / PROCESSING_STEPS.length) * 100
  const productsMetric = catalogProducts.length > 0 ? `${catalogProducts.length} productos` : null
  const saveMetric = rfxCode || null
  const activeStepLabel = activeStepId ? PROCESSING_STEPS.find((step) => step.id === activeStepId)?.label : null

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 motion-fade-up">
      {/* Service Status Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs transition-[opacity,transform] duration-200 ease-out">
        {serviceStatus === 'checking' && (
          <>
            <div className="animate-spin h-3 w-3 border border-input border-t-blue-600 rounded-full"></div>
            <span className="text-muted-foreground">Checking RFX service...</span>
          </>
        )}
        {serviceStatus === "online" && (
          <>
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span className="text-green-600">RFX service connected</span>
          </>
        )}
        {serviceStatus === "offline" && (
          <>
            <WifiOff className="h-3 w-3 text-red-500" />
            <span className="text-destructive">RFX service unavailable</span>
          </>
        )}
      </div>

      {/* Agentic Processing View */}
      {isProcessing && (
        <div className="mx-auto w-full max-w-2xl">
          <Card className="border border-[#e9d5ff] bg-[#faf7ff] motion-enter shadow-sm">
            <CardContent className="p-0">
              <div className="p-4 border-b border-[#ede9fe]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-[#7c3aed] text-white flex items-center justify-center shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Procesando propuesta</h3>
                    <p className="text-xs text-gray-500">Extracción y propuesta asistida por IA</p>
                  </div>
                </div>
                <div className="rounded-full border border-[#bbf7d0] bg-[#dcfce7] px-3 py-1 text-xs font-semibold text-green-700">
                  <Loader2 className="h-3.5 w-3.5 inline mr-1 animate-spin" />
                  En progreso
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-[#e5e7eb] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#22c55e] transition-[width] duration-500 ease-out"
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">{completedSteps}/{PROCESSING_STEPS.length} pasos</p>
                  <p className="text-xs font-medium text-[#7c3aed]">{activeStepLabel ? `Paso actual: ${activeStepLabel}` : "Finalizando"}</p>
                </div>
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto p-4 space-y-3 scroll-smooth">
              {PROCESSING_STEPS.map((step) => {
                const state = stepStates[step.id]
                const isCatalog = step.id === "catalog"
                const isQuality = step.id === "quality"
                const showCatalogChips = isCatalog && state !== "pending" && catalogProducts.length > 0
                const showQualityBar = isQuality && state !== "pending"

                return (
                  <div
                    ref={(node) => {
                      stepItemRefs.current[step.id] = node
                    }}
                    key={step.id}
                    className={`rounded-xl border px-4 py-3 transition-colors ${
                      state === "active"
                        ? "border-[#a78bfa] bg-[#f5f3ff] shadow-sm"
                        : state === "done"
                          ? "border-[#ddd6fe] bg-white"
                          : "border-[#ede9fe] bg-white/70"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 rounded-xl border border-[#d8b4fe] bg-[#f3e8ff] text-[#7c3aed] flex items-center justify-center shrink-0">
                        {getStepIcon(step.id)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-gray-900">{step.label}</p>
                          {step.id === "ai" && productsMetric && (
                            <Badge className="bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0] hover:bg-[#dcfce7]">
                              {productsMetric}
                            </Badge>
                          )}
                          {step.id === "save" && state !== "pending" && saveMetric && (
                            <Badge className="bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0] hover:bg-[#dcfce7]">
                              {saveMetric}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{step.detail}</p>

                        {showCatalogChips && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {catalogProducts.map((chip, index) => (
                              <span
                                key={`${chip}-${index}`}
                                className={`rounded-full border border-[#d8b4fe] px-3 py-1 text-sm text-[#6d28d9] transition-[opacity,transform] duration-200 ${
                                  chipsVisible > index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                                }`}
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}

                        {isCatalog && state !== "pending" && catalogProducts.length === 0 && (
                          <p className="mt-2 text-sm text-gray-500">Esperando productos extraídos por el servicio...</p>
                        )}

                        {showQualityBar && (
                          <div className="mt-3 flex items-center gap-3">
                            <div className="h-2 flex-1 rounded-full bg-[#e5e7eb] overflow-hidden">
                              {qualityScore !== null ? (
                                <div
                                  className="h-full rounded-full bg-[#7c3aed] transition-[width] duration-300"
                                  style={{ width: `${qualityScore}%` }}
                                />
                              ) : (
                                <div className="h-full w-1/2 rounded-full bg-[#c4b5fd] animate-pulse" />
                              )}
                            </div>
                            <span className="text-sm font-semibold text-[#7c3aed]">
                              {qualityScore !== null ? `${qualityScore}% calidad` : "Evaluando..."}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-1">
                        {state === "done" && (
                          <div className="h-8 w-8 rounded-full border border-[#c4b5fd] text-[#7c3aed] flex items-center justify-center">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        {state === "active" && (
                          <div className="h-8 w-8 rounded-full border border-[#c4b5fd] text-[#7c3aed] flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                        {state === "pending" && <div className="h-8 w-8 rounded-full border border-[#ddd6fe]" />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-5 py-4 border-t border-[#ede9fe] flex items-center justify-between text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Servicio RFX conectado
              </span>
              <span className="truncate max-w-[45%] text-right">
                {attachedFiles[0]?.file?.name ?? "Documento adjunto"} {attachedFiles[0] ? `· ${formatFileSize(attachedFiles[0].file.size)}` : ""}
              </span>
            </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="motion-enter">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Input Card */}
      <Card
        className={`border border shadow-sm transition-[box-shadow,transform] duration-200 ease-out ${
          isProcessing ? "mt-6" : ""
        }`}
      >
        <CardContent className="p-0">
          {/* Attached Files Preview */}
          {attachedFiles.length > 0 && (
            <div className="p-4 border-b border-gray-100 bg-secondary motion-enter">
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((attachedFile) => (
                  <div
                    key={attachedFile.id}
                    className="flex items-center gap-2 bg-background border border rounded-lg px-3 py-2 text-sm motion-stagger-item"
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
                      className="h-5 w-5 p-0 text-muted-foreground/60 hover:text-muted-foreground"
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
                    className="text-xs text-muted-foreground hover:text-gray-700"
                  >
                    Remove all files
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
              className="min-h-[60px] max-h-[200px] resize-none border-0 shadow-none focus-visible:ring-0 text-base placeholder:text-muted-foreground/60 transition-[opacity,transform] duration-200 ease-out"
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
                className="h-8 w-8 p-0 text-muted-foreground hover:text-gray-700 hover:bg-muted"
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
                <span className="text-xs text-muted-foreground">
                  {attachedFiles.length} file{attachedFiles.length !== 1 ? "s" : ""} attached
                </span>
              )}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="h-8 w-8 p-0 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-[transform,opacity,background-color] duration-200 ease-out hover:scale-[1.02]"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </Button>
          </div>

          {/* Service Offline Warning */}
          {serviceStatus === 'offline' && (
            <div className="px-4 pb-4 motion-enter">
              <Alert variant="destructive">
                <WifiOff className="h-4 w-4" />
                <AlertDescription>
                  The RFX service is unavailable. Check your connection.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Helper Text */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          You can write specific instructions and attach RFX documents (PDF, DOCX, TXT, images, Excel)
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send,
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Shift + Enter</kbd> for a new line
        </p>
      </div>
    </div>
  )
}
