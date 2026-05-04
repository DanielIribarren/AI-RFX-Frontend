"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SALES_STAGE_LABELS, type Opportunity, type SalesStage } from "@/lib/api-budy";
import { CalendarDays, ExternalLink } from "lucide-react";

const COLUMNS: SalesStage[] = [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "payment_pending",
  "partially_paid",
  "confirmed",
  "in_execution",
  "completed",
];

function formatMoney(value: number | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "No service date";
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

interface OpportunityKanbanProps {
  opportunities: Opportunity[];
  onStageChange?: (opportunityId: string, stage: SalesStage) => void;
  onOpenOpportunity?: (opportunityId: string) => void;
}

export function OpportunityKanban({
  opportunities,
  onStageChange,
  onOpenOpportunity,
}: OpportunityKanbanProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-4 2xl:grid-cols-9 overflow-x-auto">
      {COLUMNS.map((column) => {
        const columnItems = opportunities.filter((opportunity) => opportunity.sales_stage === column);

        return (
          <div key={column} className="space-y-3">
            <div className="rounded-xl bg-muted/60 px-3 py-2">
              <div className="text-sm font-semibold">{SALES_STAGE_LABELS[column]}</div>
              <div className="text-xs text-muted-foreground">{columnItems.length} items</div>
            </div>

            <div className="space-y-3">
              {columnItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                  No opportunities
                </div>
              ) : (
                columnItems.map((opportunity) => (
                  <Card key={opportunity.id} className="shadow-sm">
                    <CardHeader className="space-y-2 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-sm">{opportunity.title}</CardTitle>
                          <p className="text-xs text-muted-foreground">{opportunity.client.name}</p>
                        </div>
                        <Badge variant="outline">{opportunity.industry_context}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="font-medium">
                        {formatMoney(opportunity.proposal?.total_cost)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{formatDate(opportunity.service?.service_start_at)}</span>
                      </div>
                      {onStageChange && (
                        <Select
                          value={opportunity.sales_stage}
                          onValueChange={(value) => onStageChange(opportunity.id, value as SalesStage)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(SALES_STAGE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {onOpenOpportunity && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => onOpenOpportunity(opportunity.id)}
                        >
                          <ExternalLink className="mr-2 h-3.5 w-3.5" />
                          Open
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
