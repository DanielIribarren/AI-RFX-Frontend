"use client";

/**
 * Home-screen chart cards for the proposal pipeline. Both consume the
 * proposal-vocab metrics shape (`ProposalMetrics`) produced by
 * `proposalsApi.getMetrics()`. Charts use recharts directly (already a
 * project dependency) instead of the shadcn ChartContainer wrapper — the
 * wrapper adds CSS variables for theming we don't need at this size.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProposalMetrics } from "@/lib/api-proposals";

const CHART_HEIGHT = 200;

interface FunnelCardProps {
  data: ProposalMetrics["funnel"];
}

export function FunnelCard({ data }: FunnelCardProps) {
  const chartData = [
    { stage: "Processed", value: data.processed },
    { stage: "Sent", value: data.sent },
    { stage: "Accepted", value: data.accepted },
  ];

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);
  const conversion =
    data.processed > 0 ? Math.round((data.accepted / data.processed) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Pipeline funnel</CardTitle>
        <p className="text-xs text-muted-foreground">
          {conversion}% processed → accepted (last 30 days)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <XAxis type="number" domain={[0, maxValue]} hide />
            <YAxis
              type="category"
              dataKey="stage"
              width={80}
              tick={{ fontSize: 12, fill: "currentColor" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              contentStyle={{
                borderRadius: 6,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--background))",
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="value"
              fill="hsl(var(--primary))"
              radius={[0, 4, 4, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface TrendCardProps {
  data: ProposalMetrics["timeseries"];
  rangeDays?: number;
}

export function TrendCard({ data, rangeDays = 30 }: TrendCardProps) {
  const totalCreated = data.reduce((acc, row) => acc + row.created, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">New proposals · daily</CardTitle>
        <p className="text-xs text-muted-foreground">
          {totalCreated} created in the last {rangeDays} days
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <AreaChart
            data={data}
            margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
          >
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => value.slice(5)}
              tick={{ fontSize: 11, fill: "currentColor" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={32}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "currentColor" }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "3 3" }}
              contentStyle={{
                borderRadius: 6,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--background))",
                fontSize: 12,
              }}
              labelFormatter={(value: string) => value}
            />
            <Area
              type="monotone"
              dataKey="created"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#trendFill)"
              name="Created"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
