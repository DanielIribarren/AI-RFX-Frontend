"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, FolderKanban, LayoutDashboard, Package } from "lucide-react";
import { PageHeader } from "@/components/common";
import { LoadingSpinner } from "@/components/common";
import { BusinessUnitSwitcher } from "@/components/features/budy/BusinessUnitSwitcher";
import { OpportunityTable } from "@/components/features/budy/OpportunityTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganization } from "@/contexts/OrganizationContext";
import { budyApi, type Opportunity, type SalesStage } from "@/lib/api-budy";
import { isBudyWorkspaceEnabled } from "@/lib/budy-flags";

function MetricCard({ title, value, caption }: { title: string; value: number | string; caption: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    organization,
    businessUnits,
    activeBusinessUnitId,
    setActiveBusinessUnitId,
    isLoading: organizationLoading,
    isBusinessUnitsLoading,
  } = useOrganization();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [bcvRate, setBcvRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const budyEnabled = isBudyWorkspaceEnabled(organization);

  const loadWorkspace = async (businessUnitId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const [opportunityList, rate] = await Promise.all([
        budyApi.getOpportunities(businessUnitId ? { business_unit_id: businessUnitId } : undefined),
        budyApi.getCurrentBCVRate().catch(() => null),
      ]);
      setOpportunities(opportunityList);
      setBcvRate(rate?.rate ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the Budy workspace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!organizationLoading && !isBusinessUnitsLoading) {
      loadWorkspace(activeBusinessUnitId || undefined);
    }
  }, [activeBusinessUnitId, isBusinessUnitsLoading, organizationLoading]);

  const metrics = useMemo(() => {
    const total = opportunities.length;
    const paymentPending = opportunities.filter((item) =>
      ["payment_pending", "partially_paid"].includes(item.sales_stage),
    ).length;
    const sent = opportunities.filter((item) =>
      ["sent", "viewed"].includes(item.sales_stage),
    ).length;
    return { total, paymentPending, sent };
  }, [opportunities]);

  const handleBusinessUnitChange = (value: string) => {
    setActiveBusinessUnitId(value);
    startTransition(() => {
      loadWorkspace(value);
    });
  };

  const handleStageChange = async (opportunityId: string, stage: SalesStage) => {
    await budyApi.updateOpportunity(opportunityId, { sales_stage: stage });
    await loadWorkspace(activeBusinessUnitId || undefined);
  };

  if (organizationLoading || isBusinessUnitsLoading || loading) {
    return <LoadingSpinner text="Loading Budy workspace..." fullScreen />;
  }

  if (!budyEnabled) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Budy rollout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This organization is not enabled for Budy yet. You can keep using intake in the meantime.
            </p>
            <Button onClick={() => router.push("/intake")}>Open intake</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (organization && businessUnits.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Services required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create at least one service before processing opportunities in Budy.
            </p>
            <Button onClick={() => router.push("/business-units")}>Open services</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6 xl:p-8">
      <PageHeader
        title="Budy Workspace"
        description="Manage Sabra's commercial flow from intake to execution in one place."
        icon={LayoutDashboard}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/intake")}>
              Open intake
            </Button>
            <Button onClick={() => router.push("/business-units")}>
              Manage services
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <BusinessUnitSwitcher
          businessUnits={businessUnits}
          value={activeBusinessUnitId || ""}
          onValueChange={handleBusinessUnitChange}
          label="Active service"
          disabled={businessUnits.length === 0}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/clients")}>
            <Building2 className="mr-2 h-4 w-4" />
            Clients
          </Button>
          <Button variant="outline" onClick={() => router.push("/product-inventory")}>
            <Package className="mr-2 h-4 w-4" />
            Product inventory
          </Button>
          <Button variant="outline" onClick={() => router.push("/history")}>
            <FolderKanban className="mr-2 h-4 w-4" />
            Full pipeline
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Open opportunities" value={metrics.total} caption="Active opportunities for the selected service" />
        <MetricCard title="Sent proposals" value={metrics.sent} caption="Already sent or viewed by the client" />
        <MetricCard title="Pending payments" value={metrics.paymentPending} caption="Accepted but not fully paid yet" />
        <MetricCard
          title="Official BCV rate"
          value={bcvRate ? `${bcvRate.toFixed(2)} VES` : "Unavailable"}
          caption="Used to show VES equivalents"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commercial pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <OpportunityTable
            opportunities={opportunities}
            onStageChange={handleStageChange}
            onOpenOpportunity={(opportunityId) => router.push(`/opportunities/${opportunityId}`)}
          />
          {isPending && <p className="mt-4 text-sm text-muted-foreground">Updating the active service filter...</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick start</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-1">
            <li><strong>Intake</strong> — Upload a PDF to extract and price a request.</li>
            <li><strong>Publish</strong> — Open the opportunity and click &quot;Publish proposal&quot; to get a shareable link.</li>
            <li><strong>Send</strong> — Copy the link and share it via WhatsApp, email, or any channel.</li>
            <li><strong>Track</strong> — See when the client views, accepts, and pays — all from this dashboard.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
