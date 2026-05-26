"use client";

/**
 * Workspace Home — metrics + the same rich Proposals table used in /proposals.
 *
 * URL stays at /dashboard to keep existing bookmarks and avoid touching the
 * login redirect. The Next.js root group `app/page.tsx` owns "/" (marketing
 * landing), so the workspace home cannot be a sibling route file.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Plus } from "lucide-react";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { proposalsApi, type Proposal, type ProposalMetrics } from "@/lib/api-proposals";
import { isProposalOpen } from "@/lib/proposal-stage";
import {
  FunnelCard,
  TrendCard,
} from "@/components/features/proposals/ProposalCharts";
import { ProposalsTable } from "@/components/features/proposals/ProposalsTable";
import { api, APIError } from "@/lib/api";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

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
  const [error, setError] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      setError(false);
      const [metricsData, proposalList] = await Promise.all([
        proposalsApi.getMetrics(METRICS_RANGE_DAYS),
        proposalsApi.list(),
      ]);
      setMetrics(metricsData);
      setProposals(proposalList);
    } catch {
      setError(true);
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

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await api.deleteRFX(deleteCandidate.id);
      localStorage.removeItem("sidebar-recent-proposals");
      setProposals((prev) => prev.filter((p) => p.id !== deleteCandidate.id));
      showSuccessToast({
        title: "Proposal deleted",
        message: `"${deleteCandidate.title}" was deleted successfully.`,
      });
    } catch (err) {
      const message =
        err instanceof APIError && err.status === 403
          ? "Only the creator can delete this proposal."
          : "Could not delete the proposal.";
      showErrorToast({ title: "Delete failed", message });
    } finally {
      setDeleteCandidate(null);
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-6 xl:p-8">
      <PageHeader
        title="Home"
        description="Pipeline metrics and proposals that need your attention."
        icon={LayoutDashboard}
        actions={
          <Button onClick={() => router.push("/proposals/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New proposal
          </Button>
        }
      />

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

      <ProposalsTable
        proposals={proposals}
        isLoading={loading}
        error={error}
        onOpenProposal={(id) => router.push(`/opportunities/${id}`)}
        onDeleteProposal={(id, title) => setDeleteCandidate({ id, title })}
        onRefresh={loadWorkspace}
      />

      <AlertDialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete proposal</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently delete
              {deleteCandidate?.title
                ? ` "${deleteCandidate.title}"`
                : " this proposal"}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
