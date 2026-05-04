"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertTriangle,
  Calculator,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react"
import type { APUResult } from "@/lib/api-apu"

interface APUTabProps {
  rfxId?: string | null
  result: APUResult | null
  isGenerating: boolean
  isLoading?: boolean
  error: string | null
  onGenerate: () => void
  disabled?: boolean
}

/**
 * Tab content for the Análisis de Precios Unitarios (Venezuelan construction).
 *
 * Renders one of four states:
 *   - no rfxId   → blocked notice
 *   - generating → loading card
 *   - !result    → initial CTA (with prior error if any)
 *   - result     → header with Download/Regenerate + iframe preview via Office Viewer
 *
 * State is owned by the parent (BudgetGenerationView) so it survives tab switches.
 */
export function APUTab({
  rfxId,
  result,
  isGenerating,
  isLoading = false,
  error,
  onGenerate,
  disabled = false,
}: APUTabProps) {
  const viewerUrl = useMemo(
    () =>
      result
        ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(result.excel_url)}`
        : null,
    [result],
  )

  const handleDownload = () => {
    if (!result) return
    const link = document.createElement("a")
    link.href = result.excel_url
    link.download = `APU-${result.rfx_id}.xlsx`
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!rfxId) {
    return (
      <Card className="p-8 text-center border-2 border-dashed">
        <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">No hay RFX cargado</h3>
        <p className="text-sm text-muted-foreground">
          Carga un RFX para generar su APU.
        </p>
      </Card>
    )
  }

  // Quiet skeleton while we check whether this RFX already has a persisted APU.
  // Distinct from the loud "generating" state — no LLM call is happening here.
  if (isLoading && !result) {
    return (
      <Card className="p-8 text-center border-2 border-dashed">
        <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-3 animate-spin" />
        <p className="text-sm text-muted-foreground">Cargando APU...</p>
      </Card>
    )
  }

  if (isGenerating) {
    return (
      <Card className="p-8 text-center border-2 border-dashed">
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 animate-pulse" />
          </div>
          <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin relative z-10" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Generando APU técnico...</h3>
        <p className="text-sm text-muted-foreground mb-2 max-w-md mx-auto">
          La IA está construyendo el análisis de precios unitarios para construcción
          civil con desglose de materiales, mano de obra, equipos, costos indirectos,
          utilidad e IVA.
        </p>
        <p className="text-xs text-muted-foreground">
          Esto suele tardar entre 1.5 y 2.5 minutos según el número de partidas.
        </p>
      </Card>
    )
  }

  if (!result) {
    return (
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>La generación anterior falló</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="p-8 text-center border-2 border-dashed">
          <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">APU técnico no generado</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
            Genera un Análisis de Precios Unitarios para construcción civil venezolana,
            con desglose completo y fórmulas Excel nativas. Cambia la tasa BCV en el
            archivo y todos los precios en VES recalculan automáticamente.
          </p>
          <Button
            onClick={onGenerate}
            size="lg"
            disabled={disabled}
            className="gap-2"
          >
            <Calculator className="h-4 w-4" />
            Generar APU
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                APU Técnico
              </CardTitle>
              <CardDescription className="mt-1">
                {result.partidas_count}{" "}
                {result.partidas_count === 1 ? "partida" : "partidas"} • generado en{" "}
                {result.llm_attempts}{" "}
                {result.llm_attempts === 1 ? "intento" : "intentos"} • prompt v
                {result.prompt_version}
              </CardDescription>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                onClick={onGenerate}
                disabled={disabled || isGenerating}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerar
              </Button>
              <Button onClick={handleDownload} size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Descargar Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        {result.warnings.length > 0 && (
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Advertencias del generador</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="text-sm">
                      {w}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {viewerUrl && (
        <Card>
          <CardContent className="p-0">
            <iframe
              key={result.excel_url}
              src={viewerUrl}
              className="w-full h-[800px] rounded-lg"
              title="APU Excel preview"
              loading="lazy"
            />
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Vista previa renderizada por Microsoft Office Viewer (solo lectura). Para editar
        celdas y recalcular fórmulas, descarga el Excel.
      </p>
    </div>
  )
}
