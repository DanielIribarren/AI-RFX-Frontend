"use client"

import { useState, useEffect, useImperativeHandle, forwardRef } from "react"
import { Plus, MessageSquare, FileText, Clock, MoreHorizontal, ChevronLeft, CheckCircle, XCircle, AlertTriangle, Archive } from "lucide-react"
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
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/ui/sidebar"
import { api, RecentRFXItem, useAPICall } from "@/lib/api"

interface RfxItem {
  id: string
  title: string
  client: string
  date: string
  status: "Draft" | "In progress" | "Completed" | "Cancelled" | "Expired"
}

interface AppSidebarProps {
  onNewRfx: () => void
  onNavigateToHistory: () => void
  onSelectRfx?: (rfxId: string) => void
  currentView?: "main" | "results" | "history"
}

export interface AppSidebarRef {
  refresh: () => Promise<void>
}

// Función utilitaria para obtener icono y color del estado en sidebar
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Draft':
      return <FileText className="h-3 w-3 text-gray-500 flex-shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden" />;
    case 'In progress':
      return <Clock className="h-3 w-3 text-blue-500 flex-shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden" />;
    case 'Completed':
      return <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden" />;
    case 'Cancelled':
      return <XCircle className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden" />;
    case 'Expired':
      return <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden" />;
    default:
      return <Clock className="h-3 w-3 text-gray-500 flex-shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden" />;
  }
}

const AppSidebar = forwardRef<AppSidebarRef, AppSidebarProps>(
  ({ onNewRfx, onNavigateToHistory, onSelectRfx, currentView }, ref) => {
    const { toggleSidebar } = useSidebar()
    const { handleAPIError } = useAPICall()
    
    const [recentRfx, setRecentRfx] = useState<RfxItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    
    // Expose refresh method to parent components
    useImperativeHandle(ref, () => ({
      refresh: async () => {
        await loadRecentRfx()
      }
    }))
    
    // Load recent RFX data from backend
    const loadRecentRfx = async () => {
      try {
        setIsLoading(true)
        const response = await api.getRecentRFX()
        
        // Transform backend data to frontend format using new consistent structure
        const transformedData: RfxItem[] = response.data.map((item: RecentRFXItem) => ({
          id: item.id,
          title: item.title, // Now available directly from backend
          client: item.client, // Now available directly from backend
          date: formatRelativeDate(item.date),
          status: item.status, // Now includes all status types: "Draft" | "In progress" | "Completed" | "Cancelled" | "Expired"
        }))
        
        setRecentRfx(transformedData)
      } catch (err) {
        console.error('Error loading recent RFX:', err)
        handleAPIError(err)
        
        // No fallback to mock data - show empty state or error
        setRecentRfx([])
      } finally {
        setIsLoading(false)
      }
    }

    useEffect(() => {
      loadRecentRfx()
    }, [])
    
    // Helper function to format relative dates
    const formatRelativeDate = (dateString: string) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return "Today"
      if (diffDays === 1) return "1 day ago"
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
      return `${Math.ceil(diffDays / 30)} months ago`
    }

    const handleRfxAction = (action: string, rfxId: string) => {
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
          console.log("Delete RFX:", rfxId)
          break
      }
    }

    const truncateText = (text: string, maxLength = 35) => {
      return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
    }

  return (
    <Sidebar collapsible="icon" className="border-r bg-gray-50/40">
      <SidebarHeader className="border-b border-gray-200/60 px-3 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-700" />
            <span className="font-medium text-gray-900 group-data-[collapsible=icon]:hidden">RFx Analyzer</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 group-data-[collapsible=icon]:hidden"
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
                  className="w-full bg-white text-gray-900 font-medium h-9 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow-md transition-all duration-200 ease-in-out border border-gray-200"
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
                  className="w-full justify-start text-gray-700 hover:bg-gray-100 h-8 rounded-md"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>RFX History</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent RFX */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-gray-500 mb-2 px-0">Recents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentRfx.map((rfx) => (
                <SidebarMenuItem key={rfx.id}>
                  <SidebarMenuButton
                    onClick={() => onSelectRfx?.(rfx.id)}
                    className="w-full justify-start h-auto py-2 px-2 text-left hover:bg-gray-100 rounded-md group"
                  >
                    <div className="flex items-start gap-2 w-full min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 truncate group-data-[collapsible=icon]:hidden">
                          {truncateText(rfx.title)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 group-data-[collapsible=icon]:hidden">
                          {rfx.client} • {rfx.date}
                        </div>
                      </div>
                      {getStatusIcon(rfx.status)}
                    </div>
                  </SidebarMenuButton>
                  <SidebarMenuAction className="group-data-[collapsible=icon]:hidden opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 cursor-pointer flex items-center justify-center rounded-sm hover:bg-gray-100">
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
                        <DropdownMenuItem onClick={() => handleRfxAction("delete", rfx.id)} className="text-red-600">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
})

AppSidebar.displayName = "AppSidebar"

export default AppSidebar
