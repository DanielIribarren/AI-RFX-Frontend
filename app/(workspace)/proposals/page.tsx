"use client";

/**
 * /proposals — master list view.
 *
 * Wraps ProposalsTable with the page chrome and connects it to the
 * proposalsApi for data + the legacy api.deleteRFX for deletion until
 * Phase-5+ adds proposalsApi.delete on the backend.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
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
import { ProposalsTable } from "@/components/features/proposals/ProposalsTable";
import { proposalsApi, type Proposal } from "@/lib/api-proposals";
import { api, APIError } from "@/lib/api";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

export default function ProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const loadProposals = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await proposalsApi.list();
      setProposals(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

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
        title="Proposals"
        description="All proposals across stages. Filter by status or search by client, title, or code."
        icon={FileText}
        actions={
          <Button onClick={() => router.push("/proposals/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New proposal
          </Button>
        }
      />

      <ProposalsTable
        proposals={proposals}
        isLoading={loading}
        error={error}
        onOpenProposal={(id) => router.push(`/opportunities/${id}`)}
        onDeleteProposal={(id, title) => setDeleteCandidate({ id, title })}
        onRefresh={loadProposals}
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
