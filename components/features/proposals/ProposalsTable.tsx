"use client";

/**
 * Master table for the Proposals workspace (Phase 3 of the unification).
 *
 * Replaces both the legacy OpportunityTable (components/features/budy) and
 * RFXDataTable (components/features/rfx) consumption sites. New code should
 * import from here.
 *
 * Filtering is two-level:
 *  - Group chips at the top (All / Open / Won / Lost) using the canonical
 *    PROPOSAL_STAGE_GROUPS from `proposal-stage.ts`. Counts shown inline.
 *  - Search box filters by client name, title, or industry within the
 *    active group.
 */

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  Inbox,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  PROPOSAL_STAGE_TONES,
  getProposalStageGroup,
  getProposalStageLabel,
  type ProposalStageGroup,
  type ProposalStageTone,
} from "@/lib/proposal-stage";

const TONE_BADGE_CLASS: Record<ProposalStageTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  danger: "border-red-200 bg-red-50 text-red-700",
};

type GroupFilter = "all" | ProposalStageGroup;

const GROUP_FILTER_ORDER: GroupFilter[] = ["all", "open", "won", "lost"];
const GROUP_LABEL: Record<GroupFilter, string> = {
  all: "All",
  open: "Open",
  won: "Won",
  lost: "Lost",
};

function formatMoney(value: number | undefined): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

interface ProposalsTableProps {
  proposals: Proposal[];
  onOpenProposal?: (proposalId: string) => void;
}

export function ProposalsTable({
  proposals,
  onOpenProposal,
}: ProposalsTableProps) {
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const [search, setSearch] = useState("");

  const groupCounts = useMemo(() => {
    const counts: Record<GroupFilter, number> = {
      all: proposals.length,
      open: 0,
      won: 0,
      lost: 0,
    };
    for (const p of proposals) {
      counts[getProposalStageGroup(p.sales_stage)] += 1;
    }
    return counts;
  }, [proposals]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return proposals
      .filter((p) =>
        groupFilter === "all"
          ? true
          : getProposalStageGroup(p.sales_stage) === groupFilter,
      )
      .filter((p) => {
        if (!term) return true;
        return (
          p.title?.toLowerCase().includes(term) ||
          p.client?.name?.toLowerCase().includes(term) ||
          p.industry_context?.toLowerCase().includes(term) ||
          p.industry_label?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const aDate = a.updated_at
          ? new Date(a.updated_at).getTime()
          : a.created_at
            ? new Date(a.created_at).getTime()
            : 0;
        const bDate = b.updated_at
          ? new Date(b.updated_at).getTime()
          : b.created_at
            ? new Date(b.created_at).getTime()
            : 0;
        return bDate - aDate;
      });
  }, [proposals, groupFilter, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {GROUP_FILTER_ORDER.map((group) => {
            const active = groupFilter === group;
            const count = groupCounts[group];
            return (
              <button
                key={group}
                type="button"
                onClick={() => setGroupFilter(group)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted",
                )}
              >
                <span>{GROUP_LABEL[group]}</span>
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

        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by client, title, or industry"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">
            {proposals.length === 0
              ? "No proposals yet"
              : "No matches for the current filter"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {proposals.length === 0
              ? "Proposals will appear here as they are created."
              : "Try a different group or clear the search."}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Proposal</TableHead>
                <TableHead className="hidden md:table-cell">Client</TableHead>
                <TableHead className="whitespace-nowrap">Stage</TableHead>
                <TableHead className="whitespace-nowrap text-right">Value</TableHead>
                <TableHead className="hidden whitespace-nowrap xl:table-cell">
                  Service date
                </TableHead>
                <TableHead className="hidden whitespace-nowrap 2xl:table-cell">
                  Industry
                </TableHead>
                <TableHead className="w-[80px] text-right sm:w-[110px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const tone = PROPOSAL_STAGE_TONES[p.sales_stage];
                return (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell className="max-w-[1px] font-medium">
                      <button
                        type="button"
                        onClick={() => onOpenProposal?.(p.id)}
                        className="block w-full truncate text-left hover:underline"
                        title={p.title}
                      >
                        {p.title || "Untitled proposal"}
                      </button>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground md:hidden">
                        {p.client?.name || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[1px] text-sm text-muted-foreground md:table-cell">
                      <div className="truncate" title={p.client?.name || ""}>
                        {p.client?.name || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={TONE_BADGE_CLASS[tone]}
                      >
                        {getProposalStageLabel(p.sales_stage)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
                      {formatMoney(p.proposal?.total_cost)}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground xl:table-cell">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{formatDate(p.service?.service_start_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell">
                      {p.industry_context ? (
                        <Badge variant="outline" className="text-xs">
                          {p.industry_label || p.industry_context}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenProposal?.(p.id)}
                        aria-label="Open proposal"
                      >
                        <ExternalLink className="h-3.5 w-3.5 sm:mr-1.5" />
                        <span className="hidden sm:inline">Open</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
