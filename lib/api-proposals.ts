/**
 * Single source of truth for the Proposal entity in the UI. Wraps the
 * existing backend endpoints (Budy opportunities + legacy RFX metrics) under
 * the unified "Proposal" vocabulary that the UI will consume.
 *
 * Backend has not been renamed yet; routes still say /api/opportunities and
 * /api/rfx/metrics/overview. This module is the translation boundary — UI
 * code must import from here, never from api-budy.ts or api.ts directly for
 * proposal-related reads.
 *
 * Phase 1 of the Home + Proposals unification. See:
 *   ~/.gstack/projects/DanielIribarren-AI-RFX-Frontend/danielairibarren-main-design-20260526-102729.md
 */

import { api } from "@/lib/api";
import { budyApi, type Opportunity, type OpportunityDetail } from "@/lib/api-budy";
import type { ProposalStage } from "@/lib/proposal-stage";

/** UI-facing alias for the Budy Opportunity shape. Same data, proposal vocab. */
export type Proposal = Opportunity;
export type ProposalDetail = OpportunityDetail;

export interface ProposalListFilters {
  business_unit_id?: string;
  stage?: ProposalStage;
}

export interface ProposalMetrics {
  range_days: number;
  kpis: {
    total: number;
    in_progress: number;
    processed: number;
    sent: number;
    accepted: number;
    acceptance_rate: number;
  };
  funnel: {
    processed: number;
    sent: number;
    accepted: number;
  };
  timeseries: Array<{
    date: string;
    created: number;
    processed: number;
    sent: number;
    accepted: number;
  }>;
}

export const proposalsApi = {
  /**
   * List proposals (optionally filtered by service or stage).
   * Wraps GET /api/opportunities and translates `stage` -> `sales_stage`.
   */
  async list(filters?: ProposalListFilters): Promise<Proposal[]> {
    return budyApi.getOpportunities({
      business_unit_id: filters?.business_unit_id,
      sales_stage: filters?.stage,
    });
  },

  /** Fetch a single proposal with full detail (products, payments, summary). */
  async get(id: string): Promise<ProposalDetail> {
    return budyApi.getOpportunity(id);
  },

  /** Patch a proposal — typically used to advance stage or update metadata. */
  async update(id: string, payload: Partial<Proposal> & Record<string, any>): Promise<ProposalDetail> {
    return budyApi.updateOpportunity(id, payload);
  },

  /**
   * Aggregated dashboard metrics for the Home screen.
   * Delegates to the legacy /api/rfx/metrics/overview endpoint via
   * api.getRFXMetricsOverview and remaps the payload into proposal
   * vocabulary. Backend rename is a separate task.
   *
   * Scope: org-wide. No per-service (business_unit_id) filter — business
   * units are not actively segmented in the product today. Add the filter
   * only if multi-service reporting becomes a real need.
   */
  async getMetrics(rangeDays: number = 30): Promise<ProposalMetrics> {
    const response = await api.getRFXMetricsOverview(rangeDays);
    if (response.status !== "success") {
      throw new Error(response.message || "Failed to load proposal metrics");
    }
    const raw = response.data;
    return {
      range_days: raw.range_days,
      kpis: {
        total: raw.kpis.total_rfx,
        in_progress: raw.kpis.in_progress,
        processed: raw.kpis.processed,
        sent: raw.kpis.sent,
        accepted: raw.kpis.accepted,
        acceptance_rate: raw.kpis.acceptance_rate,
      },
      funnel: raw.funnel,
      timeseries: raw.timeseries,
    };
  },
};
