"use client";

/**
 * Workspace Home (Phase 2 of the Proposal unification).
 *
 * Replaces the legacy /dashboard ("Budy Workspace") and /overview ("RFX
 * Overview") screens with a single dashboard that consumes the unified
 * Proposal vocabulary from `lib/api-proposals`. Old routes still exist
 * during Phase 2-4; Phase 5 deletes them and updates the sidebar.
 *
 * URL is kept at /dashboard to preserve existing bookmarks and avoid
 * touching login redirects this round. The Next.js root group `app/page.tsx`
 * already owns "/" (marketing landing), so the workspace home cannot be a
 * sibling route file — /dashboard is the practical home URL.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Plus, FolderKanban } from "lucide-react";
import { LoadingSpinner, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { proposalsApi, type Proposal, type ProposalMetrics } from "@/lib/api-proposals";
import { isProposalOpen } from "@/lib/proposal-stage";
import {
  FunnelCard,
  TrendCard,
} from "@/components/features/proposals/ProposalCharts";
import { ActionRequiredTable } from "@/components/features/proposals/ActionRequiredTable";

const METRICS_RANGE_DAYS = 30;

function MetricCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tabular-nums">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

const EMPTY_FUNNEL: ProposalMetrics["funnel"] = {
  processed: 0,
  sent: 0,
  accepted: 0,
};

export default function HomePage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<ProposalMetrics | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsData, proposalList] = await Promise.all([
        proposalsApi.getMetrics(METRICS_RANGE_DAYS),
        proposalsApi.list(),
      ]);
      setMetrics(metricsData);
      setProposals(proposalList);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load the workspace",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const openCount = useMemo(
    () => proposals.filter((p) => isProposalOpen(p.sales_stage)).length,
    [proposals],
  );

  if (loading && !metrics) {
    return <LoadingSpinner text="Loading workspace…" fullScreen />;
  }

  return (
    <div className="space-y-6 p-4 lg:p-6 xl:p-8">
      <PageHeader
        title="Home"
        description="Pipeline metrics and proposals that need your attention."
        icon={LayoutDashboard}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/rfx")}>
              <FolderKanban className="mr-2 h-4 w-4" />
              All proposals
            </Button>
            <Button onClick={() => router.push("/intake")}>
              <Plus className="mr-2 h-4 w-4" />
              New proposal
            </Button>
          </>
        }
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Open proposals"
          value={openCount}
          hint="Draft, sent, or viewed"
        />
        <MetricCard
          title="In progress"
          value={metrics?.kpis.in_progress ?? 0}
          hint="Awaiting processing"
        />
        <MetricCard
          title="Sent"
          value={metrics?.kpis.sent ?? 0}
          hint={`Last ${METRICS_RANGE_DAYS} days`}
        />
        <MetricCard
          title="Acceptance rate"
          value={`${metrics?.kpis.acceptance_rate ?? 0}%`}
          hint={`${metrics?.kpis.accepted ?? 0} accepted / ${METRICS_RANGE_DAYS}d`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FunnelCard data={metrics?.funnel ?? EMPTY_FUNNEL} />
        <TrendCard
          data={metrics?.timeseries ?? []}
          rangeDays={METRICS_RANGE_DAYS}
        />
      </div>

      <ActionRequiredTable
        proposals={proposals}
        onOpen={(id) => router.push(`/opportunities/${id}`)}
        onViewAll={() => router.push("/rfx")}
      />
    </div>
  );
}
