"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  Upload,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  Pencil,
  Plus,
  Minus,
  Coins,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import {
  api,
  APIError,
  type TimelineItem,
  type TimelineDocumentItem,
  type TimelineEventItem,
  type TimelineCollapsedItem,
} from "@/lib/api"

interface ChangeHistoryContentProps {
  rfxId?: string
  isDisabled?: boolean
}

const PAGE_SIZE = 50

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
}

function formatTs(ts?: string): string {
  if (!ts) return ""
  try {
    return new Date(ts).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ts
  }
}

function eventIcon(eventType: string) {
  switch (eventType) {
    case "rfx_processed":
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "product_added":
      return <Plus className="h-4 w-4 text-blue-600" />
    case "product_deleted":
      return <Minus className="h-4 w-4 text-red-600" />
    case "currency_updated":
    case "budget_updated":
      return <Coins className="h-4 w-4 text-amber-600" />
    case "title_updated":
      return <Pencil className="h-4 w-4 text-purple-600" />
    case "source_doc_persist_failed":
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    case "document_uploaded":
      return <Upload className="h-4 w-4 text-blue-600" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

function eventDescription(item: TimelineEventItem): string {
  if (item.description) return item.description
  const nv = item.new_values || {}
  switch (item.event_type) {
    case "rfx_processed":
      return "RFX procesado con éxito"
    case "product_added":
      return `Producto agregado: ${(nv as any).product_name || ""}`.trim()
    case "product_deleted":
      return `Producto eliminado: ${(nv as any).product_name || ""}`.trim()
    case "currency_updated":
      return `Moneda actualizada a ${(nv as any).currency || ""}`.trim()
    case "budget_updated":
      return "Presupuesto actualizado"
    case "title_updated":
      return "Título actualizado"
    case "completed":
      return "RFX finalizado"
    case "document_uploaded": {
      const v = (nv as any).version
      const fn = (nv as any).filename
      return v && fn ? `Documento subido (v${v}): ${fn}` : "Documento subido"
    }
    case "source_doc_persist_failed":
      return "No se pudo preservar el documento original"
    default:
      return item.event_type
  }
}

function DocumentRow({
  rfxId,
  item,
  isDisabled,
}: {
  rfxId: string
  item: TimelineDocumentItem
  isDisabled?: boolean
}) {
  const kindLabel =
    item.kind === "source"
      ? "Original"
      : item.kind === "amendment"
      ? "Enmienda"
      : "Adjunto"
  const kindClass =
    item.kind === "source"
      ? "bg-green-100 text-green-800"
      : item.kind === "amendment"
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-800"

  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="mt-0.5">
        <FileText className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-gray-900">{item.filename}</span>
          <Badge className={kindClass}>{kindLabel}</Badge>
          <Badge variant="outline">v{item.version}</Badge>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatBytes(item.size_bytes)}</span>
          <span>•</span>
          <span>{formatTs(item.ts)}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={api.documents.downloadUrl(rfxId, item.document_id)}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Button variant="outline" size="sm" disabled={isDisabled} className="gap-1">
            <Download className="h-3 w-3" />
            Descargar
          </Button>
        </a>
      </div>
    </div>
  )
}

function EventRow({ item }: { item: TimelineEventItem }) {
  const isWarning = item.event_type === "source_doc_persist_failed"
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 ${
        isWarning ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="mt-0.5">{eventIcon(item.event_type)}</div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${isWarning ? "font-medium text-red-800" : "text-gray-900"}`}>
          {eventDescription(item)}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatTs(item.ts)}</span>
          {item.performed_by && item.performed_by !== "system" && item.performed_by !== "system_ai" && (
            <>
              <span>•</span>
              <span>por {item.performed_by}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CollapsedRow({ item }: { item: TimelineCollapsedItem }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
      <div className="mt-0.5">
        <RefreshCw className="h-4 w-4 text-gray-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800">{item.description}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatTs(item.span_end)}</span>
          <span>•</span>
          <span>{item.count} eventos agrupados</span>
        </div>
      </div>
    </div>
  )
}

export default function ChangeHistoryContent({ rfxId, isDisabled }: ChangeHistoryContentProps) {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const loadInitial = useCallback(async () => {
    if (!rfxId) return
    setLoading(true)
    setError(null)
    try {
      const resp = await api.documents.getTimeline(rfxId, { pageSize: PAGE_SIZE })
      setItems(resp.items || [])
      setHasMore(!!resp.has_more)
      setNextCursor(resp.next_cursor)
    } catch (e) {
      const msg = e instanceof APIError ? e.message : "No se pudo cargar el historial"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [rfxId])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  const loadMore = useCallback(async () => {
    if (!rfxId || !nextCursor) return
    setLoading(true)
    try {
      const resp = await api.documents.getTimeline(rfxId, {
        cursor: nextCursor,
        pageSize: PAGE_SIZE,
      })
      setItems((prev) => [...prev, ...(resp.items || [])])
      setHasMore(!!resp.has_more)
      setNextCursor(resp.next_cursor)
    } catch (e) {
      const msg = e instanceof APIError ? e.message : "No se pudo cargar más"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [rfxId, nextCursor])

  const handleUploadClick = () => {
    if (isDisabled || uploading || !rfxId) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !rfxId) return
    setUploading(true)
    try {
      await api.documents.upload(rfxId, file, "amendment")
      toast.success(`Documento subido: ${file.name}`)
      await loadInitial()
    } catch (err) {
      let msg = "No se pudo subir el documento"
      if (err instanceof APIError) {
        if (err.status === 413) msg = "El archivo excede 25 MB"
        else if (err.status === 400) msg = err.message || "Formato no permitido"
        else msg = err.message || msg
      }
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const sourceDoc = items.find(
    (it): it is TimelineDocumentItem => it.type === "document" && it.kind === "source"
  )
  const hasFailedSource = items.some(
    (it) => it.type === "event" && it.event_type === "source_doc_persist_failed"
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-800">Historial de cambios</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Documentos originales, enmiendas del cliente y cambios sobre el RFX en orden cronológico.
            </p>
          </div>
          <Button onClick={handleUploadClick} disabled={isDisabled || uploading || !rfxId} className="gap-2">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Subir nueva versión
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
          />
        </CardHeader>
        <CardContent>
          {!rfxId && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Guarda el RFX para ver su historial.
            </p>
          )}
          {rfxId && !loading && !sourceDoc && !hasFailedSource && items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin actividad registrada todavía.
            </p>
          )}
          {rfxId && !loading && !sourceDoc && (hasFailedSource || items.length > 0) && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Documento original no preservado para este RFX.
              {hasFailedSource && " La preservación falló durante el intake. Puedes re-subirlo con el botón Subir nueva versión."}
              {!hasFailedSource && " Este RFX fue creado antes del rollout del almacén de documentos."}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {items.map((item, idx) => {
              if (item.type === "document") {
                return <DocumentRow key={`d-${item.document_id}`} rfxId={rfxId!} item={item} isDisabled={isDisabled} />
              }
              if (item.type === "event_collapsed") {
                return <CollapsedRow key={`c-${idx}-${item.ts}`} item={item} />
              }
              return <EventRow key={`e-${item.id || idx}`} item={item} />
            })}
          </div>

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Ver más
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
