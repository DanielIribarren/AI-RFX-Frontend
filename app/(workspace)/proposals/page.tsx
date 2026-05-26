"use client";

/**
 * /proposals — master list view (Phase 3 of the Proposal unification).
 *
 * Replaces the legacy /rfx ("Intakes") screen. Backend still returns the
 * Budy Opportunity shape and the /opportunities/[id] detail URL still
 * works, so row clicks route to /opportunities/[id] for now — Phase 5
 * renames that detail route to /proposals/[id].
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { LoadingSpinner, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { ProposalsTable } from "@/components/features/proposals/ProposalsTable";
import { proposalsApi, type Proposal } from "@/lib/api-proposals";

export default function ProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProposals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await proposalsApi.list();
      setProposals(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load proposals",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  if (loading && proposals.length === 0) {
    return <LoadingSpinner text="Loading proposals…" fullScreen />;
  }

  return (
    <div className="space-y-6 p-4 lg:p-6 xl:p-8">
      <PageHeader
        title="Proposals"
        description="All proposals across stages. Filter by status or search by client, title, or industry."
        icon={FileText}
        actions={
          <Button onClick={() => router.push("/intake")}>
            <Plus className="mr-2 h-4 w-4" />
            New proposal
          </Button>
        }
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <ProposalsTable
        proposals={proposals}
        onOpenProposal={(id) => router.push(`/opportunities/${id}`)}
      />
    </div>
  );
}
