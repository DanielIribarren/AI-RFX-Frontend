"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { RFXReviewStateData } from "@/lib/api";
import { confirmReview, getReviewState } from "@/lib/review-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
};

interface RFXReviewInlineChatProps {
  rfxId: string;
  entityType?: "rfx" | "session";
  initialData?: any;
  onConfirmed: (rfxId: string) => void;
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
      name: p.product_name || p.nombre || `Producto ${idx + 1}`,
      quantity: qty,
      unit: p.unit || p.unidad || p.unit_of_measure || "u",
      unitPrice,
      unitCost,
      lineTotal,
      breakdown: (p.bundle_breakdown || p.specifications?.bundle_breakdown || specs?.bundle_breakdown || []) as Array<any>,
    };
  });

export default function RFXReviewInlineChat({ rfxId, entityType = "rfx", initialData, onConfirmed }: RFXReviewInlineChatProps) {
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

  const products = useMemo(() => mapProducts(detailProducts), [detailProducts]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      setError(e instanceof Error ? e.message : "Error cargando revisión");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfxId, entityType]);

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isSending) return;

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
        content: resp?.message || "Sin respuesta del agente.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (entityType === "session" && resp?.preview_data) {
        setDetailData(resp.preview_data);
        const updatedProducts = Array.isArray(resp.preview_data?.products) ? resp.preview_data.products : [];
        setDetailProducts(updatedProducts);
      }
    } catch (e) {
      console.error("Error sending review message:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error procesando mensaje: ${e instanceof Error ? e.message : "Error desconocido"}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirm = async () => {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      const resp = await confirmReview(rfxId, entityType);
      if (resp?.status === "success") {
        const finalId = resp?.data?.rfx_id || rfxId;
        onConfirmed(finalId);
      } else {
        setError(resp?.message || "No se pudo confirmar la revisión");
      }
    } catch (e) {
      console.error("Error confirming review:", e);
      setError(e instanceof Error ? e.message : "Error confirmando revisión");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Revisión Conversacional (mismo flujo New RFX)</h3>
            <p className="text-sm text-muted-foreground">
              Confirma o ajusta el contexto antes de pasar a Data View.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">RFX: {rfxId}</div>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-medium mb-3">Resumen extraído</h4>
        <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
          <p><span className="font-medium text-foreground">Solicitante:</span> {detailData?.requester_name || detailData?.nombre_solicitante || "-"}</p>
          <p><span className="font-medium text-foreground">Empresa:</span> {detailData?.company_name || detailData?.nombre_empresa || "-"}</p>
          <p><span className="font-medium text-foreground">Email:</span> {detailData?.email || "-"}</p>
          <p><span className="font-medium text-foreground">Fecha entrega:</span> {detailData?.delivery_date || detailData?.fecha || "-"}</p>
          <p><span className="font-medium text-foreground">Ubicación:</span> {detailData?.location || detailData?.lugar || "-"}</p>
          <p><span className="font-medium text-foreground">Estado review:</span> {reviewState?.workflow_status || "-"}</p>
        </div>

        <div className="overflow-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="p-2">Producto</th>
                <th className="p-2">Cant.</th>
                <th className="p-2">Unidad</th>
                <th className="p-2">Costo U.</th>
                <th className="p-2">Precio U.</th>
                <th className="p-2">Total Línea</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-3 text-muted-foreground">No hay productos detectados aún.</td>
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
                            "opción";
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
          <h4 className="font-medium">Conversación</h4>
          <Button variant="outline" size="sm" onClick={loadContext} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refrescar"}
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

        <div className="mt-4 flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe ajustes o confirmaciones del contexto..."
            className="min-h-[70px]"
            disabled={isSending}
          />
          <Button onClick={handleSend} disabled={isSending || !input.trim()} className="self-end">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleConfirm} disabled={isConfirming}>
            {isConfirming ? "Confirmando..." : "Confirmar y continuar"}
          </Button>
          <span className="text-sm text-muted-foreground">
            Puedes confirmar aunque no respondas preguntas (modo flexible habilitado).
          </span>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>
    </div>
  );
}
