"use client";

import RfxHistory from "@/components/features/rfx/RFXHistory";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const router = useRouter();

  return (
    <RfxHistory
      onNewRfx={() => router.push("/dashboard")}
      onNavigateToMain={() => router.push("/dashboard")}
      onViewFullAnalysis={(rfxId) => router.push(`/rfx-result-wrapper-v2/data/${rfxId}`)}
    />
  );
}
