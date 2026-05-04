"use client";

import { CheckCircle2, Clock3, Eye, Send, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OpportunityDetail, SalesStage } from "@/lib/api-budy";

type StepState = "complete" | "current" | "upcoming";
type PaymentState = "pending" | "partial" | "paid";

const STARTED_STAGES = new Set<SalesStage>([
  "sent",
  "viewed",
  "accepted",
  "payment_pending",
  "partially_paid",
  "confirmed",
  "in_execution",
  "completed",
  "cancelled",
]);

const ACCEPTED_STAGES = new Set<SalesStage>([
  "accepted",
  "payment_pending",
  "partially_paid",
  "confirmed",
  "in_execution",
  "completed",
]);

const FULLY_PAID_STAGES = new Set<SalesStage>(["confirmed", "in_execution", "completed"]);

function formatMoney(value: number | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatTimelineDate(value?: string | null) {
  if (!value) return "Pending";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getLatestPaymentActivity(opportunity: OpportunityDetail) {
  const timelineValues = (opportunity.payments || [])
    .map((payment) => payment.confirmed_at || payment.submitted_at)
    .filter(Boolean) as string[];

  if (timelineValues.length === 0) {
    return null;
  }

  return timelineValues.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

function getPaymentState(opportunity: OpportunityDetail): PaymentState {
  const stage = opportunity.sales_stage;
  const summary = opportunity.payment_summary;

  if (summary?.is_fully_paid || FULLY_PAID_STAGES.has(stage)) {
    return "paid";
  }

  if ((summary?.confirmed_total_usd || 0) > 0 || stage === "partially_paid") {
    return "partial";
  }

  return "pending";
}

function getProgressValue(opportunity: OpportunityDetail) {
  const hasStarted = STARTED_STAGES.has(opportunity.sales_stage);
  if (!hasStarted) return 0;

  const hasAccepted =
    Boolean(opportunity.proposal?.accepted_at) ||
    ACCEPTED_STAGES.has(opportunity.sales_stage) ||
    getPaymentState(opportunity) !== "pending";

  if (!hasAccepted) return 34;

  const paymentState = getPaymentState(opportunity);
  if (paymentState === "paid") return 100;

  if (paymentState === "partial") {
    const summary = opportunity.payment_summary;
    const ratio = summary?.contract_total_usd
      ? Math.min((summary.confirmed_total_usd || 0) / summary.contract_total_usd, 1)
      : 0.5;
    return 68 + Math.max(ratio, 0.12) * 32;
  }

  return 68;
}

function getFlowHeadline(opportunity: OpportunityDetail) {
  switch (getPaymentState(opportunity)) {
    case "paid":
      return "Commercial flow completed";
    case "partial":
      return "Payment is moving";
    default:
      if (ACCEPTED_STAGES.has(opportunity.sales_stage)) {
        return "Waiting for payment confirmation";
      }
      if (STARTED_STAGES.has(opportunity.sales_stage)) {
        return "Proposal is in client review";
      }
      return "Tracking starts when the proposal is sent";
  }
}

function getFlowTone(opportunity: OpportunityDetail) {
  switch (getPaymentState(opportunity)) {
    case "paid":
      return "text-emerald-700 border-emerald-200 bg-emerald-50";
    case "partial":
      return "text-amber-700 border-amber-200 bg-amber-50";
    default:
      return STARTED_STAGES.has(opportunity.sales_stage)
        ? "text-sky-700 border-sky-200 bg-sky-50"
        : "text-slate-700 border-slate-200 bg-white/80";
  }
}

function getStepState(index: number, progressValue: number): StepState {
  const thresholds = [34, 68, 100];
  const currentThreshold = thresholds[index];
  const previousThreshold = thresholds[index - 1] || 0;

  if (progressValue >= currentThreshold) return "complete";
  if (progressValue > 0 && progressValue >= previousThreshold) return "current";
  return "upcoming";
}

function getStepClasses(state: StepState) {
  if (state === "complete") {
    return {
      card: "border-emerald-200 bg-white/90 shadow-sm shadow-emerald-100",
      dot: "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-200",
      pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
      body: "text-slate-700",
    };
  }

  if (state === "current") {
    return {
      card: "border-sky-200 bg-white/95 shadow-sm shadow-sky-100 ring-1 ring-sky-100",
      dot: "border-sky-500 bg-sky-500 text-white shadow-lg shadow-sky-200",
      pill: "border-sky-200 bg-sky-50 text-sky-700",
      body: "text-slate-700",
    };
  }

  return {
    card: "border-slate-200/80 bg-white/70",
    dot: "border-slate-300 bg-white text-slate-400",
    pill: "border-slate-200 bg-slate-50 text-slate-500",
    body: "text-slate-500",
  };
}

export function CommercialProgressTracker({ opportunity }: { opportunity: OpportunityDetail }) {
  const hasStarted = STARTED_STAGES.has(opportunity.sales_stage);
  const paymentState = getPaymentState(opportunity);
  const progressValue = getProgressValue(opportunity);
  const paymentSummary = opportunity.payment_summary;
  const latestPaymentActivity = getLatestPaymentActivity(opportunity);

  const sentStepState = getStepState(0, progressValue);
  const acceptedStepState = getStepState(1, progressValue);
  const paymentStepState = getStepState(2, progressValue);

  const paymentLabel =
    paymentState === "paid"
      ? "Paid"
      : paymentState === "partial"
        ? "Partial"
        : hasStarted && ACCEPTED_STAGES.has(opportunity.sales_stage)
          ? "Pending"
          : "Waiting";

  const paymentDescription =
    paymentState === "paid"
      ? `${formatMoney(paymentSummary?.confirmed_total_usd)} confirmed from ${formatMoney(paymentSummary?.contract_total_usd)}.`
      : paymentState === "partial"
        ? `${formatMoney(paymentSummary?.confirmed_total_usd)} confirmed and ${formatMoney(paymentSummary?.remaining_total_usd)} still remaining.`
        : "No confirmed payment yet.";

  const steps = [
    {
      title: "Sent",
      icon: Send,
      state: sentStepState,
      badge: hasStarted ? "Delivered" : "Ready",
      timestamp: opportunity.proposal?.sent_at,
      description: hasStarted
        ? "Proposal published and visible to the client."
        : "This timeline starts after the proposal is published.",
      helper:
        (opportunity.proposal?.public_view_count || 0) > 0
          ? `${opportunity.proposal?.public_view_count} client view${opportunity.proposal?.public_view_count === 1 ? "" : "s"}`
          : "No client views yet",
      helperIcon: Eye,
    },
    {
      title: "Accepted",
      icon: CheckCircle2,
      state: acceptedStepState,
      badge: ACCEPTED_STAGES.has(opportunity.sales_stage) || opportunity.proposal?.accepted_at ? "Approved" : "Pending",
      timestamp: opportunity.proposal?.accepted_at,
      description:
        ACCEPTED_STAGES.has(opportunity.sales_stage) || opportunity.proposal?.accepted_at
          ? "The client already approved the proposal."
          : "Waiting for the client to confirm acceptance.",
      helper:
        ACCEPTED_STAGES.has(opportunity.sales_stage) || opportunity.proposal?.accepted_at
          ? "Payment collection can continue"
          : "No acceptance registered yet",
      helperIcon: Clock3,
    },
    {
      title: "Payment",
      icon: Wallet,
      state: paymentStepState,
      badge: paymentLabel,
      timestamp: latestPaymentActivity,
      description: paymentDescription,
      helper:
        paymentSummary?.contract_total_usd
          ? `${formatMoney(paymentSummary.confirmed_total_usd)} of ${formatMoney(paymentSummary.contract_total_usd)}`
          : "Waiting for payment activity",
      helperIcon: paymentState === "paid" ? CheckCircle2 : Clock3,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_28%),linear-gradient(135deg,#ffffff_0%,#f8fafc_45%,#f0fdf4_100%)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Client Journey
          </div>
          <div className="text-base font-semibold text-slate-950">{getFlowHeadline(opportunity)}</div>
          <p className="max-w-2xl text-sm text-slate-600">
            A focused timeline from the moment the proposal is sent until payment is complete.
          </p>
        </div>
        <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-xs font-medium", getFlowTone(opportunity))}>
          {Math.round(progressValue)}% complete
        </Badge>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="h-2 rounded-full bg-white/80 shadow-inner ring-1 ring-slate-200/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 transition-[width] duration-700 ease-out"
              style={{ width: `${progressValue}%` }}
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-1/2 grid -translate-y-1/2 grid-cols-3">
            {steps.map((step) => {
              const styles = getStepClasses(step.state);
              const Icon = step.icon;

              return (
                <div key={step.title} className="flex justify-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500",
                      styles.dot,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {steps.map((step) => {
          const styles = getStepClasses(step.state);
          const Icon = step.icon;
          const HelperIcon = step.helperIcon;

          return (
            <div
              key={step.title}
              className={cn("flex flex-col rounded-2xl border p-4 transition-all duration-300", styles.card)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                    styles.dot,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-slate-950">{step.title}</div>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", styles.pill)}>
                      {step.badge}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{formatTimelineDate(step.timestamp)}</div>
                </div>
              </div>

              <p className={cn("mt-4 text-sm leading-6", styles.body)}>{step.description}</p>

              <div className="mt-auto pt-4">
                <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">
                  <HelperIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{step.helper}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
