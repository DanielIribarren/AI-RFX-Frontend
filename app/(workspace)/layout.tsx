"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import Breadcrumbs from "@/components/layout/navigation/Breadcrumbs";
import { RFXCurrencyProvider } from "@/contexts/RFXCurrencyContext";
import { CreditsProvider } from "@/contexts/CreditsContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/common";

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 1023px)");
    const apply = (matches: boolean) => setSidebarOpen(!matches);
    apply(mql.matches);
    const handler = (event: MediaQueryListEvent) => apply(event.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner text="Loading..." fullScreen />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner text="Redirecting to login..." fullScreen />
      </div>
    );
  }

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <RFXCurrencyProvider>
        <CreditsProvider>
          <OrganizationProvider>
            <AppSidebar
              onNewProposal={() => router.push("/proposals/new")}
              onSelectProposal={(id) => router.push(`/opportunities/${id}`)}
            />
            <SidebarInset className="bg-background">
              <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumbs />
              </header>
              <div className="flex flex-1 flex-col bg-background">{children}</div>
            </SidebarInset>
          </OrganizationProvider>
        </CreditsProvider>
      </RFXCurrencyProvider>
    </SidebarProvider>
  );
}
