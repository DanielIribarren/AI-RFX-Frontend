"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { PageHeader, LoadingSpinner } from "@/components/common";
import { BusinessUnitSwitcher } from "@/components/features/budy/BusinessUnitSwitcher";
import { OpportunityTable } from "@/components/features/budy/OpportunityTable";
import { Card, CardContent } from "@/components/ui/card";
import { useOrganization } from "@/contexts/OrganizationContext";
import { budyApi, type Opportunity, type SalesStage } from "@/lib/api-budy";

export default function HistoryPage() {
  const router = useRouter();
  const {
    organization,
    businessUnits,
    activeBusinessUnitId,
    setActiveBusinessUnitId,
    isBusinessUnitsLoading,
  } = useOrganization();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (businessUnitId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const items = await budyApi.getOpportunities(
        businessUnitId ? { business_unit_id: businessUnitId } : undefined,
      );
      setOpportunities(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load opportunities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isBusinessUnitsLoading) {
      loadData(activeBusinessUnitId || undefined);
    }
  }, [activeBusinessUnitId, isBusinessUnitsLoading]);

  const handleStageChange = async (opportunityId: string, stage: SalesStage) => {
    await budyApi.updateOpportunity(opportunityId, { sales_stage: stage });
    await loadData(activeBusinessUnitId || undefined);
  };

  if (loading || isBusinessUnitsLoading) {
    return <LoadingSpinner text="Loading Budy pipeline..." fullScreen />;
  }

  if (organization && businessUnits.length === 0) {
    return <div className="p-6 text-sm text-muted-foreground">Create a business unit to view the pipeline.</div>;
  }

  return (
    <div className="space-y-6 p-4 lg:p-6 xl:p-8">
      <PageHeader
        title="Opportunity pipeline"
        description="Move opportunities through the commercial cycle without relying on the legacy RFX history view."
        icon={FolderKanban}
      />

      <BusinessUnitSwitcher
        businessUnits={businessUnits}
        value={activeBusinessUnitId || ""}
        onValueChange={(value) => {
          setActiveBusinessUnitId(value);
          loadData(value);
        }}
        label="Active business unit"
      />

      {error && <div className="text-sm text-red-600">{error}</div>}

      <Card>
        <CardContent className="pt-6">
          <OpportunityTable
            opportunities={opportunities}
            onStageChange={handleStageChange}
            onOpenOpportunity={(opportunityId) => router.push(`/opportunities/${opportunityId}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
