"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Download, Maximize2, Minimize2, FileText, Info } from "lucide-react"
import { LowCreditsAlert } from "@/components/credits/LowCreditsAlert"

interface ProposalTabProps {
  htmlContent: string
  isRegenerating: boolean
  isLoadingProposal: boolean
  onRegenerate: () => void
  onDownload: () => void
  // Credits props
  hasEnoughCredits?: boolean
  currentCredits?: number
  requiredCredits?: number
}

export function ProposalTab({
  htmlContent,
  isRegenerating,
  isLoadingProposal,
  onRegenerate,
  onDownload,
  hasEnoughCredits = true,
  currentCredits = 0,
  requiredCredits = 0
}: ProposalTabProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    // Deshabilitado: El auto-scaling causaba compresión del ancho
    // Ahora el contenedor mantiene su ancho completo con overflow-auto
    setScale(1)
  }, [htmlContent])

  if (!htmlContent) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Card className="p-8 max-w-md text-center border-2 border-dashed">
          {isLoadingProposal ? (
            <>
              {/* Estado de Generación */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full bg-primary/10 animate-pulse" />
                </div>
                <RefreshCw className="h-16 w-16 text-primary mx-auto animate-spin relative z-10" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Generating your commercial proposal
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                AI is creating a personalized proposal based on RFX data...
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>This may take a few seconds</span>
              </div>
            </>
          ) : (
            <>
              {/* Estado Inicial */}
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No proposal generated
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click 'Generate with AI' to create the commercial proposal
              </p>
              <Button 
                onClick={onRegenerate} 
                className="gap-2"
                size="lg"
                disabled={!hasEnoughCredits}
              >
                <RefreshCw className="h-4 w-4" />
                Generate with AI
              </Button>
              {!hasEnoughCredits && (
                <div className="mt-4">
                  <LowCreditsAlert
                    currentCredits={currentCredits}
                    requiredCredits={requiredCredits}
                    variant="compact"
                  />
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header Card con Controles */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Propuesta Comercial</CardTitle>
              <CardDescription>
                Documento generado por IA listo para descargar
              </CardDescription>
            </div>
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
              disabled={isRegenerating || !hasEnoughCredits}
              variant="outline"
              className="gap-2"
              title={!hasEnoughCredits ? "Créditos insuficientes" : "Regenerar propuesta"}
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
        className={`relative w-full ${
          isFullscreen ? 'fixed inset-4 z-50 overflow-auto' : 'min-h-[600px] overflow-x-auto'
        }`}
      >
        <CardContent className="p-0 w-full">
          <div 
            className="w-full"
            style={{ 
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              transition: 'transform 0.3s ease'
            }}
          >
            <div 
              ref={contentRef}
              className="proposal-content-wrapper bg-background"
              style={{ 
                width: '100%',
                minWidth: '100%',
                padding: '3rem',
                boxSizing: 'border-box'
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
                {isRegenerating ? 'Regenerando propuesta...' : 'Generando propuesta con IA...'}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Footer Info Card */}
      <Card className="w-full">
        <CardContent className="p-4 w-full">
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
