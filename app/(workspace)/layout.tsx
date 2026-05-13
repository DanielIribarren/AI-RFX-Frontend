"use client";

import { ReactNode, useEffect, useState } from "react";
import AppSidebar from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { usePathname, useRouter } from "next/navigation";
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
  const pathname = usePathname();
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

  const currentView = (() => {
    if (pathname.startsWith("/dashboard")) return "dashboard";
    if (pathname.startsWith("/overview")) return "overview";
    if (pathname.startsWith("/history")) return "history";
    if (pathname.startsWith("/opportunities")) return "opportunities";
    if (pathname.startsWith("/clients")) return "clients";
    if (pathname.startsWith("/product-inventory")) return "product-inventory";
    if (pathname.startsWith("/business-units")) return "business-units";
    if (pathname.startsWith("/payments-settings")) return "payments-settings";
    if (pathname.startsWith("/intake")) return "intake";
    if (pathname.startsWith("/rfx")) return "rfx";
    return undefined;
  })();

  // ✅ Redirect to login in useEffect to avoid "setState in render" error
  useEffect(() => {
    if (!loading && !user) {
      console.log('⚠️ WorkspaceLayout: No user found, redirecting to login')
      router.push('/login')
    }
  }, [loading, user, router])

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner text="Loading..." fullScreen />
      </div>
    );
  }

  // If not loading but no user, show loading while redirecting
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
              onNewRfx={() => router.push("/intake")}
              onNavigateToDashboard={() => router.push("/dashboard")}
              onNavigateToOverview={() => router.push("/overview")}
              onNavigateToClients={() => router.push("/clients")}
              onNavigateToProductInventory={() => router.push("/product-inventory")}
              onNavigateToBusinessUnits={() => router.push("/business-units")}
              onNavigateToPaymentSettings={() => router.push("/payments-settings")}
              onNavigateToRfx={() => router.push("/rfx")}
              onSelectRfx={(id) => router.push(`/rfx-result-wrapper-v2/data/${id}`)}
              currentView={currentView}
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
