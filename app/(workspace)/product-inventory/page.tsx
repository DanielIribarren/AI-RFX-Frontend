"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Package, Upload, FileSpreadsheet, Plus, Search, Filter, Download, Trash2, Edit, AlertCircle, CheckCircle2, XCircle, Loader2, TrendingUp, DollarSign, Percent, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog"
import { catalogAPI, CatalogProduct, CatalogStats, ImportResult, CatalogAPIError } from "@/lib/api-catalog"

// ============================================
// TYPES
// ============================================

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  isOpen: boolean
  type: ToastType
  title: string
  message?: string
}

interface UploadState {
  isUploading: boolean
  progress: number
  fileName: string
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProductInventoryPage() {
  // Estado de productos
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [stats, setStats] = useState<CatalogStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const pageSize = 50
  
  // Estado de upload
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    fileName: ""
  })
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  
  // Toast notifications
  const [toast, setToast] = useState<Toast>({
    isOpen: false,
    type: "info",
    title: "",
    message: ""
  })
  
  // Delete confirmation dialogs
  const [deleteProductDialog, setDeleteProductDialog] = useState<{
    isOpen: boolean
    productId: string
    productName: string
  }>({
    isOpen: false,
    productId: "",
    productName: ""
  })
  const [clearCatalogDialog, setClearCatalogDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // ============================================
  // EFFECTS
  // ============================================

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset a página 1 al buscar
    }, 300)
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  // Cargar productos y stats al montar
  useEffect(() => {
    loadProducts()
    loadStats()
  }, [currentPage, debouncedSearch])

  // Auto-close toast
  useEffect(() => {
    if (toast.isOpen) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, isOpen: false }))
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [toast.isOpen])

  // ============================================
  // API CALLS
  // ============================================

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      const response = await catalogAPI.listProducts(
        currentPage,
        pageSize,
        debouncedSearch || undefined
      )
      
      setProducts(response.products)
      setTotalPages(response.total_pages)
      setTotalProducts(response.total)
    } catch (error) {
      console.error("Error loading products:", error)
      showToast("error", "Error", "No se pudieron cargar los productos")
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await catalogAPI.getStats()
      setStats(statsData)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadState({
      isUploading: true,
      progress: 0,
      fileName: file.name
    })
    setImportResult(null)

    try {
      const result = await catalogAPI.importCatalog(file, (progress) => {
        setUploadState(prev => ({ ...prev, progress }))
      })

      setImportResult(result)
      
      // Mostrar resultado
      if (result.status === "success") {
        showToast(
          "success",
          "Importación exitosa",
          `${result.products_imported} productos importados, ${result.products_updated} actualizados`
        )
        
        // Recargar productos y stats
        await loadProducts()
        await loadStats()
      } else {
        showToast(
          "error",
          "Error en importación",
          result.errors?.[0] || "Ocurrió un error durante la importación"
        )
      }
    } catch (error) {
      console.error("Upload error:", error)
      
      if (error instanceof CatalogAPIError) {
        showToast("error", "Error", error.message)
      } else {
        showToast("error", "Error", "No se pudo importar el archivo")
      }
    } finally {
      setUploadState({
        isUploading: false,
        progress: 0,
        fileName: ""
      })
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeleteProduct = (productId: string, productName: string) => {
    setDeleteProductDialog({
      isOpen: true,
      productId,
      productName
    })
  }

  const confirmDeleteProduct = async () => {
    setIsDeleting(true)
    
    try {
      await catalogAPI.deleteProduct(deleteProductDialog.productId, deleteProductDialog.productName)
      
      showToast("success", "Producto eliminado", `"${deleteProductDialog.productName}" ha sido eliminado`)
      
      // Cerrar dialog
      setDeleteProductDialog({ isOpen: false, productId: "", productName: "" })
      
      // Recargar productos
      await loadProducts()
      await loadStats()
    } catch (error) {
      console.error("Delete error:", error)
      
      if (error instanceof CatalogAPIError) {
        showToast("error", "Error", error.message)
      } else {
        showToast("error", "Error", "No se pudo eliminar el producto")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClearCatalog = () => {
    setClearCatalogDialog(true)
  }

  const confirmClearCatalog = async () => {
    setIsDeleting(true)
    
    try {
      const result = await catalogAPI.clearCatalog()
      
      showToast(
        "success", 
        "Inventario eliminado", 
        `${result.deleted_count} productos han sido eliminados`
      )
      
      // Cerrar dialog
      setClearCatalogDialog(false)
      
      // Recargar productos
      await loadProducts()
      await loadStats()
    } catch (error) {
      console.error("Clear catalog error:", error)
      
      if (error instanceof CatalogAPIError) {
        showToast("error", "Error", error.message)
      } else {
        showToast("error", "Error", "No se pudo eliminar el inventario")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  const showToast = (type: ToastType, title: string, message?: string) => {
    setToast({ isOpen: true, type, title, message })
  }

  const hasProducts = products.length > 0 || totalProducts > 0

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-brand-gradient p-2 rounded-lg shadow-sm">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Product Inventory</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your product catalog and pricing database
                </p>
              </div>
            </div>
            
            {hasProducts && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearCatalog}
                  className="text-destructive hover:text-destructive hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Catalog
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <label htmlFor="file-upload">
                  <Button size="sm" className="bg-brand-gradient text-white" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </span>
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadState.isUploading}
                  ref={fileInputRef}
                />
              </div>
            )}
          </div>
        </div>

        {/* Stats Dashboard */}
        {stats && hasProducts && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_products}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Price</p>
                    <p className="text-2xl font-bold text-gray-900">${stats.avg_price.toFixed(2)}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">With Cost Data</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.products_with_cost}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((stats.products_with_cost / stats.total_products) * 100).toFixed(0)}% complete
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Margin</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.avg_margin ? `${stats.avg_margin.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Percent className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Import Result Alert */}
        {importResult && (
          <Alert className="mb-6" variant={importResult.status === "success" ? "default" : "destructive"}>
            {importResult.status === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {importResult.status === "success" ? "Import Successful" : "Import Failed"}
            </AlertTitle>
            <AlertDescription>
              {importResult.status === "success" ? (
                <div className="space-y-1">
                  <p>✅ {importResult.products_imported} products imported</p>
                  <p>🔄 {importResult.products_updated} products updated</p>
                  {importResult.products_skipped > 0 && (
                    <p>⚠️ {importResult.products_skipped} products skipped</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Completed in {importResult.duration_seconds.toFixed(2)}s
                  </p>
                </div>
              ) : (
                <div>
                  {importResult.errors.map((error, index) => (
                    <p key={index}>• {error}</p>
                  ))}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!hasProducts && !isLoading && (
          <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-full mb-6">
                <Package className="h-16 w-16 text-primary" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Product Inventory Yet
              </h2>
              
              <p className="text-center text-muted-foreground mb-8 max-w-md">
                Upload your product database (Excel or CSV) to start managing your inventory. 
                Your products will be used to automatically match and price items in RFX requests.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <label htmlFor="file-upload-empty">
                  <Button size="lg" className="bg-brand-gradient text-white shadow-lg hover:shadow-xl" asChild>
                    <span>
                      <Upload className="h-5 w-5 mr-2" />
                      Upload Excel/CSV
                    </span>
                  </Button>
                </label>
                <input
                  id="file-upload-empty"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadState.isUploading}
                  ref={fileInputRef}
                />
                
                <Button variant="outline" size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Product Manually
                </Button>
              </div>

              {/* File Format Info */}
              <Card className="w-full max-w-2xl bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    Required File Format
                  </CardTitle>
                  <CardDescription>
                    Your Excel or CSV file should include the following columns:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Product Code</p>
                        <p className="text-xs text-muted-foreground">Unique identifier (SKU)</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Product Name</p>
                        <p className="text-xs text-muted-foreground">Description of the product</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Unit Cost</p>
                        <p className="text-xs text-muted-foreground">Purchase cost per unit</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        4
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Unit Price</p>
                        <p className="text-xs text-muted-foreground">Selling price per unit</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <span className="font-semibold">Note:</span> The profit margin will be calculated automatically 
                      based on cost and price.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Products Table */}
        {hasProducts && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by product name or code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Products Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Products ({totalProducts})</CardTitle>
                    <CardDescription>
                      {isLoading ? "Loading..." : `Showing ${products.length} of ${totalProducts} products`}
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50/50">
                            <TableHead className="font-semibold">Code</TableHead>
                            <TableHead className="font-semibold">Product Name</TableHead>
                            <TableHead className="font-semibold text-right">Unit Cost</TableHead>
                            <TableHead className="font-semibold text-right">Unit Price</TableHead>
                            <TableHead className="font-semibold text-right">Margin</TableHead>
                            <TableHead className="font-semibold text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No products found matching your search
                              </TableCell>
                            </TableRow>
                          ) : (
                            products.map((product) => (
                              <TableRow key={product.id} className="hover:bg-gray-50/50">
                                <TableCell className="font-mono text-sm">{product.product_code}</TableCell>
                                <TableCell className="font-medium">{product.product_name}</TableCell>
                                <TableCell className="text-right text-gray-600">
                                  ${product.unit_cost.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-gray-900">
                                  ${product.unit_price.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge 
                                    variant={(product.margin || 0) >= 30 ? "default" : (product.margin || 0) >= 15 ? "secondary" : "destructive"}
                                    className={
                                      (product.margin || 0) >= 30 
                                        ? "bg-green-100 text-green-700 hover:bg-green-100" 
                                        : (product.margin || 0) >= 15 
                                        ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                        : "bg-red-100 text-red-700 hover:bg-red-100"
                                    }
                                  >
                                    {(product.margin || 0).toFixed(1)}%
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => handleDeleteProduct(product.id, product.product_name)}
                                      >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || isLoading}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || isLoading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Toast Notification */}
        {toast.isOpen && (
          <div className="fixed top-4 right-4 z-50 w-96 animate-in slide-in-from-top-2">
            <Alert
              variant={toast.type === "error" ? "destructive" : "default"}
              className={toast.type === "success" ? "border-green-500 bg-green-50" : ""}
            >
              {toast.type === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {toast.type === "error" && <XCircle className="h-4 w-4" />}
              {toast.type === "warning" && <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{toast.title}</AlertTitle>
              {toast.message && <AlertDescription>{toast.message}</AlertDescription>}
            </Alert>
          </div>
        )}

        {/* Upload Progress Overlay */}
        {uploadState.isUploading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg font-semibold">Uploading {uploadState.fileName}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Processing your product inventory...
                  </p>
                </div>
                <Progress value={uploadState.progress} className="w-full" />
                <p className="text-xs text-center text-muted-foreground mt-2">
                  {uploadState.progress}%
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Product Dialog */}
        <DeleteConfirmationDialog
          isOpen={deleteProductDialog.isOpen}
          onClose={() => setDeleteProductDialog({ isOpen: false, productId: "", productName: "" })}
          onConfirm={confirmDeleteProduct}
          title="Eliminar Producto"
          itemName={deleteProductDialog.productName}
          isDeleting={isDeleting}
        />

        {/* Clear Catalog Dialog */}
        <DeleteConfirmationDialog
          isOpen={clearCatalogDialog}
          onClose={() => setClearCatalogDialog(false)}
          onConfirm={confirmClearCatalog}
          title="Eliminar Todo el Inventario"
          itemName={`todos los ${totalProducts} productos del catálogo`}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  )
}
