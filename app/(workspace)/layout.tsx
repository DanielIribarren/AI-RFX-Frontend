"use client";

import { ReactNode } from "react";
import AppSidebar from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AiModelSelector } from "@/components/ai-model-selector";
import { useRouter } from "next/navigation";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { RFXCurrencyProvider } from "@/contexts/RFXCurrencyContext";
import { CreditsProvider } from "@/contexts/CreditsContext";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/common";

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner text="Loading..." fullScreen />
      </div>
    );
  }

  // If not loading but no user, redirect to login
  // The middleware should handle this, but this is a safety check
  if (!user) {
    console.log('⚠️ WorkspaceLayout: No user found, redirecting to login')
    router.push('/login')
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner text="Redirecting to login..." fullScreen />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <RFXCurrencyProvider>
        <CreditsProvider>
          <AppSidebar
            onNewRfx={() => router.push("/dashboard")}
            onNavigateToHistory={() => router.push("/history")}
            onNavigateToBudgetSettings={() => router.push("/budget-settings")}
            onSelectRfx={(id) => router.push(`/rfx-result-wrapper-v2/data/${id}`)}
            currentView={undefined} // Will be removed after full migration
          />
          <SidebarInset className="bg-background">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumbs />
              
              {/* AI Model Selector in Header */}
              <div className="ml-auto">
                <AiModelSelector selectedModel="chatgpt-4o" onModelChange={(model) => console.log("Model changed:", model)} />
              </div>
            </header>
            <div className="flex flex-1 flex-col bg-background">{children}</div>
          </SidebarInset>
        </CreditsProvider>
      </RFXCurrencyProvider>
    </SidebarProvider>
  );
}
