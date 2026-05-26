"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Clock,
  FileText,
  HandCoins,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  Plus,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api, APIError } from "@/lib/api";
import { proposalsApi, type Proposal } from "@/lib/api-proposals";
import {
  PROPOSAL_STAGE_TONES,
  getProposalStageGroup,
  type ProposalStage,
  type ProposalStageTone,
} from "@/lib/proposal-stage";
import { useCachedData } from "@/lib/use-cached-data";
import { CreditsBadge } from "@/components/credits/CreditsBadge";
import { SidebarUser } from "@/components/layout/SidebarUser";
import { cn } from "@/lib/utils";

interface ProposalListItem {
  id: string;
  title: string;
  client: string;
  date: string;
  stage: ProposalStage;
}

export interface AppSidebarRef {
  refresh: () => Promise<void>;
}

interface AppSidebarProps {
  onNewProposal?: () => void;
  onSelectProposal?: (proposalId: string) => void;
}

const STAGE_ICON_CLASS: Record<ProposalStageTone, string> = {
  neutral: "text-muted-foreground",
  info: "text-sky-500",
  warning: "text-amber-500",
  success: "text-emerald-500",
  danger: "text-red-500",
};

function StageIcon({ stage }: { stage: ProposalStage }) {
  const tone = PROPOSAL_STAGE_TONES[stage];
  const className = cn(
    "h-3 w-3 flex-shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden",
    STAGE_ICON_CLASS[tone],
  );
  if (stage === "cancelled") return <XCircle className={className} />;
  if (stage === "completed" || stage === "confirmed" || stage === "accepted")
    return <CheckCircle className={className} />;
  if (stage === "draft") return <FileText className={className} />;
  if (stage === "payment_pending" || stage === "partially_paid")
    return <AlertTriangle className={className} />;
  return <Clock className={className} />;
}

function formatRelativeDate(dateString?: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (!Number.isFinite(date.getTime())) return "—";
  const now = new Date();
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor(
    (nowOnly.getTime() - dateOnly.getTime()) / 86_400_000,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function truncateText(text: string, maxLength = 35): string {
  return text.length > maxLength ? `${text.substring(0, maxLength)}…` : text;
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  matcher?: (pathname: string) => boolean;
}

const NAV_WORKSPACE: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: LayoutDashboard,
    matcher: (p) => p === "/dashboard",
  },
  {
    href: "/proposals",
    label: "Proposals",
    icon: FileText,
    matcher: (p) => p === "/proposals" || p.startsWith("/proposals/"),
  },
];

const NAV_OPERATIONS: NavItem[] = [
  {
    href: "/clients",
    label: "Clients",
    icon: Users,
  },
  {
    href: "/product-inventory",
    label: "Product inventory",
    icon: Package,
  },
];

const NAV_SETTINGS: NavItem[] = [
  {
    href: "/payments-settings",
    label: "Payments",
    icon: HandCoins,
  },
];

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <SidebarGroup className="mb-3">
      <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-2 mb-1">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = item.matcher
              ? item.matcher(pathname)
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className="w-full justify-start text-gray-700 hover:bg-primary/5 hover:text-primary h-9 rounded-lg transition-colors data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

const AppSidebar = forwardRef<AppSidebarRef, AppSidebarProps>(
  ({ onNewProposal, onSelectProposal }, ref) => {
    const pathname = usePathname() ?? "";
    const { toggleSidebar } = useSidebar();

    const [feedback, setFeedback] = useState<{
      type: "success" | "error";
      title: string;
      message?: string;
    } | null>(null);
    const [deleteCandidate, setDeleteCandidate] = useState<{
      id: string;
      title: string;
    } | null>(null);

    useEffect(() => {
      if (!feedback) return;
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }, [feedback]);

    const {
      data: recentProposals,
      isLoading,
      refresh,
    } = useCachedData<ProposalListItem[]>(
      async () => {
        const proposals = await proposalsApi.list();
        return proposals
          .slice()
          .sort((a, b) => {
            const aDate = new Date(a.updated_at || a.created_at || 0).getTime();
            const bDate = new Date(b.updated_at || b.created_at || 0).getTime();
            return bDate - aDate;
          })
          .slice(0, 10)
          .map((p: Proposal) => ({
            id: p.id,
            title: p.title || "Untitled proposal",
            client: p.client?.name || "—",
            date: formatRelativeDate(p.updated_at || p.created_at),
            stage: p.sales_stage,
          }));
      },
      { key: "sidebar-recent-proposals", expiryMinutes: 1 },
    );

    useImperativeHandle(ref, () => ({ refresh }));

    const handleProposalAction = (
      action: "view" | "duplicate" | "delete",
      proposalId: string,
      proposalTitle?: string,
    ) => {
      switch (action) {
        case "view":
          onSelectProposal?.(proposalId);
          break;
        case "duplicate":
          // Duplicate is not implemented yet; surface a placeholder feedback.
          setFeedback({
            type: "error",
            title: "Not implemented",
            message: "Duplicate is coming soon.",
          });
          break;
        case "delete":
          setDeleteCandidate({
            id: proposalId,
            title: proposalTitle || "this proposal",
          });
          break;
      }
    };

    const handleDeleteProposal = async (id: string, title: string) => {
      try {
        await api.deleteRFX(id);
        localStorage.removeItem("sidebar-recent-proposals");
        await refresh();
        setFeedback({
          type: "success",
          title: "Proposal deleted",
          message: `"${title}" was deleted successfully.`,
        });
      } catch (error) {
        let errorTitle = "Delete error";
        let errorMessage = "Could not delete the proposal.";
        if (error instanceof APIError) {
          if (error.status === 403) {
            errorTitle = "Access denied";
            errorMessage = "You do not have permission to delete this proposal.";
          } else if (error.status === 404) {
            errorTitle = "Proposal not found";
            errorMessage = "The proposal you are trying to delete no longer exists.";
          } else if (error.status === 401) {
            errorTitle = "Session expired";
            errorMessage = "Your session expired. Please sign in again.";
          } else {
            errorMessage =
              error.message || "An error occurred while deleting the proposal.";
          }
        }
        setFeedback({ type: "error", title: errorTitle, message: errorMessage });
      } finally {
        setDeleteCandidate(null);
      }
    };

    return (
      <Sidebar
        collapsible="icon"
        className="border-r border-gray-200/60 bg-background"
      >
        <SidebarHeader className="border-b border-gray-200/60 px-3 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-brand-gradient p-1.5 rounded-lg shadow-sm">
                <FileText className="h-4 w-4 text-background" />
              </div>
              <span className="font-bold text-gray-900 group-data-[collapsible=icon]:hidden">
                Budy AI
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-gray-700 group-data-[collapsible=icon]:hidden"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          <SidebarGroup className="mb-6">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={onNewProposal}
                    className="w-full bg-brand-gradient text-background hover:text-background hover:brightness-95 font-semibold h-10 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ease-out border-0"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New proposal</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="mb-4 px-2 group-data-[collapsible=icon]:hidden">
            <CreditsBadge />
          </div>

          <NavGroup label="Workspace" items={NAV_WORKSPACE} pathname={pathname} />
          <NavGroup label="Operations" items={NAV_OPERATIONS} pathname={pathname} />
          <NavGroup label="Settings" items={NAV_SETTINGS} pathname={pathname} />

          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-2 mb-2">
              Recent proposals
            </SidebarGroupLabel>

            {feedback && (
              <div
                role="status"
                aria-live="polite"
                className={cn(
                  "group-data-[collapsible=icon]:hidden mb-3 rounded-lg p-3 text-sm border motion-fade-up",
                  feedback.type === "success"
                    ? "bg-green-50 text-green-800 border-green-200"
                    : "bg-red-50 text-red-800 border-red-200",
                )}
              >
                <div className="flex items-start gap-2">
                  {feedback.type === "success" ? (
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{feedback.title}</div>
                    {feedback.message && (
                      <div className="text-xs mt-1 opacity-80">
                        {feedback.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <SidebarGroupContent>
              {isLoading ? (
                <div className="px-2 py-4 text-center group-data-[collapsible=icon]:hidden">
                  <div className="text-xs text-muted-foreground/60">Loading…</div>
                </div>
              ) : !recentProposals || recentProposals.length === 0 ? (
                <div className="px-2 py-4 text-center group-data-[collapsible=icon]:hidden">
                  <div className="text-xs text-muted-foreground/60">
                    No recent proposals
                  </div>
                </div>
              ) : (
                <SidebarMenu>
                  {recentProposals.map((p) => {
                    const group = getProposalStageGroup(p.stage);
                    return (
                      <SidebarMenuItem key={p.id}>
                        <SidebarMenuButton
                          onClick={() => onSelectProposal?.(p.id)}
                          className="w-full justify-start h-auto py-2.5 px-3 text-left hover:bg-primary/5 hover:border-l-2 hover:border-l-primary rounded-lg group transition-all duration-200"
                        >
                          <div className="flex items-start gap-2 w-full min-w-0">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-900 truncate group-data-[collapsible=icon]:hidden">
                                {truncateText(p.title)}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 group-data-[collapsible=icon]:hidden">
                                {p.client} · {p.date}
                              </div>
                            </div>
                            <StageIcon stage={p.stage} />
                          </div>
                        </SidebarMenuButton>
                        <SidebarMenuAction className="group-data-[collapsible=icon]:hidden opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div className="h-6 w-6 p-0 text-muted-foreground/60 hover:text-muted-foreground cursor-pointer flex items-center justify-center rounded-sm hover:bg-muted">
                                <MoreHorizontal className="h-3 w-3" />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleProposalAction("view", p.id)}
                              >
                                View details
                              </DropdownMenuItem>
                              {group === "won" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleProposalAction("duplicate", p.id)
                                  }
                                >
                                  Duplicate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  handleProposalAction("delete", p.id, p.title)
                                }
                                className="text-destructive focus:text-destructive focus:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuAction>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarUser />
        </SidebarFooter>

        <AlertDialog
          open={Boolean(deleteCandidate)}
          onOpenChange={(open) => !open && setDeleteCandidate(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete proposal</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. It will permanently delete
                {deleteCandidate?.title
                  ? ` "${deleteCandidate.title}"`
                  : " this proposal"}
                .
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deleteCandidate) {
                    handleDeleteProposal(
                      deleteCandidate.id,
                      deleteCandidate.title,
                    );
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <SidebarRail />
      </Sidebar>
    );
  },
);

AppSidebar.displayName = "AppSidebar";

export default AppSidebar;
