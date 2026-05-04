"use client";

import { useEffect, useMemo, useState } from "react";
import RfxChatInput from "@/components/features/rfx/RFXChatInput";
import RFXReviewInlineChat from "@/components/features/rfx/RFXReviewInlineChat";
import { useRouter, useSearchParams } from "next/navigation";
import type { RFXResponse } from "@/lib/api";
import { showErrorToast } from "@/lib/toast";
import { BusinessUnitSwitcher } from "@/components/features/budy/BusinessUnitSwitcher";
import { useOrganization } from "@/contexts/OrganizationContext";

export default function IntakePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    organization,
    businessUnits,
    activeBusinessUnitId,
    setActiveBusinessUnitId,
    isBusinessUnitsLoading,
  } = useOrganization();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reviewSession, setReviewSession] = useState<{ rfxId: string; entityType: "rfx" | "session"; data?: any } | null>(null);
  const reviewRfxId = searchParams.get("review_rfx_id");
  const reviewEntityTypeParam = searchParams.get("review_entity_type");
  const reviewEntityType = useMemo<"rfx" | "session">(
    () => (reviewEntityTypeParam === "session" ? "session" : "rfx"),
    [reviewEntityTypeParam],
  );

  useEffect(() => {
    if (!reviewRfxId) {
      setReviewSession(null);
      return;
    }

    setReviewSession((current) => {
      if (current?.rfxId === reviewRfxId && current.entityType === reviewEntityType) {
        return current;
      }

      return {
        rfxId: reviewRfxId,
        entityType: reviewEntityType,
      };
    });
  }, [reviewEntityType, reviewRfxId]);

  const handleFileProcessed = async (text: string) => {
    console.log("File processed:", text);
    setIsAnalyzing(false);
  };

  const handleRFXProcessed = async (response: RFXResponse) => {
    if (response.status === "success" && response.data?.id) {
      const useReviewStep = Boolean(response.review_required) || response.next_step === "review_chat";
      if (useReviewStep) {
        const entityType = (
          response.entity_type === "session" ||
          (response.session_id && response.session_id === response.data.id)
            ? "session"
            : "rfx"
        ) as "rfx" | "session";
        const reviewId = response.session_id || response.data.id;
        setReviewSession({
          rfxId: reviewId,
          entityType,
          data: entityType === "session" ? undefined : response.data,
        });
        router.replace(`/intake?review_rfx_id=${encodeURIComponent(reviewId)}&review_entity_type=${entityType}`);
        return;
      }

      router.push(`/rfx-result-wrapper-v2/data/${response.data.id}`);
    } else {
      showErrorToast({
        title: "Could not process the request",
        message: response.message || "Unknown error",
      });
    }
  };

  const requiresBusinessUnitSetup = Boolean(
    organization && !isBusinessUnitsLoading && businessUnits.length === 0,
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary/10 p-4">
      <div className="w-full space-y-10">
        <div className="text-center space-y-5">
          <div className="flex items-center justify-center gap-3 animate-float">
            <div className="bg-brand-gradient p-3 rounded-2xl shadow-lg">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-primary">
              Intake Center
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload documents or paste requests to build a Budy opportunity draft without leaving the platform.
          </p>
        </div>

        {organization && businessUnits.length > 0 && (
          <div className="mx-auto max-w-5xl rounded-2xl border bg-white/80 p-5 shadow-sm">
            <BusinessUnitSwitcher
              businessUnits={businessUnits}
              value={activeBusinessUnitId || ""}
              onValueChange={setActiveBusinessUnitId}
              label="Business unit for this intake"
            />
            <p className="mt-3 text-sm text-muted-foreground">
              This selection controls extraction context, catalog matching, branding, and payment settings for the resulting opportunity.
            </p>
          </div>
        )}

        {requiresBusinessUnitSetup && (
          <div className="mx-auto max-w-5xl rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            Create a business unit before uploading organization-owned RFX documents. Intake is blocked until one is available.
          </div>
        )}

        {reviewSession && (
          <div className="max-w-5xl mx-auto pt-4">
            <div className="mb-6 rounded-2xl border bg-white/90 p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Review extracted opportunity</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Validate the extracted details before creating the final RFX and moving it into the proposal workflow.
              </p>
            </div>
            <RFXReviewInlineChat
              rfxId={reviewSession.rfxId}
              entityType={reviewSession.entityType}
              initialData={reviewSession.data}
              onConfirmed={(rfxId) => {
                setReviewSession(null);
                router.push(`/opportunities/${rfxId}`);
              }}
              onStartOver={() => {
                setReviewSession(null);
                router.replace("/intake");
              }}
            />
          </div>
        )}

        {!reviewSession && (
          <>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="group card-elevated-lg p-7 hover-lift hover-glow-brand cursor-default">
                <h3 className="font-bold text-gray-900 mb-2 text-lg">AI intake</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Turn emails, PDFs, briefs, and messages into a structured opportunity inside Budy.
                </p>
              </div>
              <div className="group card-elevated-lg p-7 hover-lift hover-glow-brand cursor-default">
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Review before publish</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Keep the conversational review step to validate details before moving to proposal.
                </p>
              </div>
              <div className="group card-elevated-lg p-7 hover-lift hover-glow-brand cursor-default">
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Legacy compatible</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This route preserves the AI-RFX document flow while Budy becomes the primary workspace.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <RfxChatInput
                onFileProcessed={handleFileProcessed}
                onRFXProcessed={handleRFXProcessed}
                isLoading={isAnalyzing || requiresBusinessUnitSetup}
                businessUnitId={activeBusinessUnitId || undefined}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
