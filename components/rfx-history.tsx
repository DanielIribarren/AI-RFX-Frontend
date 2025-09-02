"use client"

import { useState, useMemo, useEffect, useImperativeHandle, forwardRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, AlertCircle, RefreshCw, FileText, Clock, CheckCircle, Archive, XCircle, AlertTriangle } from "lucide-react"
import { api, APIError, useAPICall, type RFXHistoryItem } from "@/lib/api"
import RFXDetailsDialog from "./RFXDetailsDialog"

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
}

interface RfxHistoryProps {
  onNewRfx: () => void
  onNavigateToMain: () => void
  onSelectRfx?: (rfxId: string) => void
  onViewFullAnalysis?: (rfxId: string, rfxData: any) => void // 🆕 Callback para ver análisis completo
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
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
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
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedRfx, setSelectedRfx] = useState<string | null>(null)
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
    
    // Dialog state for RFX details
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedRfxForDialog, setSelectedRfxForDialog] = useState<string | null>(null)
    const [selectedRfxData, setSelectedRfxData] = useState<any>(null)
    
    // Use the new API error handler
    const { handleAPIError } = useAPICall()

    // Expose refresh method to parent components
    useImperativeHandle(ref, () => ({
      refresh: async () => {
        await loadHistory()
      }
    }))

    // Load RFX history from backend
    const loadHistory = async () => {
      try {
        setIsLoading(true)
        setError(false)
        const response = await api.getRFXHistory()
        
        // Transform backend data to frontend format using new consistent structure
        const transformedData: HistoryItem[] = response.data.map((item: RFXHistoryItem) => {
          // 🔍 DEBUG: Log backend data to identify UUID vs name issue
          console.log('🔍 DEBUG Backend History Item:', {
            id: item.id,
            rfxId: item.rfxId,
            title: item.title,
            client: item.client,
            nombre_cliente: item.nombre_cliente,
            id_type: typeof item.id,
            rfxId_type: typeof item.rfxId
          })
          
          // Map database status to display status using our utility function
          const statusMapping = mapDatabaseStatusToDisplay(item.status || 'in_progress');
          
          return {
            id: item.id, // ✅ Should be UUID from backend
            title: item.title, // Now available directly from backend
            client: item.client, // Now available directly from backend
            empresa: {}, // Initialize empty empresa object (not provided by API currently)
            fechaProcesamiento: item.date, // Now available directly from backend
            estado: statusMapping.displayStatus, // Use mapped display status
            databaseStatus: statusMapping.databaseStatus, // Store original DB status
            productos: `${item.numero_productos} productos`,
            lastActivity: formatRelativeDate(item.date),
            rfxId: item.rfxId, // ⚠️ Legacy field - may contain name instead of UUID
          };
        })
        
        setHistoryItems(transformedData)
      } catch (err) {
        console.error('Error loading RFX history:', err)
        
        // Use enhanced error handling
        const errorInfo = handleAPIError(err)
        setError(true)
        
        // No fallback to mock data - show actual error
        setHistoryItems([])
      } finally {
        setIsLoading(false)
      }
    }

    useEffect(() => {
      loadHistory()
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
    
    const handleRefresh = async () => {
      await loadHistory()
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
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Your RFX history</h1>
        <Button onClick={onNewRfx} className="gap-2 bg-gray-900 hover:bg-gray-800 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          New RFX
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search your RFXs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-12 text-base border-gray-300 rounded-full bg-gray-50 focus:bg-white focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          You have {historyItems.length} processed RFX{historyItems.length !== 1 ? "s" : ""}{" "}
          {filteredRfxs.length !== historyItems.length && (
            <span>
              • Showing {filteredRfxs.length} result{filteredRfxs.length !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>

      {/* RFX List */}
      <div className="space-y-3">
        {filteredRfxs.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Search className="h-8 w-8 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium mb-2">No RFXs found</h3>
              <p className="text-gray-600 text-center">
                Try adjusting your search terms or{" "}
                <button onClick={() => setSearchQuery("")} className="text-blue-600 hover:text-blue-800 underline">
                  clear the search
                </button>
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRfxs.map((rfx) => (
            <Card
              key={rfx.id}
              className={`border transition-all duration-200 cursor-pointer hover:shadow-md hover:border-gray-300 ${
                selectedRfx === rfx.id
                  ? "border-blue-500 bg-blue-50/50 shadow-sm"
                  : "border-gray-200 hover:bg-gray-50/50"
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
                        <p className="text-xs text-blue-600">
                          🏢 {rfx.empresa.nombre_empresa}
                          {rfx.empresa.email_empresa && (
                            <span className="text-gray-500 ml-2">• {rfx.empresa.email_empresa}</span>
                          )}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 line-clamp-1">{rfx.productos}</p>
                      <p className="text-xs text-gray-400">
                        Last activity {rfx.lastActivity}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Navigation Helper */}
      {filteredRfxs.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
    </div>
  )
})

RfxHistory.displayName = "RfxHistory"

export default RfxHistory
