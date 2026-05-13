"use client"

import { Fragment, useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  ChevronDown, ChevronRight, Search, RefreshCw, AlertCircle,
  ExternalLink, Trash2, Clock, CheckCircle, Archive, Send,
  Inbox, Building2, Calendar, DollarSign,
} from "lucide-react"
import { api, APIError, type RFXHistoryItem } from "@/lib/api"
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog"
import { showSuccessToast, showErrorToast } from "@/lib/toast"

// ─── Types ────────────────────────────────────────────────────────────────────

type AgenticStatus = "in_progress" | "processed" | "sent" | "accepted"
type Priority = "low" | "medium" | "high" | "urgent"

// ─── Config maps ──────────────────────────────────────────────────────────────

const STATUS_GROUPS: {
  key: AgenticStatus
  label: string
  icon: React.ReactNode
  rowClass: string
  dotClass: string
}[] = [
  {
    key: "in_progress",
    label: "In Progress",
    icon: <Clock className="h-3.5 w-3.5" />,
    rowClass: "text-blue-700 bg-blue-50/80 border-blue-100",
    dotClass: "bg-blue-400",
  },
  {
    key: "processed",
    label: "Processed",
    icon: <Archive className="h-3.5 w-3.5" />,
    rowClass: "text-cyan-700 bg-cyan-50/80 border-cyan-100",
    dotClass: "bg-cyan-400",
  },
  {
    key: "sent",
    label: "Sent",
    icon: <Send className="h-3.5 w-3.5" />,
    rowClass: "text-indigo-700 bg-indigo-50/80 border-indigo-100",
    dotClass: "bg-indigo-400",
  },
  {
    key: "accepted",
    label: "Accepted",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    rowClass: "text-emerald-700 bg-emerald-50/80 border-emerald-100",
    dotClass: "bg-emerald-400",
  },
]

const PRIORITY_CONFIG: Record<Priority, { label: string; cls: string }> = {
  low:    { label: "Low",    cls: "border-slate-200 bg-slate-50 text-slate-600" },
  medium: { label: "Normal", cls: "border-blue-200 bg-blue-50 text-blue-600" },
  high:   { label: "High",   cls: "border-amber-200 bg-amber-50 text-amber-700" },
  urgent: { label: "Urgent", cls: "border-red-200 bg-red-50 text-red-600" },
}

const CLIENT_COLORS = [
  "border-red-200 bg-red-50 text-red-700",
  "border-violet-200 bg-violet-50 text-violet-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-amber-200 bg-amber-50 text-amber-800",
  "border-blue-200 bg-blue-50 text-blue-700",
  "border-pink-200 bg-pink-50 text-pink-700",
  "border-teal-200 bg-teal-50 text-teal-700",
  "border-orange-200 bg-orange-50 text-orange-800",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashClientColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return CLIENT_COLORS[Math.abs(h) % CLIENT_COLORS.length]
}

function formatMoney(value?: number | null): string {
  if (!value) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value?: string | null): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(new Date(value))
}

function initials(name?: string): string {
  if (!name) return "?"
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority?: string }) {
  const cfg = PRIORITY_CONFIG[(priority as Priority) ?? "medium"] ?? PRIORITY_CONFIG.medium
  return (
    <Badge variant="outline" className={cn("text-xs font-medium whitespace-nowrap", cfg.cls)}>
      {cfg.label}
    </Badge>
  )
}

function ClientBadge({ name }: { name?: string }) {
  if (!name) return <span className="text-xs text-muted-foreground">—</span>
  const short = name.length > 12 ? name.slice(0, 11) + "…" : name
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium max-w-[120px] truncate", hashClientColor(name))}
      title={name}
    >
      {short}
    </Badge>
  )
}

function PersonCell({ user }: { user?: RFXHistoryItem["processed_by"] }) {
  if (!user) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-1.5">
      <Avatar className="h-5 w-5">
        <AvatarImage src={user.avatar_url} alt={user.name} />
        <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
          {initials(user.name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs text-muted-foreground truncate max-w-[90px]" title={user.name}>
        {user.name}
      </span>
    </div>
  )
}

// ─── Group header row ─────────────────────────────────────────────────────────

interface GroupHeaderProps {
  group: (typeof STATUS_GROUPS)[number]
  count: number
  collapsed: boolean
  onToggle: () => void
}

function GroupHeader({ group, count, collapsed, onToggle }: GroupHeaderProps) {
  return (
    <TableRow
      className={cn(
        "border-b cursor-pointer select-none hover:brightness-95 transition-all",
        group.rowClass,
      )}
      onClick={onToggle}
    >
      <TableCell colSpan={10} className="py-2 px-4">
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          )}
          <span className={cn("h-2 w-2 rounded-full", group.dotClass)} />
          <span className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wide">
            {group.icon}
            {group.label}
          </span>
          <Badge
            variant="secondary"
            className="h-4 px-1.5 text-[10px] font-bold bg-white/60 text-inherit border border-current/20 ml-1"
          >
            {count}
          </Badge>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 50

export function RFXDataTable() {
  const router = useRouter()

  const [items, setItems] = useState<RFXHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<AgenticStatus | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all")

  const [collapsed, setCollapsed] = useState<Partial<Record<AgenticStatus, boolean>>>({})

  const [deleteDialog, setDeleteDialog] = useState<{ id: string; title: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Data fetching ────────────────────────────────────────────────────────────

  const load = async (offset = 0, append = false) => {
    try {
      append ? setIsLoadingMore(true) : setIsLoading(true)
      setError(false)
      const res = offset === 0
        ? await api.getLatestRFX(PAGE_SIZE)
        : await api.loadMoreRFX(offset, PAGE_SIZE)
      setHasMore(Boolean(res.pagination?.has_more))
      setNextOffset(res.pagination?.next_offset ?? 0)
      setItems((prev) => (append ? [...prev, ...res.data] : res.data))
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Filtering + grouping ─────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return items.filter((item) => {
      if (statusFilter !== "all" && item.agentic_status !== statusFilter) return false
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false
      if (!term) return true
      return (
        item.title?.toLowerCase().includes(term) ||
        (item.company_name ?? item.client)?.toLowerCase().includes(term) ||
        item.client?.toLowerCase().includes(term) ||
        item.rfx_code?.toLowerCase().includes(term) ||
        item.rfxId?.toLowerCase().includes(term)
      )
    })
  }, [items, search, statusFilter, priorityFilter])

  const grouped = useMemo(() => {
    const map = new Map<AgenticStatus, RFXHistoryItem[]>()
    STATUS_GROUPS.forEach((g) => map.set(g.key, []))
    filtered.forEach((item) => {
      const key = (item.agentic_status as AgenticStatus) ?? "in_progress"
      const bucket = map.get(key) ?? map.get("in_progress")!
      bucket.push(item)
    })
    return map
  }, [filtered])

  // ── Actions ──────────────────────────────────────────────────────────────────

  const toggleGroup = (key: AgenticStatus) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))

  const openRfx = (id: string) => router.push(`/rfx-result-wrapper-v2/data/${id}`)

  const confirmDelete = async () => {
    if (!deleteDialog) return
    setIsDeleting(true)
    try {
      await api.deleteRFX(deleteDialog.id)
      localStorage.removeItem("sidebar-recent-rfx")
      setItems((prev) => prev.filter((i) => i.id !== deleteDialog.id))
      showSuccessToast({ title: "Intake deleted", message: `"${deleteDialog.title}" was deleted successfully.` })
    } catch (err) {
      const msg =
        err instanceof APIError && err.status === 403
          ? "Only the creator can delete this intake."
          : "Could not delete intake."
      showErrorToast({ title: "Delete failed", message: msg })
    } finally {
      setIsDeleting(false)
      setDeleteDialog(null)
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-2 p-1">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-destructive/60" />
        <p className="text-sm text-muted-foreground">Error loading intakes.</p>
        <Button variant="outline" size="sm" onClick={() => load()} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const totalFiltered = filtered.length

  return (
    <div className="flex flex-col gap-4">

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, client or code..."
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AgenticStatus | "all")}>
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_GROUPS.map((g) => (
                <SelectItem key={g.key} value={g.key}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as Priority | "all")}>
            <SelectTrigger className="h-9 w-[150px] text-xs">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {(Object.entries(PRIORITY_CONFIG) as [Priority, { label: string; cls: string }][]).map(
                ([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>
              )}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => load()}
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {totalFiltered} intake{totalFiltered !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      {totalFiltered === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center gap-3">
          <Inbox className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            {items.length === 0 ? "No intakes yet" : "No results for the current filter"}
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-xs">
                <TableHead className="w-[260px] min-w-[200px]">Name</TableHead>
                <TableHead className="whitespace-nowrap hidden sm:table-cell">Date</TableHead>
                <TableHead className="whitespace-nowrap hidden md:table-cell">Priority</TableHead>
                <TableHead className="whitespace-nowrap hidden md:table-cell">Client</TableHead>
                <TableHead className="whitespace-nowrap hidden lg:table-cell">Processed by</TableHead>
                <TableHead className="whitespace-nowrap hidden lg:table-cell text-right">Budget</TableHead>
                <TableHead className="whitespace-nowrap hidden lg:table-cell text-right">Cost</TableHead>
                <TableHead className="whitespace-nowrap hidden xl:table-cell">Requester</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {STATUS_GROUPS.map((group) => {
                const rows = grouped.get(group.key) ?? []
                if (rows.length === 0 && statusFilter !== "all") return null
                const isCollapsed = !!collapsed[group.key]

                return (
                  <Fragment key={group.key}>
                    <GroupHeader
                      group={group}
                      count={rows.length}
                      collapsed={isCollapsed}
                      onToggle={() => toggleGroup(group.key)}
                    />

                    {!isCollapsed &&
                      rows.map((rfx) => (
                        <TableRow
                          key={rfx.id}
                          className="hover:bg-muted/30 cursor-pointer text-sm group"
                          onClick={() => openRfx(rfx.id)}
                        >
                          {/* Name */}
                          <TableCell className="max-w-[260px]">
                            <div className="font-medium truncate" title={rfx.title}>
                              {rfx.title || "Untitled"}
                            </div>
                            {rfx.rfx_code && (
                              <div className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">
                                {rfx.rfx_code}
                              </div>
                            )}
                          </TableCell>

                          {/* Date */}
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground hidden sm:table-cell">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 opacity-50" />
                              {formatDate(rfx.delivery_date ?? rfx.created_at ?? rfx.date)}
                            </div>
                          </TableCell>

                          {/* Priority */}
                          <TableCell className="hidden md:table-cell">
                            <PriorityBadge priority={rfx.priority} />
                          </TableCell>

                          {/* Client */}
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                              <ClientBadge name={rfx.company_name ?? rfx.client} />
                            </div>
                          </TableCell>

                          {/* Processed by */}
                          <TableCell className="hidden lg:table-cell">
                            <PersonCell user={rfx.processed_by} />
                          </TableCell>

                          {/* Budget */}
                          <TableCell className="hidden lg:table-cell whitespace-nowrap text-right text-xs tabular-nums">
                            <div className="flex items-center justify-end gap-1">
                              <DollarSign className="h-3 w-3 text-muted-foreground/40" />
                              <span>{formatMoney(rfx.estimated_budget)}</span>
                            </div>
                          </TableCell>

                          {/* Cost */}
                          <TableCell className="hidden lg:table-cell whitespace-nowrap text-right text-xs font-medium tabular-nums text-emerald-700">
                            {formatMoney(rfx.actual_cost ?? rfx.costo_total)}
                          </TableCell>

                          {/* Requester */}
                          <TableCell className="hidden xl:table-cell text-xs text-muted-foreground max-w-[140px]">
                            <span className="truncate block" title={rfx.client}>
                              {rfx.client || "—"}
                            </span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => { e.stopPropagation(); openRfx(rfx.id) }}
                                title="Open intake"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground/60 hover:text-destructive hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteDialog({ id: rfx.id, title: rfx.title })
                                }}
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => load(nextOffset, true)}
            disabled={isLoadingMore}
            className="gap-2"
          >
            {isLoadingMore ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading...</>
            ) : (
              <><RefreshCw className="h-3.5 w-3.5" /> Load more</>
            )}
          </Button>
        </div>
      )}

      <DeleteConfirmationDialog
        isOpen={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={confirmDelete}
        title="Delete intake"
        itemName={deleteDialog?.title ?? ""}
        isDeleting={isDeleting}
      />
    </div>
  )
}
