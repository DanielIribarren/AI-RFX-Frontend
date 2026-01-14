"use client"

import { useState, useEffect, useImperativeHandle, forwardRef } from "react"
import { Plus, MessageSquare, FileText, Clock, MoreHorizontal, ChevronLeft, CheckCircle, XCircle, AlertTriangle, Archive, Settings, Trash2 } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/ui/sidebar"
import { api, APIError, RFXHistoryItem, useAPICall } from "@/lib/api"
import { useCachedData } from "@/lib/use-cached-data"
import { SidebarUser } from "@/components/layout/SidebarUser"

interface RfxItem {
  id: string
  title: string
  client: string
  date: string
  status: "Draft" | "In progress" | "Completed" | "Cancelled" | "Expired"
  // Usuario que procesó el RFX
  processed_by?: {
    id: string
    name: string
    email: string
    username?: string
    avatar_url?: string
    created_at?: string
  }
}

interface AppSidebarProps {
  onNewRfx: () => void
  onNavigateToHistory: () => void
  onNavigateToBudgetSettings?: () => void
  onSelectRfx?: (rfxId: string) => void
  currentView?: "main" | "results" | "history" | "budget-settings" | undefined
}

export interface AppSidebarRef {
  refresh: () => Promise<void>
}

// Función utilitaria para mapear estados de backend a estados de display
const mapBackendStatusToDisplay = (backendStatus: string): "Draft" | "In progress" | "Completed" | "Cancelled" | "Expired" => {
  const status = backendStatus.toLowerCase();
  
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'expired':
      return 'Expired';
    default:
      // Fallback para valores no reconocidos
      return 'In progress';
  }
}

// Función utilitaria para obtener icono y color del estado en sidebar
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Draft':
      return <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden" />;
    case 'In progress':
      return <Clock className="h-3 w-3 text-primary-light flex-shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden" />;
    case 'Completed':
      return <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden" />;
    case 'Cancelled':
      return <XCircle className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden" />;
    case 'Expired':
      return <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden" />;
    default:
      return <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden" />;
  }
}

// Helper function to format dates: Today, Yesterday, or DD/MM
const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const diffTime = nowOnly.getTime() - dateOnly.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}`
}

const AppSidebar = forwardRef<AppSidebarRef, AppSidebarProps>(
  ({ onNewRfx, onNavigateToHistory, onNavigateToBudgetSettings, onSelectRfx, currentView }, ref) => {
    const { toggleSidebar } = useSidebar()
    const { handleAPIError } = useAPICall()
    
    // Estado de feedback inline (sin toasts)
    const [feedback, setFeedback] = useState<{
      type: "success" | "error"
      title: string
      message?: string
    } | null>(null)
    
    // Auto-clear feedback después de 4 segundos
    useEffect(() => {
      if (feedback) {
        const timer = setTimeout(() => setFeedback(null), 4000)
        return () => clearTimeout(timer)
      }
    }, [feedback])
    
    // ✅ Hook de cache: carga del cache primero, luego API si es necesario
    const { data: recentRfx, isLoading, refresh } = useCachedData(
      async () => {
        const response = await api.getLatestRFX(10)
        
        // Transform backend data to frontend format
        const transformedData: RfxItem[] = response.data.map((item: RFXHistoryItem) => {
          const mostRecentISO = item.updated_at || item.last_activity_at || item.last_updated || item.date
          return {
            id: item.id,
            title: item.title,
            client: item.client,
            date: formatRelativeDate(mostRecentISO),
            status: mapBackendStatusToDisplay(item.status),
            processed_by: item.processed_by, // ✅ Include user who processed the RFX
          }
        })
        
        return transformedData
      },
      { key: 'sidebar-recent-rfx', expiryMinutes: 1 } // Reducido a 1 minuto para mayor frescura
    )
    
    // Expose refresh method to parent components
    useImperativeHandle(ref, () => ({
      refresh
    }))

    const handleRfxAction = (action: string, rfxId: string, rfxTitle?: string) => {
      switch (action) {
        case "view":
          if (onSelectRfx) {
            onSelectRfx(rfxId)
          }
          break
        case "download":
          console.log("Download RFX:", rfxId)
          break
        case "duplicate":
          console.log("Duplicate RFX:", rfxId)
          break
        case "delete":
          handleDeleteRFX(rfxId, rfxTitle || "este RFX")
          break
      }
    }

    const handleDeleteRFX = async (rfxId: string, rfxTitle: string) => {
      // Note: Sidebar uses dropdown menu, so we can't use a dialog easily
      // We'll use window.confirm here but with toast for feedback
      const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar "${rfxTitle}"?\n\nEsta acción no se puede deshacer.`)
      if (!confirmed) return
      
      try {
        console.log(`🗑️ Deleting RFX: ${rfxId}`)
        await api.deleteRFX(rfxId)
        console.log(`✅ RFX deleted successfully`)
        
        // Invalidar cache antes de refrescar para forzar llamada al API
        const SIDEBAR_CACHE_KEY = 'sidebar-recent-rfx'
        localStorage.removeItem(SIDEBAR_CACHE_KEY)
        console.log('🔄 Cache invalidated, forcing fresh data')
        
        // Refresh sidebar to remove deleted RFX
        await refresh()
        
        // Show success feedback inline
        setFeedback({
          type: "success",
          title: "RFX eliminado",
          message: `"${rfxTitle}" ha sido eliminado exitosamente`,
        })
      } catch (error) {
        console.error(`❌ Error deleting RFX:`, error)
        
        // Determine error type and show appropriate message
        let errorTitle = "Error al eliminar"
        let errorMessage = "No se pudo eliminar el RFX"
        
        if (error instanceof APIError) {
          if (error.status === 403) {
            errorTitle = "Acceso denegado"
            errorMessage = "No tienes permiso para eliminar este RFX. Solo el creador puede eliminarlo."
          } else if (error.status === 404) {
            errorTitle = "RFX no encontrado"
            errorMessage = "El RFX que intentas eliminar ya no existe."
          } else if (error.status === 401) {
            errorTitle = "Sesión expirada"
            errorMessage = "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
          } else {
            errorMessage = error.message || "Ocurrió un error al eliminar el RFX"
          }
        }
        
        // Show error feedback inline
        setFeedback({
          type: "error",
          title: errorTitle,
          message: errorMessage,
        })
      }
    }

    const truncateText = (text: string, maxLength = 35) => {
      return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
    }

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-200/60 bg-background">
      <SidebarHeader className="border-b border-gray-200/60 px-3 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-gradient p-1.5 rounded-lg shadow-sm">
              <FileText className="h-4 w-4 text-background" />
            </div>
            <span className="font-bold text-gray-900 group-data-[collapsible=icon]:hidden">Budy AI</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-gray-700 group-data-[collapsible=icon]:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {/* New RFX Button */}
        <SidebarGroup className="mb-6">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onNewRfx}
                  className="w-full bg-brand-gradient text-background font-semibold h-10 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ease-out border-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>New RFX</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation Menu */}
        <SidebarGroup className="mb-6">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onNavigateToHistory}
                  isActive={currentView === "history"}
                  className="w-full justify-start text-gray-700 hover:bg-primary/5 hover:text-primary h-9 rounded-lg transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>RFX History</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onNavigateToBudgetSettings}
                  isActive={currentView === "budget-settings"}
                  className="w-full justify-start text-gray-700 hover:bg-primary/5 hover:text-primary h-9 rounded-lg transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                >
                  <Settings className="h-4 w-4" />
                  <span>Budget Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent RFX */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-900 mb-3 px-0 uppercase tracking-wider">Recents</SidebarGroupLabel>
          
          {/* Feedback inline banner */}
          {feedback && (
            <div
              role="status"
              aria-live="polite"
              className={`group-data-[collapsible=icon]:hidden mb-3 rounded-lg p-3 text-sm border ${
                feedback.type === "success"
                  ? "bg-green-50 text-green-800 border-green-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
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
                    <div className="text-xs mt-1 opacity-80">{feedback.message}</div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <SidebarGroupContent>
            {isLoading ? (
              <div className="px-2 py-4 text-center group-data-[collapsible=icon]:hidden">
                <div className="text-xs text-muted-foreground/60">Loading...</div>
              </div>
            ) : !recentRfx || recentRfx.length === 0 ? (
              <div className="px-2 py-4 text-center group-data-[collapsible=icon]:hidden">
                <div className="text-xs text-muted-foreground/60">No recent RFX</div>
              </div>
            ) : (
              <SidebarMenu>
                {recentRfx.map((rfx) => (
                  <SidebarMenuItem key={rfx.id}>
                    <SidebarMenuButton
                      onClick={() => onSelectRfx?.(rfx.id)}
                      className="w-full justify-start h-auto py-2.5 px-3 text-left hover:bg-primary/5 hover:border-l-2 hover:border-l-primary rounded-lg group transition-all duration-200"
                    >
                      <div className="flex items-start gap-2 w-full min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 truncate group-data-[collapsible=icon]:hidden">
                            {truncateText(rfx.title)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 group-data-[collapsible=icon]:hidden">
                            {rfx.client} • {rfx.date}
                          </div>
                        </div>
                        {getStatusIcon(rfx.status)}
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
                          <DropdownMenuItem onClick={() => handleRfxAction("view", rfx.id)}>
                            View Details
                          </DropdownMenuItem>
                          {rfx.status === "Completed" && (
                            <DropdownMenuItem onClick={() => handleRfxAction("download", rfx.id)}>
                              Download PDF
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleRfxAction("duplicate", rfx.id)}>
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRfxAction("delete", rfx.id, rfx.title)} 
                            className="text-destructive focus:text-destructive focus:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
})

AppSidebar.displayName = "AppSidebar"

export default AppSidebar

