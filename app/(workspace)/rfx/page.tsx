"use client";

import { useRouter } from "next/navigation";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common";
import { RFXDataTable } from "@/components/features/rfx/RFXDataTable";

export default function RFXManagementPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 p-4 lg:p-6 xl:p-8">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Intakes"
          description="Manage and track all your incoming requests for quotation."
          icon={ClipboardList}
        />
        <Button
          onClick={() => router.push("/intake")}
          className="gap-2 bg-brand-gradient text-white hover:brightness-95 shadow-md shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nuevo RFX
        </Button>
      </div>

      <RFXDataTable />
    </div>
  );
}
