"use client"

import { useState } from "react"
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
  HardHat,
  Hammer,
  Info,
  Sparkles,
  Wrench,
} from "lucide-react"
import {
  type PartidaScope,
  type ScopeConfianza,
  type ScopeMode,
  type ScopeOrigen,
  type ScopeOutput,
} from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ─── Styling helpers ────────────────────────────────────────────────────────

const CONFIANZA_STYLES: Record<ScopeConfianza, string> = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-red-50 text-red-700 border-red-200",
}

const CONFIANZA_LABELS: Record<ScopeConfianza, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
}

const ORIGEN_LABELS: Record<ScopeOrigen, string> = {
  documento_cliente: "From document",
  inferido: "AI-inferred",
}

const ORIGEN_STYLES: Record<ScopeOrigen, string> = {
  documento_cliente: "bg-blue-50 text-blue-700 border-blue-200",
  inferido: "bg-violet-50 text-violet-700 border-violet-200",
}

const SCOPE_MODE_LABELS: Record<ScopeMode, string> = {
  preservar: "Preserve as-is",
  mixto: "Mixed",
  expansivo: "Expanded by AI",
}

const SCOPE_MODE_STYLES: Record<ScopeMode, string> = {
  preservar: "bg-slate-100 text-slate-700",
  mixto: "bg-amber-100 text-amber-800",
  expansivo: "bg-violet-100 text-violet-800",
}

// ─── Defensive shape check ──────────────────────────────────────────────────
//
// The scope_json column is JSONB and could in theory hold partial or
// corrupted data (mid-pipeline write, schema drift). Rather than letting
// React crash the whole RFX detail page, we validate the minimum shape and
// render a contained fallback. The check is structural, not field-by-field
// — we only block render when partidas isn't even an array, which is the
// failure mode that would break the .map() below.
function isRenderableScope(scope: unknown): scope is ScopeOutput {
  if (!scope || typeof scope !== "object") return false
  const candidate = scope as Partial<ScopeOutput>
  return Array.isArray(candidate.partidas)
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface PartidaCardProps {
  partida: PartidaScope
  index: number
}

function PartidaCard({ partida, index }: PartidaCardProps) {
  const [open, setOpen] = useState(index === 0)

  const confianza: ScopeConfianza = (["high", "medium", "low"] as const).includes(
    partida.confianza as ScopeConfianza,
  )
    ? (partida.confianza as ScopeConfianza)
    : "medium"

  const origen: ScopeOrigen = partida.origen_dato === "documento_cliente"
    ? "documento_cliente"
    : "inferido"

  return (
    <div className="rounded-lg border bg-white shadow-sm transition-shadow hover:shadow">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {partida.numero}
        </span>

        <span className="flex-1 truncate font-medium text-gray-900">
          {partida.descripcion_corta}
        </span>

        <span className="hidden sm:inline-flex shrink-0 items-baseline gap-1 text-sm font-medium tabular-nums text-gray-900">
          {partida.cantidad_es_estimada ? "≈" : ""}
          {Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(partida.cantidad)}
          <span className="text-xs font-normal text-muted-foreground">{partida.unidad}</span>
        </span>

        <Badge variant="outline" className={cn("hidden md:inline-flex", CONFIANZA_STYLES[confianza])}>
          {CONFIANZA_LABELS[confianza]}
        </Badge>

        <Badge variant="outline" className={cn("hidden lg:inline-flex", ORIGEN_STYLES[origen])}>
          {ORIGEN_LABELS[origen]}
        </Badge>
      </button>

      {open && (
        <div className="space-y-4 border-t bg-gray-50/40 px-4 py-4 text-sm">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Chapter
            </div>
            <div className="mt-0.5 text-gray-900">
              {partida.capitulo} · {partida.capitulo_titulo}
            </div>
            {partida.codigo_covenin && (
              <div className="mt-1 text-xs text-muted-foreground">
                COVENIN: <span className="font-mono">{partida.codigo_covenin}</span>
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Technical description
            </div>
            <div className="mt-0.5 whitespace-pre-wrap text-gray-900">
              {partida.descripcion_tecnica}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Required process
            </div>
            <div className="mt-0.5 whitespace-pre-wrap text-gray-900">
              {partida.proceso_requerido}
            </div>
          </div>

          {partida.condiciones_especiales && (
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Special conditions
              </div>
              <div className="mt-0.5 whitespace-pre-wrap text-gray-900">
                {partida.condiciones_especiales}
              </div>
            </div>
          )}

          <div className="rounded-md border bg-white p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <HardHat className="h-3.5 w-3.5" />
              Execution rate
            </div>
            <div className="text-gray-900">
              <span className="text-base font-semibold tabular-nums">
                {Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
                  partida.rendimiento_estimado.valor,
                )}
              </span>{" "}
              <span className="text-sm">{partida.rendimiento_estimado.unidad_por_dia}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Minimum crew: {partida.rendimiento_estimado.personal_minimo}
            </div>
            <div className="mt-1 text-xs text-muted-foreground italic">
              {partida.rendimiento_estimado.justificacion}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <ComponentList
              icon={<Hammer className="h-3.5 w-3.5" />}
              title="Key materials"
              items={partida.componentes_esperados.materiales_clave}
            />
            <ComponentList
              icon={<Wrench className="h-3.5 w-3.5" />}
              title="Key equipment"
              items={partida.componentes_esperados.equipos_clave}
            />
            <ComponentList
              icon={<HardHat className="h-3.5 w-3.5" />}
              title="Key labor"
              items={partida.componentes_esperados.mano_obra_clave}
            />
          </div>

          {partida.notas_para_costeo && (
            <div className="rounded-md border-l-4 border-amber-400 bg-amber-50 p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-amber-800">
                Costing notes
              </div>
              <div className="mt-0.5 text-amber-900">{partida.notas_para_costeo}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ComponentListProps {
  icon: React.ReactNode
  title: string
  items: string[]
}

function ComponentList({ icon, title, items }: ComponentListProps) {
  return (
    <div className="rounded-md border bg-white p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground italic">Not specified</div>
      ) : (
        <ul className="space-y-0.5 text-sm text-gray-900">
          {items.map((item, i) => (
            <li key={i}>· {item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Main panel ─────────────────────────────────────────────────────────────

interface ScopePanelProps {
  scope: ScopeOutput | null | undefined
}

export function ScopePanel({ scope }: ScopePanelProps) {
  const [showAssumptions, setShowAssumptions] = useState(false)

  if (scope == null) return null

  // Defensive: scope is JSONB from the DB, so a partial/corrupted row would
  // otherwise crash this whole detail page.
  if (!isRenderableScope(scope)) {
    return (
      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            <p className="font-medium">Scope data is in an unexpected format</p>
            <p className="mt-1 text-xs text-amber-800">
              The construction scope agent returned data this view can't read. The rest of
              the proposal is unaffected. Re-process the RFX or contact engineering with
              the rfx_id if this persists.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const partidasFromDoc = scope.partidas.filter(
    (p) => p.origen_dato === "documento_cliente",
  ).length
  const partidasInferred = scope.partidas.length - partidasFromDoc

  const lowConfidenceCount = scope.partidas.filter(
    (p) => p.confianza === "low",
  ).length

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Extracted construction scope
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {scope.project_name}
              {scope.client_company ? ` · ${scope.client_company}` : ""}
            </p>
          </div>
          <Badge className={cn("w-fit", SCOPE_MODE_STYLES[scope.scope_mode] ?? "")}>
            <Sparkles className="mr-1 h-3 w-3" />
            {SCOPE_MODE_LABELS[scope.scope_mode] ?? scope.scope_mode}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {scope.project_summary && (
          <div className="rounded-md border bg-gray-50/60 p-3 text-sm">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Project summary
            </div>
            <p className="whitespace-pre-wrap text-gray-900">{scope.project_summary}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Partidas" value={scope.partidas.length} />
          <Stat label="From document" value={partidasFromDoc} accent="blue" />
          <Stat label="AI-inferred" value={partidasInferred} accent="violet" />
          <Stat
            label="Low confidence"
            value={lowConfidenceCount}
            accent={lowConfidenceCount > 0 ? "red" : "muted"}
          />
        </div>

        {scope.missing_information.length > 0 && (
          <div className="rounded-md border-l-4 border-amber-400 bg-amber-50 p-3 text-sm">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5" />
              Missing information
            </div>
            <ul className="space-y-0.5 text-amber-900">
              {scope.missing_information.map((item, i) => (
                <li key={i}>· {item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          {scope.partidas.map((partida, i) => (
            <PartidaCard key={`${partida.numero}-${i}`} partida={partida} index={i} />
          ))}
        </div>

        {scope.scope_assumptions.length > 0 && (
          <div className="rounded-md border bg-gray-50/60">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAssumptions((v) => !v)}
              className="flex w-full items-center justify-start gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:bg-transparent"
            >
              {showAssumptions ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              <Info className="h-3.5 w-3.5" />
              Assumptions made by the agent ({scope.scope_assumptions.length})
            </Button>
            {showAssumptions && (
              <ul className="space-y-1 border-t px-4 py-3 text-sm text-gray-900">
                {scope.scope_assumptions.map((item, i) => (
                  <li key={i}>· {item}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface StatProps {
  label: string
  value: number
  accent?: "blue" | "violet" | "red" | "muted"
}

const STAT_STYLES: Record<NonNullable<StatProps["accent"]>, string> = {
  blue: "text-blue-700",
  violet: "text-violet-700",
  red: "text-red-700",
  muted: "text-gray-500",
}

function Stat({ label, value, accent }: StatProps) {
  return (
    <div className="rounded-md border bg-white p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          accent ? STAT_STYLES[accent] : "text-gray-900",
        )}
      >
        {value}
      </div>
    </div>
  )
}
