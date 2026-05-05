"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ExternalLink, Inbox, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { SALES_STAGE_LABELS, type Opportunity, type SalesStage } from "@/lib/api-budy";

const STAGE_ORDER: SalesStage[] = [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "payment_pending",
  "partially_paid",
  "confirmed",
  "in_execution",
  "completed",
  "cancelled",
];

const STAGE_BADGE_CLASS: Record<SalesStage, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  sent: "border-sky-200 bg-sky-50 text-sky-700",
  viewed: "border-blue-200 bg-blue-50 text-blue-700",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  payment_pending: "border-amber-200 bg-amber-50 text-amber-800",
  partially_paid: "border-orange-200 bg-orange-50 text-orange-800",
  confirmed: "border-emerald-300 bg-emerald-100 text-emerald-800",
  in_execution: "border-violet-200 bg-violet-50 text-violet-700",
  completed: "border-emerald-300 bg-emerald-100 text-emerald-800",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

function formatMoney(value: number | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

interface OpportunityTableProps {
  opportunities: Opportunity[];
  onStageChange?: (opportunityId: string, stage: SalesStage) => void;
  onOpenOpportunity?: (opportunityId: string) => void;
}

export function OpportunityTable({
  opportunities,
  onStageChange,
  onOpenOpportunity,
}: OpportunityTableProps) {
  const [stageFilter, setStageFilter] = useState<SalesStage | "all">("all");
  const [search, setSearch] = useState("");

  const stageCounts = useMemo(() => {
    const counts: Partial<Record<SalesStage, number>> = {};
    for (const opp of opportunities) {
      counts[opp.sales_stage] = (counts[opp.sales_stage] || 0) + 1;
    }
    return counts;
  }, [opportunities]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return opportunities
      .filter((opp) => stageFilter === "all" || opp.sales_stage === stageFilter)
      .filter((opp) => {
        if (!term) return true;
        return (
          opp.title.toLowerCase().includes(term) ||
          opp.client.name?.toLowerCase().includes(term) ||
          opp.industry_context?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const stageDiff = STAGE_ORDER.indexOf(a.sales_stage) - STAGE_ORDER.indexOf(b.sales_stage);
        if (stageDiff !== 0) return stageDiff;
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
      });
  }, [opportunities, stageFilter, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, client, or industry"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Stage</span>
          <Select value={stageFilter} onValueChange={(value) => setStageFilter(value as SalesStage | "all")}>
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages ({opportunities.length})</SelectItem>
              {STAGE_ORDER.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {SALES_STAGE_LABELS[stage]} ({stageCounts[stage] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">
            {opportunities.length === 0 ? "No opportunities yet" : "No matches for the current filter"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {opportunities.length === 0
              ? "Opportunities will appear here as they are created."
              : "Try a different stage filter or search term."}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Opportunity</TableHead>
                <TableHead className="hidden md:table-cell">Client</TableHead>
                <TableHead className="whitespace-nowrap">Stage</TableHead>
                <TableHead className="whitespace-nowrap text-right">Value</TableHead>
                <TableHead className="hidden whitespace-nowrap xl:table-cell">Service date</TableHead>
                <TableHead className="hidden whitespace-nowrap 2xl:table-cell">Industry</TableHead>
                <TableHead className="w-[80px] text-right sm:w-[110px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((opportunity) => (
                <TableRow key={opportunity.id} className="hover:bg-muted/30">
                  <TableCell className="max-w-[1px] font-medium">
                    <button
                      type="button"
                      onClick={() => onOpenOpportunity?.(opportunity.id)}
                      className="block w-full truncate text-left hover:underline"
                      title={opportunity.title}
                    >
                      {opportunity.title}
                    </button>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground md:hidden">
                      {opportunity.client.name || "—"}
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-[1px] text-sm text-muted-foreground md:table-cell">
                    <div className="truncate" title={opportunity.client.name || ""}>
                      {opportunity.client.name || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {onStageChange ? (
                      <Select
                        value={opportunity.sales_stage}
                        onValueChange={(value) => onStageChange(opportunity.id, value as SalesStage)}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-8 w-[150px] border text-xs font-medium",
                            STAGE_BADGE_CLASS[opportunity.sales_stage],
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STAGE_ORDER.map((stage) => (
                            <SelectItem key={stage} value={stage}>
                              {SALES_STAGE_LABELS[stage]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={STAGE_BADGE_CLASS[opportunity.sales_stage]}>
                        {SALES_STAGE_LABELS[opportunity.sales_stage]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
                    {formatMoney(opportunity.proposal?.total_cost)}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground xl:table-cell">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>{formatDate(opportunity.service?.service_start_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden 2xl:table-cell">
                    {opportunity.industry_context ? (
                      <Badge variant="outline" className="text-xs">
                        {opportunity.industry_context}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenOpportunity?.(opportunity.id)}
                      aria-label="Open opportunity"
                    >
                      <ExternalLink className="h-3.5 w-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Open</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
