"use client";

/**
 * Master table for the Proposals workspace.
 *
 * Replaces both the legacy OpportunityTable (components/features/budy) and
 * RFXDataTable (components/features/rfx). Keeps the rich visual language
 * of the old table — grouped collapsible rows colored per stage, hashed
 * client badges, skeleton loading — but speaks the unified Proposal
 * vocabulary and consumes the Budy Opportunity shape via proposalsApi.
 */

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  Building2,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Inbox,
  RefreshCw,
  Search,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Proposal } from "@/lib/api-proposals";
import {
  PROPOSAL_STAGE_GROUPS,
  type ProposalStage,
  type ProposalStageGroup,
} from "@/lib/proposal-stage";

type GroupFilter = "all" | ProposalStageGroup;

interface StageGroupConfig {
  key: ProposalStage;
  label: string;
  icon: React.ReactNode;
  rowClass: string;
  dotClass: string;
}

const STAGE_GROUPS: StageGroupConfig[] = [
  {
    key: "draft",
    label: "Draft",
    icon: <FileText className="h-3.5 w-3.5" />,
    rowClass: "text-slate-700 bg-slate-50/80 border-slate-100",
    dotClass: "bg-slate-400",
  },
  {
    key: "sent",
    label: "Sent",
    icon: <Send className="h-3.5 w-3.5" />,
    rowClass: "text-sky-700 bg-sky-50/80 border-sky-100",
    dotClass: "bg-sky-400",
  },
  {
    key: "viewed",
    label: "Viewed",
    icon: <Archive className="h-3.5 w-3.5" />,
    rowClass: "text-blue-700 bg-blue-50/80 border-blue-100",
    dotClass: "bg-blue-400",
  },
  {
    key: "accepted",
    label: "Accepted",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    rowClass: "text-emerald-700 bg-emerald-50/80 border-emerald-100",
    dotClass: "bg-emerald-400",
  },
  {
    key: "payment_pending",
    label: "Payment pending",
    icon: <Clock className="h-3.5 w-3.5" />,
    rowClass: "text-amber-800 bg-amber-50/80 border-amber-100",
    dotClass: "bg-amber-400",
  },
  {
    key: "partially_paid",
    label: "Partially paid",
    icon: <Clock className="h-3.5 w-3.5" />,
    rowClass: "text-orange-800 bg-orange-50/80 border-orange-100",
    dotClass: "bg-orange-400",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    rowClass: "text-emerald-800 bg-emerald-100/60 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  {
    key: "in_execution",
    label: "In execution",
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    rowClass: "text-violet-700 bg-violet-50/80 border-violet-100",
    dotClass: "bg-violet-400",
  },
  {
    key: "completed",
    label: "Completed",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    rowClass: "text-emerald-800 bg-emerald-100/60 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    icon: <XCircle className="h-3.5 w-3.5" />,
    rowClass: "text-red-700 bg-red-50/80 border-red-100",
    dotClass: "bg-red-400",
  },
];

const CLIENT_COLORS = [
  "border-red-200 bg-red-50 text-red-700",
  "border-violet-200 bg-violet-50 text-violet-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-amber-200 bg-amber-50 text-amber-800",
  "border-blue-200 bg-blue-50 text-blue-700",
  "border-pink-200 bg-pink-50 text-pink-700",
  "border-teal-200 bg-teal-50 text-teal-700",
  "border-orange-200 bg-orange-50 text-orange-800",
];

function hashClientColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return CLIENT_COLORS[Math.abs(h) % CLIENT_COLORS.length];
}

function formatMoney(value?: number | null): string {
  if (!value) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(date);
}

function ClientBadge({ name }: { name?: string }) {
  if (!name) return <span className="text-xs text-muted-foreground">—</span>;
  const short = name.length > 14 ? name.slice(0, 13) + "…" : name;
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium max-w-[140px] truncate",
        hashClientColor(name),
      )}
      title={name}
    >
      {short}
    </Badge>
  );
}

interface GroupHeaderProps {
  config: StageGroupConfig;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}

function GroupHeader({ config, count, collapsed, onToggle }: GroupHeaderProps) {
  return (
    <TableRow
      className={cn(
        "border-b cursor-pointer select-none hover:brightness-95 transition-all",
        config.rowClass,
      )}
      onClick={onToggle}
    >
      <TableCell colSpan={8} className="py-2 px-4">
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          )}
          <span className={cn("h-2 w-2 rounded-full", config.dotClass)} />
          <span className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wide">
            {config.icon}
            {config.label}
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
  );
}

interface ProposalsTableProps {
  proposals: Proposal[];
  isLoading?: boolean;
  error?: boolean;
  onOpenProposal?: (proposalId: string) => void;
  onDeleteProposal?: (proposalId: string, title: string) => void;
  onRefresh?: () => void;
}

export function ProposalsTable({
  proposals,
  isLoading = false,
  error = false,
  onOpenProposal,
  onDeleteProposal,
  onRefresh,
}: ProposalsTableProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<ProposalStage | "all">("all");
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const [collapsed, setCollapsed] = useState<Partial<Record<ProposalStage, boolean>>>({});
  const [page, setPage] = useState<Partial<Record<ProposalStage, number>>>({});

  useEffect(() => {
    setPage({});
  }, [search, stageFilter, groupFilter]);

  const groupCounts = useMemo(() => {
    const counts: Record<GroupFilter, number> = {
      all: proposals.length,
      open: 0,
      won: 0,
      lost: 0,
    };
    for (const p of proposals) {
      if ((PROPOSAL_STAGE_GROUPS.open as readonly ProposalStage[]).includes(p.sales_stage)) counts.open += 1;
      else if ((PROPOSAL_STAGE_GROUPS.won as readonly ProposalStage[]).includes(p.sales_stage)) counts.won += 1;
      else counts.lost += 1;
    }
    return counts;
  }, [proposals]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return proposals.filter((p) => {
      if (stageFilter !== "all" && p.sales_stage !== stageFilter) return false;
      if (groupFilter !== "all") {
        const inGroup = (PROPOSAL_STAGE_GROUPS[groupFilter] as readonly ProposalStage[]).includes(p.sales_stage);
        if (!inGroup) return false;
      }
      if (!term) return true;
      return (
        p.title?.toLowerCase().includes(term) ||
        p.client?.name?.toLowerCase().includes(term) ||
        p.industry_context?.toLowerCase().includes(term) ||
        p.industry_label?.toLowerCase().includes(term) ||
        p.proposal?.proposal_code?.toLowerCase().includes(term)
      );
    });
  }, [proposals, search, stageFilter, groupFilter]);

  const grouped = useMemo(() => {
    const map = new Map<ProposalStage, Proposal[]>();
    for (const cfg of STAGE_GROUPS) map.set(cfg.key, []);
    for (const p of filtered) {
      const bucket = map.get(p.sales_stage) ?? map.get("draft")!;
      bucket.push(p);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        const aDate = new Date(a.updated_at || a.created_at || 0).getTime();
        const bDate = new Date(b.updated_at || b.created_at || 0).getTime();
        return bDate - aDate;
      });
    }
    return map;
  }, [filtered]);

  const toggleGroup = (key: ProposalStage) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleRowClick = (proposalId: string) => onOpenProposal?.(proposalId);

  if (isLoading) {
    return (
      <div className="space-y-2 p-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-destructive/60" />
        <p className="text-sm text-muted-foreground">Error loading proposals.</p>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        )}
      </div>
    );
  }

  const totalFiltered = filtered.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "open", "won", "lost"] as GroupFilter[]).map((group) => {
            const active = groupFilter === group;
            const count = groupCounts[group];
            const label = group === "all" ? "All" : group.charAt(0).toUpperCase() + group.slice(1);
            return (
              <button
                key={group}
                type="button"
                onClick={() => {
                  setGroupFilter(group);
                  setStageFilter("all");
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted",
                )}
              >
                <span>{label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, client, code…"
              className="pl-9 h-9"
            />
          </div>
          <Select
            value={stageFilter}
            onValueChange={(v) => setStageFilter(v as ProposalStage | "all")}
          >
            <SelectTrigger className="h-9 w-[170px] text-xs">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {STAGE_GROUPS.map((g) => (
                <SelectItem key={g.key} value={g.key}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onRefresh}
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {totalFiltered} proposal{totalFiltered !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {totalFiltered === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center gap-3">
          <Inbox className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            {proposals.length === 0
              ? "No proposals yet"
              : "No results for the current filter"}
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-xs">
                <TableHead className="w-[280px] min-w-[220px]">Proposal</TableHead>
                <TableHead className="whitespace-nowrap hidden sm:table-cell">Service date</TableHead>
                <TableHead className="whitespace-nowrap hidden md:table-cell">Client</TableHead>
                <TableHead className="whitespace-nowrap hidden lg:table-cell">Industry</TableHead>
                <TableHead className="whitespace-nowrap hidden xl:table-cell">Created</TableHead>
                <TableHead className="whitespace-nowrap hidden lg:table-cell text-right">Value</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {STAGE_GROUPS.map((config) => {
                const rows = grouped.get(config.key) ?? [];
                if (rows.length === 0 && stageFilter !== "all") return null;
                if (rows.length === 0 && stageFilter === "all" && groupFilter !== "all") return null;
                const isCollapsed = Boolean(collapsed[config.key]);
                if (rows.length === 0 && stageFilter === "all" && groupFilter === "all") {
                  return null;
                }

                const pageSize = 20;
                const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
                const currentPage = Math.min(page[config.key] ?? 0, totalPages - 1);
                const pageRows = rows.slice(currentPage * pageSize, currentPage * pageSize + pageSize);
                const showPager = rows.length > pageSize;

                return (
                  <Fragment key={config.key}>
                    <GroupHeader
                      config={config}
                      count={rows.length}
                      collapsed={isCollapsed}
                      onToggle={() => toggleGroup(config.key)}
                    />

                    {!isCollapsed &&
                      pageRows.map((p) => (
                        <TableRow
                          key={p.id}
                          className="hover:bg-muted/30 cursor-pointer text-sm group"
                          onClick={() => handleRowClick(p.id)}
                        >
                          <TableCell className="max-w-[280px]">
                            <div className="font-medium truncate" title={p.title}>
                              {p.title || "Untitled proposal"}
                            </div>
                            {p.proposal?.proposal_code && (
                              <div className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">
                                {p.proposal.proposal_code}
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground hidden sm:table-cell">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 opacity-50" />
                              {formatDate(p.service?.service_start_at)}
                            </div>
                          </TableCell>

                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                              <ClientBadge name={p.client?.name} />
                            </div>
                          </TableCell>

                          <TableCell className="hidden lg:table-cell">
                            {p.industry_label || p.industry_context ? (
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {p.industry_label || p.industry_context}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          <TableCell className="hidden xl:table-cell whitespace-nowrap text-xs text-muted-foreground">
                            {formatDate(p.created_at)}
                          </TableCell>

                          <TableCell className="hidden lg:table-cell whitespace-nowrap text-right text-xs font-medium tabular-nums">
                            <div className="flex items-center justify-end gap-1">
                              <DollarSign className="h-3 w-3 text-muted-foreground/40" />
                              <span>{formatMoney(p.proposal?.total_cost)}</span>
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenProposal?.(p.id);
                                }}
                                title="Open proposal"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                              {onDeleteProposal && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground/60 hover:text-destructive hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteProposal(p.id, p.title || "");
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}

                    {!isCollapsed && showPager && (
                      <TableRow className={cn("border-b", config.rowClass)}>
                        <TableCell colSpan={8} className="py-1.5 px-4">
                          <div className="flex items-center justify-end gap-2 text-xs">
                            <span className="tabular-nums opacity-70">
                              {currentPage * pageSize + 1}–
                              {Math.min((currentPage + 1) * pageSize, rows.length)} of {rows.length}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={currentPage === 0}
                              onClick={() =>
                                setPage((prev) => ({ ...prev, [config.key]: currentPage - 1 }))
                              }
                              title="Previous page"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <span className="tabular-nums font-medium">
                              {currentPage + 1} / {totalPages}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={currentPage >= totalPages - 1}
                              onClick={() =>
                                setPage((prev) => ({ ...prev, [config.key]: currentPage + 1 }))
                              }
                              title="Next page"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
