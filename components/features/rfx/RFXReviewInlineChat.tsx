"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { RFXReviewStateData } from "@/lib/api";
import { confirmReview, getReviewState } from "@/lib/review-api";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send, RotateCcw, Settings2, AlertTriangle } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
};

interface QuickPricingConfig {
  coordination_enabled: boolean;
  coordination_rate: number;
  cost_per_person_enabled: boolean;
  headcount: number;
  taxes_enabled: boolean;
  tax_rate: number;
}

const DEFAULT_QUICK_PRICING: QuickPricingConfig = {
  coordination_enabled: false,
  coordination_rate: 0.18,
  cost_per_person_enabled: false,
  headcount: 120,
  taxes_enabled: false,
  tax_rate: 0.16,
};

interface RFXReviewInlineChatProps {
  rfxId: string;
  entityType?: "rfx" | "session";
  initialData?: any;
  onConfirmed: (rfxId: string) => void;
  onStartOver?: () => void;
}

const fmtMoney = (value: unknown) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
};

const mapProducts = (products: any[]) =>
  (products || []).map((p: any, idx: number) => {
    const parseMaybeJson = (value: any) => {
      if (!value) return null;
      if (typeof value === "object") return value;
      if (typeof value !== "string") return null;
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };
    const specs = parseMaybeJson(p.specifications || p.especificaciones);
    const qty = Number(p.quantity ?? p.cantidad ?? p.cantidadEditada ?? 0) || 0;
    const unitPrice = Number(p.estimated_unit_price ?? p.precio_unitario ?? p.unit_price ?? 0) || 0;
    const unitCost = Number(p.unit_cost ?? p.costo_unitario ?? 0) || 0;
    const lineTotal = Number(p.total_estimated_cost ?? p.line_total ?? qty * unitPrice) || 0;
    return {
      id: p.id || `product-${idx}`,
      name: p.product_name || p.nombre || `Product ${idx + 1}`,
      quantity: qty,
      unit: p.unit || p.unidad || p.unit_of_measure || "u",
      unitPrice,
      unitCost,
      lineTotal,
      breakdown: (p.bundle_breakdown || p.specifications?.bundle_breakdown || specs?.bundle_breakdown || []) as Array<any>,
    };
  });

const PERSON_UNIT_MARKERS = new Set(["persona", "personas", "pax", "people", "guest", "guests", "attendee", "attendees", "invitado", "invitados"]);

const toPositiveInteger = (value: unknown): number | null => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
};

const inferHeadcountFromText = (value: unknown): number | null => {
  const text = typeof value === "string" ? value : "";
  if (!text.trim()) return null;

  const match = text.match(/(\d{1,4})\s*(personas|persona|pax|people|guests?|attendees?|invitados?)/i);
  return match ? toPositiveInteger(match[1]) : null;
};

const inferHeadcount = (detailData: any, products: any[]): number | null => {
  const directCandidates = [
    detailData?.headcount,
    detailData?.attendees,
    detailData?.guest_count,
    detailData?.person_count,
    detailData?.pax,
    detailData?.metadata_json?.headcount,
    detailData?.metadata_json?.attendees,
  ];

  for (const candidate of directCandidates) {
    const parsed = toPositiveInteger(candidate);
    if (parsed) return parsed;
  }

  const textCandidates = [
    detailData?.requirements,
    detailData?.description,
    detailData?.title,
    detailData?.source_text,
  ];

  for (const candidate of textCandidates) {
    const parsed = inferHeadcountFromText(candidate);
    if (parsed) return parsed;
  }

  for (const product of products || []) {
    const unit = String(product?.unidad || product?.unit || "").trim().toLowerCase();
    if (!PERSON_UNIT_MARKERS.has(unit)) continue;
    const parsed = toPositiveInteger(product?.cantidad ?? product?.quantity);
    if (parsed) return parsed;
  }

  return null;
};

export default function RFXReviewInlineChat({ rfxId, entityType = "rfx", initialData, onConfirmed, onStartOver }: RFXReviewInlineChatProps) {
  const { activeBusinessUnitId } = useOrganization();
  const [reviewState, setReviewState] = useState<RFXReviewStateData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [detailData, setDetailData] = useState<any>(initialData || null);
  const [detailProducts, setDetailProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isPreviewProcessing = entityType === "session" && reviewState?.workflow_status === "processing_preview";
  const isPreviewFailed = entityType === "session" && reviewState?.workflow_status === "preview_failed";
  const isSessionConversationDisabled = false;

  // Quick Pricing Config state
  const [showPricingStep, setShowPricingStep] = useState(false);
  const [quickPricing, setQuickPricing] = useState<QuickPricingConfig>({ ...DEFAULT_QUICK_PRICING });

  const products = useMemo(() => mapProducts(detailProducts), [detailProducts]);
  const inferredHeadcount = useMemo(() => inferHeadcount(detailData, detailProducts), [detailData, detailProducts]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!inferredHeadcount) return;

    setQuickPricing((prev) => {
      const currentHeadcount = Number(prev.headcount || 0);
      if (currentHeadcount > 0 && currentHeadcount !== DEFAULT_QUICK_PRICING.headcount) {
        return prev;
      }
      if (currentHeadcount === inferredHeadcount) {
        return prev;
      }
      return { ...prev, headcount: inferredHeadcount };
    });
  }, [inferredHeadcount]);

  const loadContext = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const reviewResp = await getReviewState(rfxId, entityType);

      const state = reviewResp.data || null;
      setReviewState(state);

      const rawEvents: Array<any> = Array.isArray(state?.recent_events) ? state.recent_events : [];
      const events = rawEvents
        .filter((e: any) => !!e?.message)
        .map((e: any, idx: number) => ({
          id: `ev-${idx}-${e.created_at || idx}`,
          role: (e.role || "assistant") as ChatMessage["role"],
          content: e.message,
          timestamp: e.created_at || new Date().toISOString(),
        }));

      if (events.length > 0) {
        setMessages(events);
      } else if (state?.suggested_first_message) {
        setMessages([
          {
            id: "kickoff",
            role: "assistant",
            content: state.suggested_first_message,
            timestamp: new Date().toISOString(),
          },
        ]);
      }

      if (entityType === "session") {
        const sessionPreview = (state as any)?.preview_data || initialData || {};
        setDetailData(sessionPreview);
        const previewProducts = Array.isArray(sessionPreview?.products) ? sessionPreview.products : [];
        setDetailProducts(previewProducts);
      } else {
        const [rfxResp, prodResp] = await Promise.all([
          api.getRFXById(rfxId),
          api.getProductsWithProfits(rfxId),
        ]);

        if (rfxResp.status === "success" && rfxResp.data) {
          setDetailData(rfxResp.data);
        }

        const prodData = (prodResp as any)?.data;
        const normalizedProducts = Array.isArray(prodData)
          ? prodData
          : Array.isArray(prodData?.products)
            ? prodData.products
            : Array.isArray((rfxResp as any)?.data?.productos)
              ? (rfxResp as any).data.productos
              : Array.isArray((rfxResp as any)?.data?.products)
                ? (rfxResp as any).data.products
                : [];
        setDetailProducts(normalizedProducts);
      }
    } catch (e) {
      console.error("Error loading review inline context:", e);
      setError(e instanceof Error ? e.message : "Error loading review");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfxId, entityType]);

  useEffect(() => {
    if (!isPreviewProcessing) return undefined;
    const timeoutId = window.setTimeout(() => {
      void loadContext();
    }, 2000);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreviewProcessing, rfxId, entityType]);

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isSending || isSessionConversationDisabled) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const context = {
        current_products: detailProducts || [],
        current_total: products.reduce((acc, p) => acc + (Number(p.lineTotal) || 0), 0),
        delivery_date: detailData?.delivery_date || detailData?.fecha || null,
        delivery_location: detailData?.location || detailData?.lugar || null,
        client_name: detailData?.requester_name || detailData?.nombre_solicitante || null,
        client_email: detailData?.email || null,
      };

      const resp = await api.chat.send(rfxId, message, context, undefined, entityType);
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: resp?.message || "No response from the agent.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh data after chat to reflect any changes the agent made
      await loadContext();
    } catch (e) {
      console.error("Error sending review message:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error processing message: ${e instanceof Error ? e.message : "Unknown error"}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleInitiateConfirm = () => {
    setShowPricingStep(true);
    setError(null);
  };

  const handleCancelPricing = () => {
    setShowPricingStep(false);
  };

  const handleConfirmWithPricing = async () => {
    if (isConfirming) return;
    setIsConfirming(true);
    setError(null);
    try {
      const resp = await confirmReview(rfxId, entityType, {
        businessUnitId: detailData?.business_unit_id || activeBusinessUnitId,
        pricingConfig: quickPricing,
      });
      if (resp?.status === "success") {
        const finalId = resp?.data?.rfx_id || rfxId;
        onConfirmed(finalId);
      } else {
        setError(resp?.message || "Could not confirm the review");
      }
    } catch (e) {
      console.error("Error confirming review:", e);
      setError(e instanceof Error ? e.message : "Error confirming review");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleStartOver = () => {
    if (onStartOver) {
      onStartOver();
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Conversational review</h3>
            <p className="text-sm text-muted-foreground">
              Confirm or adjust the context before moving to Data View.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">RFX: {rfxId}</div>
        </div>
      </Card>

      {isPreviewProcessing && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center gap-3 text-sm text-blue-900">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              We are still building the preview from the uploaded request. The review will unlock automatically when extraction is ready.
            </span>
          </div>
        </Card>
      )}

      {isPreviewFailed && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-sm text-red-700">
            {reviewState?.preview_error || "Preview extraction failed. Retry the intake before continuing."}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h4 className="font-medium mb-3">Extracted summary</h4>
        <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
          <p><span className="font-medium text-foreground">Requester:</span> {detailData?.requester_name || detailData?.nombre_solicitante || "-"}</p>
          <p><span className="font-medium text-foreground">Company:</span> {detailData?.company_name || detailData?.nombre_empresa || "-"}</p>
          <p><span className="font-medium text-foreground">Email:</span> {detailData?.email || "-"}</p>
          <p><span className="font-medium text-foreground">Delivery date:</span> {detailData?.delivery_date || detailData?.fecha || "-"}</p>
          <p><span className="font-medium text-foreground">Location:</span> {detailData?.location || detailData?.lugar || "-"}</p>
          <p><span className="font-medium text-foreground">Review state:</span> {reviewState?.workflow_status || "-"}</p>
        </div>

        <div className="overflow-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="p-2">Product</th>
                <th className="p-2">Qty.</th>
                <th className="p-2">Unit</th>
                <th className="p-2">Unit cost</th>
                <th className="p-2">Unit price</th>
                <th className="p-2">Line total</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-3 text-muted-foreground">No products detected yet.</td>
                </tr>
              )}
              {products.map((p) => (
                <Fragment key={p.id}>
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.name}</td>
                    <td className="p-2">{p.quantity}</td>
                    <td className="p-2">{p.unit}</td>
                    <td className="p-2">{fmtMoney(p.unitCost)}</td>
                    <td className="p-2">{fmtMoney(p.unitPrice)}</td>
                    <td className="p-2">{fmtMoney(p.lineTotal)}</td>
                  </tr>
                  {Array.isArray(p.breakdown) && p.breakdown.length > 0 && (
                    <tr className="bg-muted/20">
                      <td colSpan={6} className="p-2 pl-6 text-xs text-muted-foreground">
                        {p.breakdown.map((b: any, idx: number) => {
                          const nodeName =
                            b?.selected?.name ||
                            b?.selected ||
                            b?.name ||
                            b?.option ||
                            "option";
                          return (
                            <div key={`${p.id}-bd-${idx}`} className="leading-5">
                              • {nodeName}
                            </div>
                          );
                        })}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Conversation</h4>
          <Button variant="outline" size="sm" onClick={loadContext} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        <ScrollArea className="h-[360px] pr-3">
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[90%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        {isSessionConversationDisabled ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Conversational adjustments are disabled in the current intake review flow. Review the extracted summary and use
            <span className="font-medium"> Confirm and continue</span> to move forward.
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write any context adjustments or confirmations..."
              className="min-h-[70px]"
              disabled={isSending || isPreviewProcessing || isPreviewFailed}
            />
            <Button onClick={handleSend} disabled={isSending || isPreviewProcessing || isPreviewFailed || !input.trim()} className="self-end">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </Card>

      {/* Quick Pricing Config Step */}
      {showPricingStep && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Quick Pricing Configuration</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Configure pricing options before creating the opportunity. You can refine these later in the Data View.
          </p>

          <div className="space-y-4">
            {/* Coordination */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Coordination &amp; Logistics</Label>
                <p className="text-xs text-muted-foreground">Add coordination percentage to subtotal</p>
              </div>
              <div className="flex items-center gap-3">
                {quickPricing.coordination_enabled && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={(quickPricing.coordination_rate * 100).toFixed(0)}
                      onChange={(e) => setQuickPricing((p) => ({ ...p, coordination_rate: parseFloat(e.target.value || "0") / 100 }))}
                      className="w-20 h-8 text-sm"
                      min={0}
                      max={100}
                      step={1}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                )}
                <Switch
                  checked={quickPricing.coordination_enabled}
                  onCheckedChange={(checked) => setQuickPricing((p) => ({ ...p, coordination_enabled: checked }))}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </div>

            {/* Cost Per Person */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Cost Per Person</Label>
                <p className="text-xs text-muted-foreground">Calculate individual cost from headcount</p>
              </div>
              <div className="flex items-center gap-3">
                {quickPricing.cost_per_person_enabled && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={quickPricing.headcount}
                      onChange={(e) => setQuickPricing((p) => ({ ...p, headcount: parseInt(e.target.value || "0") }))}
                      className="w-20 h-8 text-sm"
                      min={1}
                      placeholder="pax"
                    />
                    <span className="text-xs text-muted-foreground">pax</span>
                  </div>
                )}
                <Switch
                  checked={quickPricing.cost_per_person_enabled}
                  onCheckedChange={(checked) => setQuickPricing((p) => ({ ...p, cost_per_person_enabled: checked }))}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </div>

            {/* Taxes */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Taxes</Label>
                <p className="text-xs text-muted-foreground">Apply tax rate to the total</p>
              </div>
              <div className="flex items-center gap-3">
                {quickPricing.taxes_enabled && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={(quickPricing.tax_rate * 100).toFixed(0)}
                      onChange={(e) => setQuickPricing((p) => ({ ...p, tax_rate: parseFloat(e.target.value || "0") / 100 }))}
                      className="w-20 h-8 text-sm"
                      min={0}
                      max={100}
                      step={1}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                )}
                <Switch
                  checked={quickPricing.taxes_enabled}
                  onCheckedChange={(checked) => setQuickPricing((p) => ({ ...p, taxes_enabled: checked }))}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <Button onClick={handleConfirmWithPricing} disabled={isConfirming}>
              {isConfirming ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Confirming...</>
              ) : (
                "Confirm and create opportunity"
              )}
            </Button>
            <Button variant="outline" onClick={handleCancelPricing} disabled={isConfirming}>
              Back
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </Card>
      )}

      {/* Action Bar */}
      {!showPricingStep && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleInitiateConfirm} disabled={isConfirming || isPreviewProcessing || isPreviewFailed}>
              {isConfirming ? "Confirming..." : "Confirm and continue"}
            </Button>
            {onStartOver && (
              <Button variant="outline" onClick={handleStartOver} disabled={isConfirming || isPreviewProcessing}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Start over
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              {isPreviewProcessing
                ? "Wait for the preview to finish before confirming."
                : "You can confirm even if not every question was answered."}
            </span>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </Card>
      )}
    </div>
  );
}
