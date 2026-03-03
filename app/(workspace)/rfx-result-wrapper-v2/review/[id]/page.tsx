"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { RFXResponse, RFXReviewStateData } from "@/lib/api";
import { confirmReview, getReviewState } from "@/lib/review-api";
import RFXUpdateChatPanel from "@/components/features/rfx/update-chat/RFXUpdateChatPanel";

export default function RfxReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [rfxData, setRfxData] = useState<RFXResponse | null>(null);
  const [reviewState, setReviewState] = useState<RFXReviewStateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviewContext = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      const [rfxResponseRaw, reviewResponse] = await Promise.all([
        api.getRFXById(id),
        getReviewState(id, "session"),
      ]);

      let rfxResponse = rfxResponseRaw;
      const stateData = reviewResponse?.data || null;
      if ((rfxResponse.status !== "success" || !rfxResponse.data) && stateData?.preview_data) {
        const preview = stateData.preview_data as Record<string, any>;
        rfxResponse = {
          status: "success",
          message: "Loaded from session preview",
          data: {
            id,
            ...preview,
            products: Array.isArray(preview?.products) ? preview.products : [],
          },
        } as any;
      }

      if (rfxResponse.status !== "success" || !rfxResponse.data) {
        setError(rfxResponse.message || "No se pudo cargar el RFX");
        return;
      }
      if (stateData?.review_required && stateData?.review_confirmed) {
        router.replace(`/rfx-result-wrapper-v2/data/${id}`);
        return;
      }

      setRfxData(rfxResponse);
      setReviewState(stateData);
    } catch (err) {
      console.error("Error loading review context:", err);
      setError(err instanceof Error ? err.message : "Error cargando review");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviewContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleConfirmAndContinue = async () => {
    if (!id) return;
    setIsConfirming(true);
    try {
      const response = await confirmReview(id, "session");
      if (response?.status === "success") {
        const finalRfxId = response?.data?.rfx_id || id;
        router.push(`/rfx-result-wrapper-v2/data/${finalRfxId}`);
        return;
      }
      setError(response?.message || "No se pudo confirmar la revisión");
    } catch (err) {
      console.error("Error confirming review:", err);
      setError(err instanceof Error ? err.message : "Error confirmando revisión");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleChatUpdate = async () => {
    await loadReviewContext();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-xl border bg-background p-6">
          <p className="text-sm text-muted-foreground">Cargando revisión conversacional...</p>
        </div>
      </div>
    );
  }

  if (error || !rfxData?.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800">Error en revisión</h2>
          <p className="mt-2 text-sm text-red-700">{error || "No se pudo cargar el contexto del RFX."}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  const products = (rfxData.data.products || rfxData.data.productos || []) as Array<any>;
  const getBreakdown = (p: any) => {
    if (Array.isArray(p?.bundle_breakdown)) return p.bundle_breakdown;
    if (Array.isArray(p?.specifications?.bundle_breakdown)) return p.specifications.bundle_breakdown;
    return [];
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="rounded-xl border bg-background p-6">
          <h1 className="text-2xl font-semibold">Revisión previa obligatoria</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Antes de pasar a Data View, valida o ajusta este contexto con el chat del agente.
          </p>
        </div>

        <div className="rounded-xl border bg-background p-6 space-y-4">
          <h2 className="text-lg font-semibold">Contexto detectado</h2>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Solicitante:</span> {rfxData.data.requester_name || rfxData.data.nombre_solicitante || "-"}</p>
            <p><span className="font-medium text-foreground">Empresa:</span> {rfxData.data.company_name || "-"}</p>
            <p><span className="font-medium text-foreground">Fecha entrega:</span> {rfxData.data.delivery_date || rfxData.data.fecha || "-"}</p>
            <p><span className="font-medium text-foreground">Ubicación:</span> {rfxData.data.location || rfxData.data.lugar || "-"}</p>
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium text-foreground mb-2">Productos detectados ({products.length})</p>
            <div className="space-y-2">
              {products.length === 0 && (
                <p className="text-sm text-muted-foreground">No se detectaron productos todavía.</p>
              )}
              {products.slice(0, 10).map((p, idx) => {
                const breakdown = getBreakdown(p);
                return (
                <div key={idx} className="rounded-lg border px-3 py-2 text-sm">
                  <span className="font-medium">{p.product_name || p.nombre || `Producto ${idx + 1}`}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {p.quantity || p.cantidad || 1} {p.unit || p.unidad || p.unit_of_measure || "u"}
                  </span>
                  {breakdown.length > 0 && (
                    <div className="mt-2 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                      {breakdown.map((item: any, bIdx: number) => {
                        const name =
                          item?.selected?.name ||
                          item?.selected ||
                          item?.nombre ||
                          item?.name ||
                          item?.option ||
                          item?.plato ||
                          item?.day ||
                          `Subitem ${bIdx + 1}`;
                        return (
                          <div key={`${idx}-bd-${bIdx}`} className="leading-5">
                            ↳ {name}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )})}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-6 space-y-4">
          <h2 className="text-lg font-semibold">Confirmación</h2>
          <p className="text-sm text-muted-foreground">
            {reviewState?.suggested_first_message || "Revisa en chat y confirma cuando el contexto esté correcto."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsChatOpen((prev) => !prev)}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              {isChatOpen ? "Ocultar chat" : "Abrir chat"}
            </button>
            <button
              onClick={handleConfirmAndContinue}
              disabled={isConfirming}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {isConfirming ? "Confirmando..." : "Confirmar y continuar a Data View"}
            </button>
          </div>
        </div>
      </div>

      <RFXUpdateChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        rfxId={id}
        rfxData={rfxData.data}
        onUpdate={handleChatUpdate}
        skipCreditsCheck
      />
    </>
  );
}
