"use client";

/**
 * Home-screen compact table that surfaces the proposals most likely to need
 * the user's attention. Filters out terminal states (completed, cancelled)
 * and sorts by oldest last-activity, so stalest items bubble to the top.
 *
 * For the full master list with filters/search/pagination, the user goes
 * to /proposals (Phase 3).
 */

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Proposal } from "@/lib/api-proposals";
import {
  PROPOSAL_STAGE_TONES,
  getProposalStageLabel,
  type ProposalStageTone,
} from "@/lib/proposal-stage";

const TONE_BADGE_CLASS: Record<ProposalStageTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  danger: "border-red-200 bg-red-50 text-red-700",
};

const TERMINAL_STAGES = new Set(["completed", "cancelled"]);
const ITEM_LIMIT = 8;

function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return null;
  const diff = Date.now() - ts;
  if (diff < 0) return 0;
  return Math.floor(diff / 86_400_000);
}

interface ActionRequiredTableProps {
  proposals: Proposal[];
  onOpen?: (proposalId: string) => void;
  onViewAll?: () => void;
}

export function ActionRequiredTable({
  proposals,
  onOpen,
  onViewAll,
}: ActionRequiredTableProps) {
  const items = useMemo(() => {
    return proposals
      .filter((p) => !TERMINAL_STAGES.has(p.sales_stage))
      .map((p) => ({
        proposal: p,
        idleDays: daysSince(p.updated_at) ?? daysSince(p.created_at) ?? 0,
      }))
      .sort((a, b) => b.idleDays - a.idleDays)
      .slice(0, ITEM_LIMIT);
  }, [proposals]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base">Needs attention</CardTitle>
          <p className="text-xs text-muted-foreground">
            Top {ITEM_LIMIT} open proposals sorted by days idle. Everything else lives in
            the full list.
          </p>
        </div>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <p className="px-6 pb-6 pt-2 text-sm text-muted-foreground">
            Nothing pending. Every open proposal has been touched recently or has
            reached a terminal stage.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Idle</TableHead>
                <TableHead className="w-[44px]" aria-label="Open" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(({ proposal: p, idleDays }) => {
                const tone = PROPOSAL_STAGE_TONES[p.sales_stage];
                return (
                  <TableRow
                    key={p.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/40 transition-colors",
                      onOpen ? "" : "cursor-default",
                    )}
                    onClick={() => onOpen?.(p.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="truncate max-w-[280px]">
                        {p.client?.name || "Unknown client"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[280px]">
                        {p.title || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                          TONE_BADGE_CLASS[tone],
                        )}
                      >
                        {getProposalStageLabel(p.sales_stage)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {idleDays === 0 ? "today" : `${idleDays}d`}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
