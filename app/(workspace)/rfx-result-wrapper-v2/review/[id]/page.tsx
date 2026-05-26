"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import RFXReviewInlineChat from "@/components/features/rfx/RFXReviewInlineChat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RFXReviewStateData } from "@/lib/api";
import { getReviewState, type ReviewEntityType } from "@/lib/review-api";

type ReviewPageState = {
  entityType: ReviewEntityType;
  reviewState: RFXReviewStateData | null;
};

async function resolveReviewContext(id: string): Promise<ReviewPageState> {
  try {
    const sessionResponse = await getReviewState(id, "session");
    return {
      entityType: "session",
      reviewState: sessionResponse?.data ?? null,
    };
  } catch (sessionError) {
    try {
      const rfxResponse = await getReviewState(id, "rfx");
      return {
        entityType: "rfx",
        reviewState: rfxResponse?.data ?? null,
      };
    } catch {
      if (sessionError instanceof Error) {
        throw sessionError;
      }
      throw new Error("Could not load the review context.");
    }
  }
}

export default function RfxReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [context, setContext] = useState<ReviewPageState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const nextContext = await resolveReviewContext(id);
        if (!isMounted) return;

        const reviewState = nextContext.reviewState;
        const confirmedRfxId =
          reviewState?.confirmed_rfx_id ||
          (nextContext.entityType === "rfx" ? id : null);

        if (reviewState?.review_confirmed && confirmedRfxId) {
          router.replace(`/rfx-result-wrapper-v2/data/${confirmedRfxId}`);
          return;
        }

        setContext(nextContext);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load the review context.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Loading conversational review...</p>
        </Card>
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-800">Review unavailable</h1>
          <p className="mt-2 text-sm text-red-700">
            {error || "We could not load this review context."}
          </p>
          <div className="mt-4 flex gap-3">
            <Button asChild variant="outline">
              <Link href="/proposals/new">Back to new proposal</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">Review before proposal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Adjust the extracted context, confirm the request, and continue to the opportunity only when the service scope makes sense.
        </p>
      </Card>

      <RFXReviewInlineChat
        rfxId={id}
        entityType={context.entityType}
        initialData={context.reviewState?.preview_data}
        onConfirmed={(finalRfxId) => {
          router.push(`/rfx-result-wrapper-v2/data/${finalRfxId}`);
        }}
        onStartOver={() => {
          router.replace("/proposals/new");
        }}
      />
    </div>
  );
}
