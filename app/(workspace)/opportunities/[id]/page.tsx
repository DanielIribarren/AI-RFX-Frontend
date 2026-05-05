"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, CheckCircle2, Copy, ExternalLink, FileText, Send } from "lucide-react";
import Link from "next/link";
import { LoadingSpinner, PageHeader } from "@/components/common";
import { CommercialProgressTracker } from "@/components/features/budy/CommercialProgressTracker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { budyApi, SALES_STAGE_LABELS, type BusinessUnit, type OpportunityDetail, type SalesStage } from "@/lib/api-budy";
import { useOrganization } from "@/contexts/OrganizationContext";

function formatMoney(value: number | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

export default function OpportunityDetailPage() {
  const params = useParams<{ id: string }>();
  const opportunityId = params.id;
  const { setActiveBusinessUnitId } = useOrganization();
  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [detail, units] = await Promise.all([
        budyApi.getOpportunity(opportunityId),
        budyApi.getBusinessUnits(),
      ]);
      setOpportunity(detail);
      setBusinessUnits(units);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the opportunity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [opportunityId]);

  if (loading) {
    return <LoadingSpinner text="Loading opportunity..." fullScreen />;
  }

  if (!opportunity) {
    return <div className="p-6 text-sm text-red-600">{error || "Opportunity not found"}</div>;
  }

  const handleStageChange = async (stage: SalesStage) => {
    try {
      setError(null);
      await budyApi.updateOpportunity(opportunity.id, { sales_stage: stage });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the sales stage");
    }
  };

  const isPublished = opportunity.proposal?.public_visibility === "public" && !!opportunity.proposal?.public_token;
  const publicUrl = isPublished
    ? `${window.location.origin}/p/${opportunity.proposal!.public_token}`
    : null;
  const proposalTotal = opportunity.proposal?.total_cost ?? 0;

  const publishGateIssues = opportunity.proposal_readiness_issues || [];
  const hasPublishableProposal = opportunity.can_publish_proposal ?? publishGateIssues.length === 0;

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublish = async () => {
    if (publishGateIssues.length > 0) {
      setError(`Cannot publish: ${publishGateIssues.join(", ")}`);
      return;
    }

    try {
      setPublishing(true);
      await budyApi.publishProposal(opportunity.proposal!.id!, {
        business_unit_id: opportunity.business_unit_id || businessUnits[0]?.id,
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish the proposal");
    } finally {
      setPublishing(false);
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    try {
      setConfirmingPaymentId(paymentId);
      setError(null);
      await budyApi.confirmPayment(paymentId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm the payment");
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  const selectedBusinessUnit = businessUnits.find((unit) => unit.id === opportunity.business_unit_id);
  const showProductInventoryCTA = publishGateIssues.some((issue) =>
    /product|unit price|unit cost|pricing|\$0/i.test(issue),
  );
  const handleOpenProductInventory = () => {
    if (opportunity.business_unit_id) {
      setActiveBusinessUnitId(opportunity.business_unit_id);
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-6 xl:p-8">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/opportunities">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Opportunities
          </Link>
        </Button>
        <span className="text-muted-foreground">·</span>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/rfx-result-wrapper-v2/data/${opportunityId}`}>
            <FileText className="mr-1 h-4 w-4" />
            RFX data
          </Link>
        </Button>
      </div>

      <PageHeader
        title={opportunity.title}
        description={`${opportunity.client.name || "Unnamed client"} · ${selectedBusinessUnit?.name || "No business unit assigned"}`}
        actions={
          <>
            {publicUrl && (
              <>
                <Button variant="outline" onClick={handleCopyLink}>
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Link copied!" : "Copy public link"}
                </Button>
                <Button variant="outline" asChild>
                  <a href={publicUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Preview
                  </a>
                </Button>
              </>
            )}
            {!publicUrl && (
              <Button onClick={handlePublish} disabled={publishing || !hasPublishableProposal}>
                <Send className="mr-2 h-4 w-4" />
                {publishing ? "Publishing..." : "Publish proposal"}
              </Button>
            )}
          </>
        }
      />

      {error && <div className="text-sm text-red-600">{error}</div>}

      <CommercialProgressTracker opportunity={opportunity} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,380px)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Requested scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{opportunity.description || "No description has been loaded yet."}</p>
              {opportunity.requirements && (
                <div>
                  <h3 className="font-medium">Requirements</h3>
                  <p className="mt-1 text-muted-foreground">{opportunity.requirements}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Products and lines</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit price</TableHead>
                    <TableHead>Unit cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {opportunity.products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.product_name}</TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>{formatMoney(product.estimated_unit_price)}</TableCell>
                      <TableCell>{formatMoney(product.unit_cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commercial status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Sales stage</div>
                <Select value={opportunity.sales_stage} onValueChange={(value) => handleStageChange(value as SalesStage)}>
                  <SelectTrigger>
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
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="space-y-0.5">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Public status</div>
                  <div className="font-medium">{isPublished ? "Published" : "Private"}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Proposal total</div>
                  <div className="font-medium">{formatMoney(proposalTotal)}</div>
                </div>
                {opportunity.proposal?.public_token && (
                  <div className="col-span-2 space-y-0.5 border-t pt-2">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Views</div>
                    <div className="font-medium">
                      {opportunity.proposal.public_view_count ?? 0}
                      {opportunity.proposal.public_last_viewed_at && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          · Last viewed {new Date(opportunity.proposal.public_last_viewed_at).toLocaleString("en-US")}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!isPublished && publishGateIssues.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                  <div className="font-medium mb-1">Cannot publish yet:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {publishGateIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                  {showProductInventoryCTA && (
                    <div className="mt-3">
                      <Button variant="outline" size="sm" asChild onClick={handleOpenProductInventory}>
                        <Link href="/product-inventory">Go to Product Inventory</Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {opportunity.payment_summary && (
            <Card>
              <CardHeader>
                <CardTitle>Payment summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Confirmed</span>
                  <span>{formatMoney(opportunity.payment_summary.confirmed_total_usd)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Submitted</span>
                  <span>{formatMoney(opportunity.payment_summary.submitted_total_usd)}</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span>Remaining</span>
                  <span>{formatMoney(opportunity.payment_summary.remaining_total_usd)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Submitted payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {opportunity.payments && opportunity.payments.length > 0 ? (
                opportunity.payments.map((payment) => (
                  <div key={payment.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">{formatMoney(payment.amount_usd)}</div>
                        <div className="text-muted-foreground">
                          {payment.payer_name || payment.payer_email || "Unknown payer"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(payment.submitted_at).toLocaleString("en-US")}
                        </div>
                        {payment.payment_reference && (
                          <div className="text-xs text-muted-foreground">
                            Reference: {payment.payment_reference}
                          </div>
                        )}
                        {payment.payment_methods?.display_name && (
                          <div className="text-xs text-muted-foreground">
                            Method: {payment.payment_methods.display_name}
                          </div>
                        )}
                      </div>
                      <Badge variant={payment.status === "confirmed" ? "default" : "secondary"}>
                        {payment.status}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {payment.proof_file_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={payment.proof_file_url} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-3.5 w-3.5" />
                            View proof
                          </a>
                        </Button>
                      )}
                      {payment.status === "submitted" && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmPayment(payment.id)}
                          disabled={confirmingPaymentId === payment.id}
                        >
                          <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                          {confirmingPaymentId === payment.id ? "Confirming..." : "Confirm payment"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No payment proofs have been uploaded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
