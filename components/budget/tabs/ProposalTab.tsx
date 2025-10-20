"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Download, Maximize2, Minimize2, FileText, Info } from "lucide-react"

interface ProposalTabProps {
  htmlContent: string
  isRegenerating: boolean
  isLoadingProposal: boolean
  onRegenerate: () => void
  onDownload: () => void
  canGenerate: boolean
}

export function ProposalTab({
  htmlContent,
  isRegenerating,
  isLoadingProposal,
  onRegenerate,
  onDownload,
  canGenerate
}: ProposalTabProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!containerRef.current || !contentRef.current || !htmlContent) return

    const updateScale = () => {
      const container = containerRef.current
      const content = contentRef.current
      
      if (!container || !content) return

      // Calcular ancho disponible considerando padding del contenido (3rem * 2 = 96px)
      const containerWidth = container.offsetWidth
      const contentWidth = content.scrollWidth + 96 // Agregar padding del contenido

      if (contentWidth > containerWidth) {
        const newScale = Math.max(0.5, Math.min(1, containerWidth / contentWidth))
        setScale(newScale)
      } else {
        setScale(1)
      }
    }

    setTimeout(updateScale, 100)
    window.addEventListener('resize', updateScale)
    
    return () => window.removeEventListener('resize', updateScale)
  }, [htmlContent])

  if (!htmlContent) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Card className="p-8 max-w-md text-center">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No hay propuesta generada
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {canGenerate ? 
              "Haz clic en 'Generar con IA' para crear la propuesta comercial" :
              "Configura los precios de los productos primero"
            }
          </p>
          {canGenerate && (
            <Button onClick={onRegenerate} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Generar con IA
            </Button>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card con Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Propuesta Comercial</CardTitle>
              <CardDescription>
                Documento generado por IA listo para descargar
              </CardDescription>
            </div>
            {scale < 1 && (
              <Badge variant="secondary" className="gap-1">
                <Info className="h-3 w-3" />
                Escalado: {Math.round(scale * 100)}%
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="gap-2"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
            </Button>
            <Button
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerar Propuesta
            </Button>
            <Button
              size="sm"
              onClick={onDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card
        ref={containerRef}
        className={`relative overflow-hidden ${
          isFullscreen ? 'fixed inset-4 z-50 overflow-auto' : ''
        }`}
      >
        <CardContent className="p-0">
          <div 
            className="w-full"
            style={{ 
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.3s ease',
              contain: 'layout style paint'
            }}
          >
            <div 
              ref={contentRef}
              className="proposal-content-wrapper bg-background"
              style={{ 
                width: '100%',
                padding: '3rem',
                isolation: 'isolate'
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </CardContent>

        {/* Loading overlay */}
        {(isRegenerating || isLoadingProposal) && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm font-medium">
                {isRegenerating ? 'Regenerando propuesta...' : 'Cargando desde base de datos...'}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Footer Info Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>
              Esta propuesta fue generada automáticamente. Puedes regenerarla o descargarla como PDF.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
