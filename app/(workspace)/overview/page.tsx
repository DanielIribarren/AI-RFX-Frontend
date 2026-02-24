"use client";

import { useEffect, useMemo, useState } from "react";
import { api, type RFXMetricsOverviewResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RangeDays = "7" | "30" | "90";

export default function OverviewPage() {
  const [range, setRange] = useState<RangeDays>("30");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<RFXMetricsOverviewResponse["data"] | null>(null);

  const loadMetrics = async (days: RangeDays) => {
    try {
      setLoading(true);
      setError(null);
      let response: RFXMetricsOverviewResponse;

      // Fallback: in some Turbo/HMR sessions api object can be stale in memory.
      if (typeof (api as any).getRFXMetricsOverview === "function") {
        response = await (api as any).getRFXMetricsOverview(Number(days));
      } else {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const raw = await fetch(`${base}/api/rfx/metrics/overview?range_days=${Number(days)}`, { headers });
        response = await raw.json();
      }

      if (response.status === "success") {
        setMetrics(response.data);
      } else {
        setError(response.message || "No se pudieron cargar las métricas");
      }
    } catch (e: any) {
      setError(e?.message || "Error cargando métricas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics(range);
  }, [range]);

  const maxFunnel = useMemo(() => {
    if (!metrics) return 1;
    return Math.max(metrics.funnel.processed, metrics.funnel.sent, metrics.funnel.accepted, 1);
  }, [metrics]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">RFX Overview</h1>
          <p className="text-sm text-muted-foreground">Métricas de desempeño y estado del pipeline comercial.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(value) => setRange(value as RangeDays)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => loadMetrics(range)} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total RFX" value={metrics?.kpis.total_rfx ?? 0} loading={loading} />
        <MetricCard title="Procesando" value={metrics?.kpis.in_progress ?? 0} loading={loading} />
        <MetricCard title="Procesados" value={metrics?.kpis.processed ?? 0} loading={loading} />
        <MetricCard title="Enviados" value={metrics?.kpis.sent ?? 0} loading={loading} />
        <MetricCard title="Aceptados" value={metrics?.kpis.accepted ?? 0} loading={loading} />
      </div>

      <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Funnel Agentic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FunnelRow label="Procesados" value={metrics?.funnel.processed ?? 0} max={maxFunnel} />
            <FunnelRow label="Enviados" value={metrics?.funnel.sent ?? 0} max={maxFunnel} />
            <FunnelRow label="Aceptados" value={metrics?.funnel.accepted ?? 0} max={maxFunnel} />
            <div className="text-sm text-muted-foreground">
              Tasa de aceptación: <span className="font-medium text-foreground">{metrics?.kpis.acceptance_rate ?? 0}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Tendencia Diaria ({range}d)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(metrics?.timeseries ?? []).slice(-10).map((row) => (
              <div key={row.date} className="grid grid-cols-[90px_1fr_auto] items-center gap-3 text-xs">
                <span className="text-muted-foreground">{row.date}</span>
                <div className="h-2 rounded bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min((row.created / Math.max(...(metrics?.timeseries ?? []).map((d) => d.created), 1)) * 100, 100)}%` }}
                  />
                </div>
                <span>{row.created}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, loading }: { title: string; value: number; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{loading ? "..." : value}</div>
      </CardContent>
    </Card>
  );
}

function FunnelRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.max(6, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div className="grid grid-cols-[90px_1fr_auto] items-center gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="h-3 rounded bg-muted overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
