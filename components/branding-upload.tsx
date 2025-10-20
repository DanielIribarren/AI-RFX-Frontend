"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  FileText, 
  Image, 
  AlertCircle, 
  CheckCircle, 
  X,
  RefreshCw
} from "lucide-react"

interface BrandingUploadProps {
  companyId: string
}

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'completed' | 'error'

export default function BrandingUpload({ companyId }: BrandingUploadProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [analysisProgress, setAnalysisProgress] = useState("")
  const [pollingAttempts, setPollingAttempts] = useState(0)
  const [maxPollingAttempts] = useState(60) // 2 minutes max (60 attempts * 2 seconds)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const templateInputRef = useRef<HTMLInputElement>(null)

  const validateFiles = () => {
    const errors: string[] = []
    
    if (logoFile) {
      if (logoFile.size > 5 * 1024 * 1024) {
        errors.push('Logo debe ser menor a 5MB')
      }
      if (!['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(
        logoFile.name.split('.').pop()?.toLowerCase() || ''
      )) {
        errors.push('Logo debe ser PNG, JPG, JPEG, SVG o WebP')
      }
    }

    if (templateFile) {
      if (templateFile.size > 10 * 1024 * 1024) {
        errors.push('Template debe ser menor a 10MB')
      }
      if (!['pdf', 'png', 'jpg', 'jpeg', 'xlsx', 'xls'].includes(
        templateFile.name.split('.').pop()?.toLowerCase() || ''
      )) {
        errors.push('Template debe ser PDF, PNG, JPG, JPEG, XLSX o XLS')
      }
    }

    return errors
  }

  const handleUpload = async () => {
    const validationErrors = validateFiles()
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }

    if (!logoFile && !templateFile) {
      setError('Seleccione al menos un archivo para subir')
      return
    }

    setUploadState('uploading')
    setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('company_id', companyId)
      
      if (logoFile) formData.append('logo', logoFile)
      if (templateFile) formData.append('template', templateFile)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 15 + 5
        })
      }, 200)

      const response = await fetch('/api/branding/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.status === 'success') {
        setUploadState('analyzing')
        setAnalysisProgress('Analizando logo y template con IA...')
        setPollingAttempts(0) // Reset polling attempts counter
        
        // Start polling for analysis status
        pollAnalysisStatus(companyId)
      } else {
        throw new Error(result.message || 'Error al subir archivos')
      }

    } catch (error) {
      console.error('Upload error:', error)
      setUploadState('error')
      setError(error instanceof Error ? error.message : 'Error desconocido al subir archivos')
      setUploadProgress(0)
    }
  }

  const pollAnalysisStatus = async (companyId: string) => {
    try {
      // Check if we've exceeded max polling attempts
      if (pollingAttempts >= maxPollingAttempts) {
        setUploadState('error')
        setError('Timeout: El análisis está tomando demasiado tiempo. Por favor, intente nuevamente.')
        setPollingAttempts(0)
        return
      }

      setPollingAttempts(prev => prev + 1)

      const response = await fetch(`/api/branding/analysis-status/${companyId}`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      // Update progress message if available
      if (result.progress) {
        setAnalysisProgress(result.progress)
      }

      // Handle different analysis statuses
      switch (result.analysis_status) {
        case 'completed':
          setUploadState('completed')
          setAnalysisProgress('Análisis completado exitosamente')
          setPollingAttempts(0)
          // Reset to idle after 2 seconds to allow re-upload
          setTimeout(() => {
            setUploadState('idle')
            setError(null)
          }, 2000)
          break

        case 'failed':
        case 'error':
          setUploadState('error')
          setError(`Error en análisis: ${result.error || 'Error desconocido durante el análisis'}`)
          setPollingAttempts(0)
          break

        case 'analyzing':
        case 'processing':
        case 'pending':
          // Continue polling - valid processing states
          setTimeout(() => pollAnalysisStatus(companyId), 2000)
          break

        case 'cancelled':
        case 'timeout':
          setUploadState('error')
          setError('El análisis fue cancelado o expiró. Por favor, intente nuevamente.')
          setPollingAttempts(0)
          break

        default:
          // Unknown status - stop polling and show error
          console.warn('Unknown analysis status:', result.analysis_status)
          setUploadState('error')
          setError(`Estado de análisis desconocido: ${result.analysis_status}. Por favor, intente nuevamente.`)
          setPollingAttempts(0)
          break
      }
    } catch (error) {
      console.error('Polling error:', error)
      setUploadState('error')
      setError('Error verificando estado del análisis. Verifique su conexión e intente nuevamente.')
      setPollingAttempts(0)
    }
  }

  const handleReset = () => {
    setLogoFile(null)
    setTemplateFile(null)
    setUploadState('idle')
    setUploadProgress(0)
    setError(null)
    setAnalysisProgress("")
    setPollingAttempts(0) // Reset polling attempts counter
    
    if (logoInputRef.current) logoInputRef.current.value = ""
    if (templateInputRef.current) templateInputRef.current.value = ""
  }

  const canUpload = (logoFile || templateFile) && uploadState !== 'uploading' && uploadState !== 'analyzing'

  return (
    <div className="space-y-4">
      {/* Logo Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Logo de la Empresa</label>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => logoInputRef.current?.click()}
        >
          <input
            ref={logoInputRef}
            type="file"
            className="hidden"
            accept=".png,.jpg,.jpeg,.svg,.webp"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            disabled={uploadState === 'uploading' || uploadState === 'analyzing'}
          />
          
          <div className="flex flex-col items-center gap-2">
            <Image className="h-8 w-8 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {logoFile ? logoFile.name : 'Click para subir logo'}
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, JPEG, SVG, WebP (máx. 5MB)
              </p>
            </div>
          </div>
        </div>
        
        {logoFile && (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span className="text-sm">{logoFile.name}</span>
              <span className="text-xs text-gray-500">
                ({(logoFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            {uploadState !== 'uploading' && uploadState !== 'analyzing' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setLogoFile(null)
                  if (logoInputRef.current) logoInputRef.current.value = ""
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Template Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Template/Formato de Presupuesto</label>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => templateInputRef.current?.click()}
        >
          <input
            ref={templateInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
            onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
            disabled={uploadState === 'uploading' || uploadState === 'analyzing'}
          />
          
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-8 w-8 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {templateFile ? templateFile.name : 'Click para subir template'}
              </p>
              <p className="text-xs text-gray-500">
                PDF, PNG, JPG, JPEG, XLSX, XLS (máx. 10MB)
              </p>
            </div>
          </div>
        </div>
        
        {templateFile && (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm">{templateFile.name}</span>
              <span className="text-xs text-gray-500">
                ({(templateFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            {uploadState !== 'uploading' && uploadState !== 'analyzing' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setTemplateFile(null)
                  if (templateInputRef.current) templateInputRef.current.value = ""
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress Display */}
      {(uploadState === 'uploading' || uploadState === 'analyzing') && (
        <div className="space-y-2">
          {uploadState === 'uploading' && (
            <>
              <div className="flex justify-between text-sm">
                <span>Subiendo archivos...</span>
                <span>{uploadProgress.toFixed(0)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </>
          )}
          
          {uploadState === 'analyzing' && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>{analysisProgress}</span>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {uploadState === 'completed' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">¡Análisis Completado!</AlertTitle>
          <AlertDescription className="text-green-700">
            Sus archivos han sido subidos y analizados exitosamente. 
            Los colores y estilos se aplicarán automáticamente a sus presupuestos.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={!canUpload}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploadState === 'uploading' ? 'Subiendo...' : 
             uploadState === 'analyzing' ? 'Analizando...' :
             uploadState === 'completed' ? 'Re-analizar' :
             'Subir y Analizar'}
          </Button>
        
        {(logoFile || templateFile || uploadState !== 'idle') && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={uploadState === 'uploading' || uploadState === 'analyzing'}
          >
            {uploadState === 'completed' ? 'Subir Nuevos' : 'Limpiar'}
          </Button>
        )}
      </div>
    </div>
  )
}
