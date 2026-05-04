"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, TrendingUp } from "lucide-react";
import { LoadingSpinner, PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BusinessUnitSwitcher } from "@/components/features/budy/BusinessUnitSwitcher";
import { useOrganization } from "@/contexts/OrganizationContext";
import { budyApi, SALES_STAGE_LABELS, type Opportunity, type SalesStage } from "@/lib/api-budy";

const STAGE_COLORS: Record<SalesStage, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-purple-100 text-purple-700",
  accepted: "bg-emerald-100 text-emerald-700",
  payment_pending: "bg-yellow-100 text-yellow-700",
  partially_paid: "bg-orange-100 text-orange-700",
  confirmed: "bg-green-100 text-green-700",
  in_execution: "bg-teal-100 text-teal-700",
  completed: "bg-green-200 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

function formatMoney(value?: number) {
  if (!value) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function OpportunitiesPage() {
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
  const [filterStage, setFilterStage] = useState<string>("all");

  const loadData = async (stageFilter?: string, businessUnitId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const opps = await budyApi.getOpportunities({
        ...(businessUnitId ? { business_unit_id: businessUnitId } : {}),
        ...(stageFilter && stageFilter !== "all" ? { sales_stage: stageFilter } : {}),
      });
      setOpportunities(opps);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load opportunities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isBusinessUnitsLoading) {
      loadData(filterStage, activeBusinessUnitId || undefined);
    }
  }, [activeBusinessUnitId, filterStage, isBusinessUnitsLoading]);

  if (loading || isBusinessUnitsLoading) {
    return <LoadingSpinner text="Loading opportunities..." fullScreen />;
  }

  if (organization && businessUnits.length === 0) {
    return <div className="p-6 text-sm text-muted-foreground">Create a business unit to load opportunities.</div>;
  }

  const stageCounts = opportunities.reduce<Record<string, number>>((acc, opp) => {
    acc[opp.sales_stage] = (acc[opp.sales_stage] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Opportunities"
        description="Track the commercial pipeline and the state of each proposal."
        icon={TrendingUp}
      />

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {(["draft", "sent", "viewed", "payment_pending", "confirmed", "completed"] as SalesStage[]).map((stage) => (
          <Card
            key={stage}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setFilterStage(filterStage === stage ? "all" : stage)}
          >
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {SALES_STAGE_LABELS[stage]}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold">{stageCounts[stage] || 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <BusinessUnitSwitcher
          businessUnits={businessUnits}
          value={activeBusinessUnitId || ""}
          onValueChange={setActiveBusinessUnitId}
          label="Active business unit"
        />
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {Object.entries(SALES_STAGE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="ml-auto text-sm text-muted-foreground">
          {opportunities.length} {opportunities.length === 1 ? "opportunity" : "opportunities"}
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opportunity</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Service date</TableHead>
                <TableHead className="text-center">Views</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    No opportunities found.
                  </TableCell>
                </TableRow>
              ) : (
                opportunities.map((opp) => (
                  <TableRow
                    key={opp.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/opportunities/${opp.id}`)}
                  >
                    <TableCell className="font-medium">{opp.title}</TableCell>
                    <TableCell className="text-muted-foreground">{opp.client.name}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[opp.sales_stage]}`}
                      >
                        {SALES_STAGE_LABELS[opp.sales_stage]}
                      </span>
                    </TableCell>
                    <TableCell>{formatMoney(opp.proposal?.total_cost)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {opp.service?.service_start_at
                        ? new Date(opp.service.service_start_at).toLocaleDateString("es-VE", { day: "2-digit", month: "short" })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {(opp.proposal?.public_view_count ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-purple-600">
                          <Eye className="h-3 w-3" />
                          {opp.proposal?.public_view_count}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
