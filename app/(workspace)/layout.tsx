"use client";

import { ReactNode } from "react";
import AppSidebar from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AiModelSelector } from "@/components/ai-model-selector";
import { useRouter } from "next/navigation";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { RFXCurrencyProvider } from "@/contexts/RFXCurrencyContext";

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const router = useRouter();

  return (
    <SidebarProvider>
      <RFXCurrencyProvider>
        <AppSidebar
          onNewRfx={() => router.push("/dashboard")}
          onNavigateToHistory={() => router.push("/history")}
          onNavigateToBudgetSettings={() => router.push("/budget-settings")}
          onSelectRfx={(id) => router.push(`/rfx-result-wrapper-v2/data/${id}`)}
          currentView={undefined} // Will be removed after full migration
        />
        <SidebarInset className="bg-white">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200/60 px-4 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <SidebarTrigger className="-ml-1 text-gray-500 hover:text-gray-700" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-gray-300" />
            <Breadcrumbs />
            
            {/* AI Model Selector in Header */}
            <div className="ml-auto">
              <AiModelSelector selectedModel="chatgpt-4o" onModelChange={(model) => console.log("Model changed:", model)} />
            </div>
          </header>
          <div className="flex flex-1 flex-col bg-white">{children}</div>
        </SidebarInset>
      </RFXCurrencyProvider>
    </SidebarProvider>
  );
}
