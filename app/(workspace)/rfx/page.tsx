"use client";

import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/common";
import { RFXDataTable } from "@/components/features/rfx/RFXDataTable";

export default function RFXManagementPage() {
  return (
    <div className="space-y-6 p-4 lg:p-6 xl:p-8">
      <PageHeader
        title="Intakes"
        description="Manage and track all your incoming requests for quotation."
        icon={ClipboardList}
      />
      <RFXDataTable />
    </div>
  );
}
