/**
 * Proposal lifecycle: single source of truth for the user-facing "Proposal"
 * entity state across the UI. Maps 1:1 onto the Budy `Opportunity.sales_stage`
 * field on the backend. Legacy `RFXHistoryItem` (processing_status +
 * commercial_status + agentic_status) is being retired; new UI surfaces must
 * consume `ProposalStage` exclusively.
 *
 * Vocabulary rule: in user-facing strings (UI) the entity is called
 * "Proposal" / "Propuesta", never RFX / Intake / Opportunity / Request.
 * Internal identifiers (sales_stage, opportunity_id, business_unit_id) stay
 * unchanged in code and API contracts.
 */

import type { SalesStage } from "@/lib/api-budy";

/**
 * Canonical lifecycle for a Proposal. Each value matches one Budy
 * `sales_stage` literal; reusing the same string union keeps API responses
 * compatible without a runtime mapping layer.
 */
export type ProposalStage = SalesStage;

/** Stage groups for UI filtering and KPI aggregation. */
export const PROPOSAL_STAGE_GROUPS = {
  open: ["draft", "sent", "viewed"] as const,
  won: ["accepted", "payment_pending", "partially_paid", "confirmed", "in_execution", "completed"] as const,
  lost: ["cancelled"] as const,
} satisfies Record<string, readonly ProposalStage[]>;

/**
 * Compile-time exhaustiveness check: if a new SalesStage value is added to
 * api-budy.ts, this assertion fails until it is classified into a group above.
 * Catches the failure mode where a new backend stage silently drops out of
 * filters and metrics.
 */
type _StageCoverage =
  | (typeof PROPOSAL_STAGE_GROUPS.open)[number]
  | (typeof PROPOSAL_STAGE_GROUPS.won)[number]
  | (typeof PROPOSAL_STAGE_GROUPS.lost)[number];
type _AssertCoverage = ProposalStage extends _StageCoverage ? true : never;
const _coverageAssertion: _AssertCoverage = true;
void _coverageAssertion;

/** English display labels for stage chips, tables, and detail headers. */
export const PROPOSAL_STAGE_LABELS_EN: Record<ProposalStage, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  payment_pending: "Payment pending",
  partially_paid: "Partially paid",
  confirmed: "Confirmed",
  in_execution: "In execution",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Spanish display labels — used when the workspace locale resolves to es. */
export const PROPOSAL_STAGE_LABELS_ES: Record<ProposalStage, string> = {
  draft: "Borrador",
  sent: "Enviada",
  viewed: "Vista",
  accepted: "Aceptada",
  payment_pending: "Pago pendiente",
  partially_paid: "Pago parcial",
  confirmed: "Confirmada",
  in_execution: "En ejecución",
  completed: "Completada",
  cancelled: "Cancelada",
};

/**
 * Tone classification for stage chips/badges. UI maps each tone to the design
 * system color tokens; keeping it here means a single rename if we adopt a new
 * palette.
 */
export type ProposalStageTone = "neutral" | "info" | "warning" | "success" | "danger";

export const PROPOSAL_STAGE_TONES: Record<ProposalStage, ProposalStageTone> = {
  draft: "neutral",
  sent: "info",
  viewed: "info",
  accepted: "success",
  payment_pending: "warning",
  partially_paid: "warning",
  confirmed: "success",
  in_execution: "success",
  completed: "success",
  cancelled: "danger",
};

export type ProposalStageGroup = keyof typeof PROPOSAL_STAGE_GROUPS;

/** Returns the group that contains the given stage. */
export function getProposalStageGroup(stage: ProposalStage): ProposalStageGroup {
  if ((PROPOSAL_STAGE_GROUPS.open as readonly ProposalStage[]).includes(stage)) return "open";
  if ((PROPOSAL_STAGE_GROUPS.won as readonly ProposalStage[]).includes(stage)) return "won";
  return "lost";
}

/**
 * True for stages in the `open` group (draft, sent, viewed) — proposals that
 * have not yet been accepted or cancelled. Drives the "Open proposals" KPI.
 * NOTE: this is narrower than "active" in business sense; deals in execution
 * are classified `won` because acceptance has already happened.
 */
export function isProposalOpen(stage: ProposalStage): boolean {
  return getProposalStageGroup(stage) === "open";
}

/** True for stages that count toward acceptance-rate numerator. */
export function isProposalWon(stage: ProposalStage): boolean {
  return getProposalStageGroup(stage) === "won";
}

/**
 * Returns the locale-appropriate label for a stage. Default locale is "en"
 * so legacy callers that don't pass a locale keep working unchanged.
 */
export function getProposalStageLabel(stage: ProposalStage, locale: "en" | "es" = "en"): string {
  return locale === "es" ? PROPOSAL_STAGE_LABELS_ES[stage] : PROPOSAL_STAGE_LABELS_EN[stage];
}
