"use client"

import { useState, useMemo, useEffect, useImperativeHandle, forwardRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, AlertCircle, RefreshCw, FileText, Clock, CheckCircle, Archive, XCircle, AlertTriangle, Trash2, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api, APIError, useAPICall, type RFXHistoryItem } from "@/lib/api"
import RFXDetailsDialog from "./RFXDetailsDialog"
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog"
import { ToastNotification, ToastType } from "./toast-notification"

// Enum para estados posibles de RFX en la base de datos
type RFXDatabaseStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled' | 'expired';

// Enum para estados mostrados en frontend
type RFXDisplayStatus = 'Draft' | 'In progress' | 'Completed' | 'Cancelled' | 'Expired';

interface HistoryItem {
  id: string
  title: string
  client: string
  fechaProcesamiento: string
  estado: RFXDisplayStatus
  databaseStatus: RFXDatabaseStatus // Estado original de la base de datos
  productos: string
  propuesta?: string
  lastActivity: string
  rfxId: string
  // Información de empresa opcional
  empresa?: {
    nombre_empresa?: string
    email_empresa?: string
    telefono_empresa?: string
  }
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

interface RfxHistoryProps {
  onNewRfx: () => void
  onNavigateToMain: () => void
  onSelectRfx?: (rfxId: string) => void
  onViewFullAnalysis?: (rfxId: string, rfxData: any) => void // Callback para ver análisis completo
}

export interface RfxHistoryRef {
  refresh: () => Promise<void>
}

// Función utilitaria para mapear estados de base de datos a estados de frontend
const mapDatabaseStatusToDisplay = (dbStatus: string): { displayStatus: RFXDisplayStatus; databaseStatus: RFXDatabaseStatus } => {
  const status = dbStatus.toLowerCase() as RFXDatabaseStatus;
  
  switch (status) {
    case 'draft':
      return { displayStatus: 'Draft', databaseStatus: 'draft' };
    case 'in_progress':
      return { displayStatus: 'In progress', databaseStatus: 'in_progress' };
    case 'completed':
      return { displayStatus: 'Completed', databaseStatus: 'completed' };
    case 'cancelled':
      return { displayStatus: 'Cancelled', databaseStatus: 'cancelled' };
    case 'expired':
      return { displayStatus: 'Expired', databaseStatus: 'expired' };
    default:
      // Fallback para valores no reconocidos
      return { displayStatus: 'In progress', databaseStatus: 'in_progress' };
  }
}

// Función utilitaria para obtener estilo y icono del badge según el estado
const getStatusBadgeProps = (status: RFXDisplayStatus) => {
  switch (status) {
    case 'Draft':
      return {
        variant: 'secondary' as const,
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
        icon: <FileText className="h-3 w-3 mr-1" />
      };
    case 'In progress':
      return {
        variant: 'secondary' as const,
        className: 'bg-primary/10 text-primary hover:bg-primary/10 font-medium',
        icon: <Clock className="h-3 w-3 mr-1" />
      };
    case 'Completed':
      return {
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 hover:bg-green-100',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      };
    case 'Cancelled':
      return {
        variant: 'secondary' as const,
        className: 'bg-red-100 text-red-800 hover:bg-red-100',
        icon: <XCircle className="h-3 w-3 mr-1" />
      };
    case 'Expired':
      return {
        variant: 'secondary' as const,
        className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
        icon: <AlertTriangle className="h-3 w-3 mr-1" />
      };
    default:
      return {
        variant: 'secondary' as const,
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
        icon: <Clock className="h-3 w-3 mr-1" />
      };
  }
}

const RfxHistory = forwardRef<RfxHistoryRef, RfxHistoryProps>(
  ({ onNewRfx, onNavigateToMain, onSelectRfx, onViewFullAnalysis }, ref) => {
    const PAGE_LIMIT = 10 // Optimized limit for new endpoints
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedRfx, setSelectedRfx] = useState<string | null>(null)
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
    const [currentOffset, setCurrentOffset] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    
    // Dialog state for RFX details
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedRfxForDialog, setSelectedRfxForDialog] = useState<string | null>(null)
    const [selectedRfxData, setSelectedRfxData] = useState<any>(null)
    
    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [rfxToDelete, setRfxToDelete] = useState<{ id: string; title: string } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    
    // Toast notification state
    const [toast, setToast] = useState<{
      isOpen: boolean
      type: ToastType
      title: string
      message?: string
    }>({
      isOpen: false,
      type: "success",
      title: "",
      message: "",
    })
    
    // Use the new API error handler
    const { handleAPIError } = useAPICall()

    // Expose refresh method to parent components
    useImperativeHandle(ref, () => ({
      refresh: async () => {
        await loadHistory()
      }
    }))

    // Load RFX history using optimized endpoints
    const loadHistory = async (offset: number = 0, append: boolean = false) => {
      try {
        if (append) {
          setIsLoadingMore(true)
        } else {
          setIsLoading(true)
        }
        setError(false)
        // Use optimized endpoints based on whether it's initial load or load more
        const response = offset === 0 
          ? await api.getLatestRFX(PAGE_LIMIT)
          : await api.loadMoreRFX(offset, PAGE_LIMIT)
        
        // Transform backend data to frontend format using new consistent structure
        const transformedData: HistoryItem[] = response.data.map((item: RFXHistoryItem) => {
          // Debug logging for processed_by field
          if (item.processed_by) {
            console.log(`🔍 RFX ${item.id}: processed_by =`, item.processed_by);
          }

          // Map database status to display status using our utility function
          const statusMapping = mapDatabaseStatusToDisplay(item.status || 'in_progress');
          
          // Resolve most recent timestamp for "Last activity"
          const mostRecentISO = item.updated_at || item.last_activity_at || item.last_updated || item.date;

          return {
            id: item.id, // ✅ Should be UUID from backend
            title: item.title, // Now available directly from backend
            client: item.client, // Now available directly from backend
            empresa: {}, // Initialize empty empresa object (not provided by API currently)
            fechaProcesamiento: item.date, // Now available directly from backend
            estado: statusMapping.displayStatus, // Use mapped display status
            databaseStatus: statusMapping.databaseStatus, // Store original DB status
            productos: `${item.numero_productos} productos`,
            lastActivity: formatRelativeDate(mostRecentISO),
            rfxId: item.rfxId, // ⚠️ Legacy field - may contain name instead of UUID
            processed_by: item.processed_by, // ✅ Include user who processed the RFX
          };
        })
        // Update pagination state using offset-based pagination
        setHasMore(Boolean(response.pagination?.has_more))
        setCurrentOffset(response.pagination?.next_offset || 0)

        // Append or replace
        setHistoryItems(prev => append ? [...prev, ...transformedData] : transformedData)
      } catch (err) {
        console.error('Error loading RFX history:', err)
        
        // Use enhanced error handling
        const errorInfo = handleAPIError(err)
        setError(true)
        
        // No fallback to mock data - show actual error
        setHistoryItems([])
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    }

    useEffect(() => {
      loadHistory(0, false) // Start with offset 0 for initial load
    }, [])
    
    // Helper function to format dates: Today, Yesterday, or DD/MM
    const formatRelativeDate = (dateString: string) => {
      const date = new Date(dateString)
      const now = new Date()
      
      // Reset time to compare only dates
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      const diffTime = nowOnly.getTime() - dateOnly.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return "Today"
      if (diffDays === 1) return "Yesterday"
      
      // Format as DD/MM for older dates
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      return `${day}/${month}`
    }
    
    const handleRefresh = async () => {
      setCurrentOffset(0) // Reset offset on refresh
      await loadHistory(0, false)
    }

    // Filter RFXs based on search query
    const filteredRfxs = useMemo(() => {
      if (!searchQuery.trim()) return historyItems

      const query = searchQuery.toLowerCase()
      return historyItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.client.toLowerCase().includes(query) ||
          item.productos.toLowerCase().includes(query) ||
          item.rfxId.toLowerCase().includes(query),
      )
    }, [searchQuery, historyItems])

    const handleRfxClick = (rfx: HistoryItem) => {
      setSelectedRfx(rfx.id)
      setSelectedRfxForDialog(rfx.id) // ✅ FIX: Use id (UUID) instead of rfxId (legacy name)
      setSelectedRfxData(rfx) // Pass the RFX data to the dialog
      setDialogOpen(true)
      
      if (onSelectRfx) {
        onSelectRfx(rfx.id)
      }
    }

    const handleCloseDialog = () => {
      setDialogOpen(false)
      setSelectedRfxForDialog(null)
      setSelectedRfxData(null)
    }

    const handleRetry = async () => {
      await handleRefresh()
    }

    const handleDeleteRFX = async (rfxId: string, rfxTitle: string, event: React.MouseEvent) => {
      // Prevent card click event from firing
      event.stopPropagation()
      
      // Open confirmation dialog
      setRfxToDelete({ id: rfxId, title: rfxTitle })
      setDeleteDialogOpen(true)
    }

    const confirmDeleteRFX = async () => {
      if (!rfxToDelete) return
      
      setIsDeleting(true)
      
      try {
        console.log(`🗑️ Deleting RFX: ${rfxToDelete.id}`)
        await api.deleteRFX(rfxToDelete.id)
        console.log(`✅ RFX deleted successfully`)
        
        // Invalidar cache del sidebar para que se actualice
        const SIDEBAR_CACHE_KEY = 'sidebar-recent-rfx'
        localStorage.removeItem(SIDEBAR_CACHE_KEY)
        console.log('🔄 Sidebar cache invalidated')
        
        // Remove from local state immediately
        setHistoryItems(prev => prev.filter(item => item.id !== rfxToDelete.id))
        
        // Close dialog
        setDeleteDialogOpen(false)
        setRfxToDelete(null)
        
        // Show success toast
        setToast({
          isOpen: true,
          type: "success",
          title: "RFX eliminado",
          message: `"${rfxToDelete.title}" ha sido eliminado exitosamente`,
        })
      } catch (error) {
        console.error(`❌ Error deleting RFX:`, error)
        
        // Close dialog
        setDeleteDialogOpen(false)
        
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
        
        // Show error toast
        setToast({
          isOpen: true,
          type: "error",
          title: errorTitle,
          message: errorMessage,
        })
      } finally {
        setIsDeleting(false)
        setRfxToDelete(null)
      }
    }

    const cancelDeleteRFX = () => {
      setDeleteDialogOpen(false)
      setRfxToDelete(null)
    }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Your RFX history</h1>
          <Button onClick={onNewRfx} className="gap-2 bg-gray-900 hover:bg-gray-800">
            <Plus className="h-4 w-4" />
            New RFX
          </Button>
        </div>

        <div className="mb-6">
          <Skeleton className="h-12 w-full rounded-full" />
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Your RFX history</h1>
          <Button onClick={onNewRfx} className="gap-2 bg-gray-900 hover:bg-gray-800">
            <Plus className="h-4 w-4" />
            New RFX
          </Button>
        </div>

        <Card className="border border-red-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error loading RFX history</h3>
            <p className="text-gray-600 mb-4 text-center">We couldn't load your RFX history. Please try again.</p>
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (historyItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Your RFX history</h1>
          <Button onClick={onNewRfx} className="gap-2 bg-gray-900 hover:bg-gray-800">
            <Plus className="h-4 w-4" />
            New RFX
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No RFX history yet</h3>
            <p className="text-gray-600 mb-6 text-center">
              Start by processing your first RFX document to see it appear here.
            </p>
            <Button onClick={onNewRfx} className="gap-2">
              <Plus className="h-4 w-4" />
              Process First RFX
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Your RFX History</h1>
          <p className="text-gray-600">Manage and review your processed documents</p>
        </div>
        <Button onClick={onNewRfx} className="gap-2 bg-brand-gradient hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-200 self-start sm:self-auto h-11 px-6 rounded-xl font-semibold">
          <Plus className="h-4 w-4" />
          New RFX
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by title, client, or products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-14 h-14 text-base border-gray-200 rounded-2xl bg-white shadow-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        />
      </div>

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-600">
          {historyItems.length} total RFX{historyItems.length !== 1 ? "s" : ""}{" "}
          {filteredRfxs.length !== historyItems.length && (
            <span className="text-primary">
              • {filteredRfxs.length} result{filteredRfxs.length !== 1 ? "s" : ""} found
            </span>
          )}
        </p>
      </div>

      {/* RFX List */}
      <div className="space-y-4">
        {filteredRfxs.length === 0 ? (
          <Card className="card-elevated-lg">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="bg-gray-100 p-4 rounded-2xl mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No RFXs found</h3>
              <p className="text-gray-600 text-center">
                Try adjusting your search terms or{" "}
                <button onClick={() => setSearchQuery("")} className="text-primary hover:text-primary-dark underline font-medium">
                  clear the search
                </button>
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRfxs.map((rfx) => (
            <Card
              key={rfx.id}
              className={`group border-2 transition-all duration-300 cursor-pointer hover-lift ${
                selectedRfx === rfx.id
                  ? "border-primary bg-primary/5 shadow-brand"
                  : "border-gray-200/60 hover:border-primary/30 hover:shadow-lg"
              }`}
              onClick={() => handleRfxClick(rfx)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-medium text-gray-900 truncate">{rfx.title}</h3>
                      {(() => {
                        const badgeProps = getStatusBadgeProps(rfx.estado);
                        return (
                          <Badge
                            variant={badgeProps.variant}
                            className={`flex-shrink-0 ${badgeProps.className}`}
                          >
                            {badgeProps.icon}
                            {rfx.estado}
                          </Badge>
                        );
                      })()}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">{rfx.client}</span> • {rfx.rfxId}
                      </p>
                      {rfx.empresa?.nombre_empresa && (
                        <p className="text-xs text-primary">
                          🏢 {rfx.empresa.nombre_empresa}
                          {rfx.empresa.email_empresa && (
                            <span className="text-gray-500 ml-2">• {rfx.empresa.email_empresa}</span>
                          )}
                        </p>
                      )}
                      {rfx.processed_by && (
                        <div className="text-xs text-green-600 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={rfx.processed_by.avatar_url} alt={rfx.processed_by.name || 'Usuario'} />
                              <AvatarFallback className="text-[10px] bg-green-100 text-green-700">
                                {(rfx.processed_by.name || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <User className="h-3 w-3" />
                          </div>
                          <span>Procesado por {rfx.processed_by.name || 'Usuario Desconocido'}</span>
                          {rfx.processed_by.username && (
                            <span className="text-gray-500">(@{rfx.processed_by.username})</span>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-gray-500 line-clamp-1">{rfx.productos}</p>
                      <p className="text-xs text-gray-400">
                        Last activity {rfx.lastActivity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteRFX(rfx.id, rfx.title, e)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      title="Eliminar RFX"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button 
            onClick={() => loadHistory(currentOffset, true)}
            variant="outline"
            className="gap-2"
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Cargando más RFX...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" /> Cargar más RFX
              </>
            )}
          </Button>
        </div>
      )}

      {/* Navigation Helper */}
      {filteredRfxs.length > 0 && (
        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Click on any RFX to view its detailed analysis and generated proposal.
          </p>
        </div>
      )}

      {/* RFX Details Dialog */}
      {selectedRfxForDialog && (
        <RFXDetailsDialog
          rfxId={selectedRfxForDialog}
          isOpen={dialogOpen}
          onClose={handleCloseDialog}
          rfxData={selectedRfxData}
          onViewFullAnalysis={onViewFullAnalysis} // 🆕 Pasar callback para ver análisis completo
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={cancelDeleteRFX}
        onConfirm={confirmDeleteRFX}
        title="Eliminar RFX"
        itemName={rfxToDelete?.title || ""}
        isDeleting={isDeleting}
      />

      {/* Toast Notification */}
      <ToastNotification
        isOpen={toast.isOpen}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
        type={toast.type}
        title={toast.title}
        message={toast.message}
      />
    </div>
  )
})

RfxHistory.displayName = "RfxHistory"

export default RfxHistory
