"use client";

import { useEffect, useState } from "react";
import { budyApi, type PaymentMethod, type PublicProposalData } from "@/lib/api-budy";
import {
  PAYMENT_METHOD_FIELDS,
  PAYMENT_METHOD_FIELD_LABELS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethodFieldKey,
  type PaymentMethodType,
} from "@/constants/payment-methods";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/common";
import { Badge } from "@/components/ui/badge";

function formatMoney(value: number, currency: "USD" | "VES") {
  const locale = currency === "USD" ? "en-US" : "es-VE";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value || 0);
}

interface PublicProposalViewerProps {
  token: string;
}

export function PublicProposalViewer({ token }: PublicProposalViewerProps) {
  const [data, setData] = useState<PublicProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [acceptedName, setAcceptedName] = useState("");
  const [acceptedEmail, setAcceptedEmail] = useState("");
  const [paymentMethodType, setPaymentMethodType] = useState<string>("");
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const loadProposal = async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await budyApi.getPublicProposal(token);
      setData(payload);
      if (payload.payment_methods[0]) {
        setPaymentMethodType(payload.payment_methods[0].method_type);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the proposal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposal();
  }, [token]);

  const handleAccept = async () => {
    if (!acceptedName.trim()) {
      setError("Enter your name to accept the proposal");
      return;
    }

    try {
      setAccepting(true);
      await budyApi.acceptPublicProposal(token, {
        accepted_name: acceptedName.trim(),
        accepted_email: acceptedEmail.trim() || undefined,
      });
      await loadProposal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept the proposal");
    } finally {
      setAccepting(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentMethodType || !amountUsd) {
      setError("Select a payment method and enter the amount");
      return;
    }

    try {
      setSubmittingPayment(true);
      const formData = new FormData();
      formData.append("payment_method_type", paymentMethodType);
      formData.append("payer_name", payerName);
      formData.append("payer_email", payerEmail);
      formData.append("amount_usd", amountUsd);
      formData.append("payment_reference", paymentReference);
      formData.append("notes", paymentNotes);
      if (proofFile) {
        formData.append("proof_file", proofFile);
      }

      await budyApi.submitPublicPayment(token, formData);
      setAmountUsd("");
      setPaymentReference("");
      setPaymentNotes("");
      setProofFile(null);
      await loadProposal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload the payment proof");
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading proposal..." fullScreen />;
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <Card className="mx-auto max-w-3xl">
          <CardContent className="p-8">
            <h1 className="text-xl font-semibold">Could not open the proposal</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const businessUnit = data.business_unit;
  const headerStyle = businessUnit?.primary_color
    ? { borderTopColor: businessUnit.primary_color }
    : undefined;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 lg:px-8">
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <Card className="border-t-4 shadow-lg" style={headerStyle}>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                {businessUnit?.logo_url && (
                  <img
                    src={businessUnit.logo_url}
                    alt={businessUnit.brand_name || "Logo"}
                    className="h-12 mb-2 object-contain"
                  />
                )}
                <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                  {businessUnit?.brand_name || "Budy AI"}
                </div>
                <CardTitle className="text-3xl">{data.opportunity.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {data.opportunity.client.name}
                  {businessUnit?.brand_tagline ? ` · ${businessUnit.brand_tagline}` : ""}
                </p>
              </div>
              <div className="space-y-2 text-right">
                <Badge variant="outline">{data.opportunity.sales_stage}</Badge>
                <div className="text-2xl font-semibold">
                  {formatMoney(data.pricing.contract_total_usd, "USD")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatMoney(data.pricing.equivalent_total_ves, "VES")} at the BCV rate
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{data.pricing.display_note}</p>
            {data.exchange_rate.is_stale && (
              <Badge variant="secondary">Showing a cached BCV rate because the provider is unavailable</Badge>
            )}
          </CardHeader>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="min-w-0 overflow-hidden shadow-lg">
            <CardHeader className="px-6 lg:px-10">
              <CardTitle>Proposal details</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0 overflow-x-auto px-6 pb-8 lg:px-10 lg:pb-10">
              <div
                className="prose prose-slate max-w-none [&_table]:block [&_table]:w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_td]:break-words [&_td]:border [&_td]:border-slate-200 [&_td]:p-3 [&_th]:break-words [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:p-3 [&_img]:max-w-full [&_img]:h-auto"
                dangerouslySetInnerHTML={{ __html: data.proposal.content_html }}
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Opportunity summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="font-medium">Client</div>
                  <div className="text-muted-foreground">{data.opportunity.client.name}</div>
                </div>
                <div>
                  <div className="font-medium">Primary contact</div>
                  <div className="text-muted-foreground">
                    {data.opportunity.contact?.name || "Not provided"}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Service location</div>
                  <div className="text-muted-foreground">
                    {data.opportunity.service_location || "To be confirmed"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {!data.acceptance ? (
              <Card>
                <CardHeader>
                  <CardTitle>Accept this proposal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accepted-name">Your name</Label>
                    <Input
                      id="accepted-name"
                      value={acceptedName}
                      onChange={(event) => setAcceptedName(event.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accepted-email">Email</Label>
                    <Input
                      id="accepted-email"
                      type="email"
                      value={acceptedEmail}
                      onChange={(event) => setAcceptedEmail(event.target.value)}
                      placeholder="name@company.com"
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button className="w-full" onClick={handleAccept} disabled={accepting}>
                    {accepting ? "Accepting..." : "Accept proposal"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Proposal accepted</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="font-medium">{data.acceptance.accepted_name}</div>
                  <div className="text-muted-foreground">
                    {new Date(data.acceptance.accepted_at).toLocaleString("en-US")}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Instrucciones de pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.payment_methods.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aún no hay métodos de pago configurados para esta organización.
                  </p>
                ) : (
                  data.payment_methods.map((method: PaymentMethod) => {
                    const type = method.method_type as PaymentMethodType;
                    const label = PAYMENT_METHOD_LABELS[type] ?? method.method_type;
                    const fields = PAYMENT_METHOD_FIELDS[type] ?? [];
                    return (
                      <div key={method.id} className="rounded-lg border p-3 text-sm">
                        <div className="font-medium">{label}</div>
                        {fields.map((field: PaymentMethodFieldKey) => {
                          const value = method[field];
                          if (!value) return null;
                          return (
                            <div key={field} className="mt-1">
                              <span className="text-muted-foreground">
                                {PAYMENT_METHOD_FIELD_LABELS[field]}:
                              </span>{" "}
                              {value}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {data.acceptance && !data.payment_summary.is_fully_paid && data.payment_methods.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload payment proof</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Método de pago</Label>
                    <Select value={paymentMethodType} onValueChange={setPaymentMethodType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un método de pago" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.payment_methods.map((method) => (
                          <SelectItem key={method.id} value={method.method_type}>
                            {PAYMENT_METHOD_LABELS[method.method_type as PaymentMethodType] ?? method.method_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Payer name</Label>
                      <Input value={payerName} onChange={(event) => setPayerName(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Payer email</Label>
                      <Input
                        type="email"
                        value={payerEmail}
                        onChange={(event) => setPayerEmail(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Amount in USD</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amountUsd}
                        onChange={(event) => setAmountUsd(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reference</Label>
                      <Input
                        value={paymentReference}
                        onChange={(event) => setPaymentReference(event.target.value)}
                      placeholder="Pago Movil / Zelle reference"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={paymentNotes}
                      onChange={(event) => setPaymentNotes(event.target.value)}
                      placeholder="Optional payment notes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Proof file</Label>
                    <Input
                      type="file"
                      onChange={(event) => setProofFile(event.target.files?.[0] || null)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button className="w-full" onClick={handlePaymentSubmit} disabled={submittingPayment}>
                    {submittingPayment ? "Uploading..." : "Submit payment proof"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Payment status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {data.payment_summary.is_fully_paid && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                    <div className="text-green-700 font-semibold">Fully paid</div>
                    <div className="text-xs text-green-600 mt-1">Thank you! Your payment has been confirmed.</div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Confirmed</span>
                  <span>{formatMoney(data.payment_summary.confirmed_total_usd, "USD")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Submitted</span>
                  <span>{formatMoney(data.payment_summary.submitted_total_usd, "USD")}</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span>Remaining</span>
                  <span>{formatMoney(data.payment_summary.remaining_total_usd, "USD")}</span>
                </div>
                {data.payments.length > 0 && (
                  <div className="mt-4 space-y-2 border-t pt-3">
                    <div className="text-xs font-medium text-muted-foreground uppercase">Your submissions</div>
                    {data.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <span>{formatMoney(p.amount_usd, "USD")}</span>
                        <Badge variant={p.status === "confirmed" ? "default" : "secondary"} className="text-[10px]">
                          {p.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
