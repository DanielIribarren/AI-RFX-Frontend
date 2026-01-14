"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Download,
  Palette,
  Type,
  Layout,
  Image
} from "lucide-react"

interface BrandingConfig {
  company_id: string
  has_branding: boolean
  logo_url?: string
  logo_filename?: string
  template_url?: string
  template_filename?: string
  logo_analysis?: {
    primary_color: string
    secondary_color: string
    dominant_colors: string[]
    analyzed_at: string
  }
  template_analysis?: {
    layout_structure: string
    color_scheme: {
      primary: string
      secondary: string
      backgrounds: string[]
      borders: string
    }
    table_style: {
      has_borders: boolean
      border_width: string
      header_background: string
    }
    typography: {
      font_family: string
      company_name_size: string
      body_size: string
    }
    design_style: string
    analyzed_at: string
  }
  analysis_status: string
  created_at: string
  updated_at: string
}

interface BrandingPreviewProps {
  companyId: string
}

export default function BrandingPreview({ companyId }: BrandingPreviewProps) {
  const [config, setConfig] = useState<BrandingConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para convertir URLs del backend a URLs del API de Next.js
  const transformFileUrl = (backendUrl: string | undefined, fileType: 'logo' | 'template'): string | undefined => {
    if (!backendUrl) return undefined
    
    // Si ya es una URL completa (http/https), devolverla tal cual
    if (backendUrl.startsWith('http://') || backendUrl.startsWith('https://')) {
      return backendUrl
    }
    
    // Si es una ruta relativa del backend, convertirla a nuestra API
    return `/api/branding/files/${companyId}/${fileType}`
  }

  const loadBrandingConfig = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('[BrandingPreview] Loading config for company:', companyId)
      const response = await fetch(`/api/branding/${companyId}`)
      
      // Si el backend no responde o hay error de red, es un error real
      if (!response.ok) {
        // Si es 404, significa que no hay configuración (no es error)
        if (response.status === 404) {
          console.log('[BrandingPreview] No branding configured (404)')
          setConfig(null)
          setIsLoading(false)
          return
        }
        
        // Otros errores sí son problemas reales
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      console.log('[BrandingPreview] Response:', {
        status: response.status,
        ok: response.ok,
        result
      })

      if (result.status === 'success') {
        if (result.has_branding) {
          // Transformar URLs del backend a URLs del API de Next.js
          const transformedConfig = {
            ...result,
            logo_url: transformFileUrl(result.logo_url, 'logo'),
            template_url: transformFileUrl(result.template_url, 'template')
          }
          
          console.log('[BrandingPreview] Config loaded:', {
            original_logo_url: result.logo_url,
            transformed_logo_url: transformedConfig.logo_url,
            original_template_url: result.template_url,
            transformed_template_url: transformedConfig.template_url,
            has_logo_analysis: !!result.logo_analysis,
            has_template_analysis: !!result.template_analysis
          })
          setConfig(transformedConfig)
        } else {
          console.log('[BrandingPreview] No branding configured (has_branding: false)')
          setConfig(null)
        }
      } else if (result.status === 'not_found') {
        // Backend devuelve explícitamente que no hay configuración
        console.log('[BrandingPreview] No branding configured (not_found)')
        setConfig(null)
      } else {
        // Otros estados son errores reales
        throw new Error(result.message || 'Error al cargar configuración')
      }
    } catch (error) {
      console.error('[BrandingPreview] Error loading branding config:', error)
      // Solo mostrar error si es un problema de red o del backend
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('No se pudo conectar con el servidor. Verifique su conexión.')
      } else {
        setError(error instanceof Error ? error.message : 'Error desconocido al cargar configuración')
      }
      setConfig(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReanalyze = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/branding/reanalyze/${companyId}`, {
        method: 'POST'
      })
      const result = await response.json()
      
      if (result.status === 'success') {
        // Poll for completion
        setTimeout(loadBrandingConfig, 2000)
      } else {
        throw new Error(result.message || 'Error al re-analizar')
      }
    } catch (error) {
      console.error('Reanalyze error:', error)
      setError(error instanceof Error ? error.message : 'Error al re-analizar')
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de que desea eliminar la configuración de branding?')) {
      return
    }

    try {
      const response = await fetch(`/api/branding/${companyId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (result.status === 'success') {
        setConfig(null)
        alert('Configuración eliminada exitosamente')
      } else {
        throw new Error(result.message || 'Error al eliminar')
      }
    } catch (error) {
      console.error('Delete error:', error)
      setError(error instanceof Error ? error.message : 'Error al eliminar configuración')
    }
  }

  useEffect(() => {
    loadBrandingConfig()
  }, [companyId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Cargando configuración...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadBrandingConfig}>
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!config || !config.has_branding) {
    return (
      <div className="text-center p-8 border-2 border-dashed border-input rounded-lg bg-secondary">
        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Layout className="h-6 w-6 text-primary-light" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">No hay configuración de presupuesto</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Suba un logo y template en la sección de la izquierda para personalizar sus presupuestos
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Logo Preview */}
      {config.logo_url && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Image className="h-4 w-4" />
              Logo
            </h4>
            <Badge variant="secondary" className="text-xs">
              {config.logo_filename}
            </Badge>
          </div>
          
          <div className="border rounded-lg p-4 bg-background">
            <img 
              src={config.logo_url} 
              alt="Logo de la empresa"
              className="max-h-20 max-w-full object-contain mx-auto"
              onError={(e) => {
                console.error('[BrandingPreview] Logo failed to load:', config.logo_url)
                e.currentTarget.style.display = 'none'
                const parent = e.currentTarget.parentElement
                if (parent) {
                  parent.innerHTML = '<div class="text-sm text-destructive text-center">Error al cargar logo</div>'
                }
              }}
              onLoad={() => {
                console.log('[BrandingPreview] Logo loaded successfully:', config.logo_url)
              }}
            />
          </div>
        </div>
      )}

      {/* Color Analysis */}
      {config.logo_analysis && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colores Extraídos
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Primario</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: config.logo_analysis.primary_color }}
                />
                <span className="text-xs font-mono">
                  {config.logo_analysis.primary_color}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Secundario</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: config.logo_analysis.secondary_color }}
                />
                <span className="text-xs font-mono">
                  {config.logo_analysis.secondary_color}
                </span>
              </div>
            </div>
          </div>

          {config.logo_analysis.dominant_colors.length > 2 && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Paleta Completa</span>
              <div className="flex gap-1 flex-wrap">
                {config.logo_analysis.dominant_colors.map((color, index) => (
                  <div 
                    key={index}
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Template Analysis */}
      {config.template_analysis && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Análisis del Template
            </h4>
            <Badge variant="secondary" className="text-xs">
              {config.template_filename}
            </Badge>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-muted-foreground block">Estilo</span>
                <span className="capitalize">{config.template_analysis.design_style}</span>
              </div>
              
              <div>
                <span className="text-xs text-muted-foreground block">Estructura</span>
                <span className="capitalize">{config.template_analysis.layout_structure.replace(/-/g, ' ')}</span>
              </div>
            </div>

            {config.template_analysis.typography && (
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Tipografía</span>
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-muted-foreground/60" />
                  <span className="text-xs">{config.template_analysis.typography.font_family}</span>
                </div>
              </div>
            )}
          </div>

          {config.template_url && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                console.log('[BrandingPreview] Opening template URL:', config.template_url)
                if (config.template_url) {
                  window.open(config.template_url, '_blank')
                } else {
                  alert('URL del template no disponible')
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Ver Template Original
            </Button>
          )}
        </div>
      )}

      {/* Analysis Status */}
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800">Configuración activa</span>
        </div>
        <Badge variant="outline" className="text-green-700 border-green-300">
          {config.analysis_status}
        </Badge>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={handleReanalyze}
          disabled={isLoading}
          className="flex-1"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Re-analizar
        </Button>
        
        <Button 
          variant="destructive" 
          onClick={handleDelete}
          size="sm"
        >
          Eliminar
        </Button>
      </div>

      {/* Last Updated */}
      <p className="text-xs text-muted-foreground text-center">
        Última actualización: {new Date(config.updated_at).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </div>
  )
}
