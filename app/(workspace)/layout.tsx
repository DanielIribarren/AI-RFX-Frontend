"use client";

import { ReactNode } from "react";
import AppSidebar from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AiModelSelector } from "@/components/ai-model-selector";
import { useRouter } from "next/navigation";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { RFXCurrencyProvider } from "@/contexts/RFXCurrencyContext";
import { useAuth } from "@/contexts/AuthContext";

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not loading but no user, redirect to login
  // The middleware should handle this, but this is a safety check
  if (!user) {
    console.log('⚠️ WorkspaceLayout: No user found, redirecting to login')
    router.push('/login')
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

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
