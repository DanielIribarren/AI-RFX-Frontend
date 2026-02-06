/**
 * Catalog API Client
 * 
 * Maneja todas las operaciones del catálogo de productos con:
 * - Retry logic para requests fallidos
 * - Manejo robusto de errores
 * - Tipos TypeScript completos
 * - Feedback en tiempo real
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

// ============================================
// AUTH HELPER
// ============================================

/**
 * Helper para hacer fetch con JWT token automático
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}

// ============================================
// TYPES
// ============================================

export interface CatalogProduct {
  id: string
  product_name: string
  product_code: string
  unit_cost: number
  unit_price: number
  unit: string
  margin?: number
  created_at: string
  updated_at: string
}

export interface ImportResult {
  status: "success" | "error"
  products_imported: number
  products_updated: number
  products_skipped: number
  errors: string[]
  warnings: string[]
  duration_seconds: number
  preview?: CatalogProduct[]
}

export interface ProductsListResponse {
  products: CatalogProduct[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface CatalogStats {
  total_products: number
  products_with_cost: number
  products_with_price: number
  avg_price: number
  avg_margin?: number
  cache_status: string
  semantic_search_available: boolean
}

export interface SearchResult {
  product_name: string
  product_code?: string
  unit_cost: number
  unit_price: number
  match_type: "exact" | "fuzzy" | "semantic"
  confidence: number
}

// ============================================
// ERROR HANDLING
// ============================================

export class CatalogAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: any
  ) {
    super(message)
    this.name = "CatalogAPIError"
  }
}

// ============================================
// CATALOG API CLIENT
// ============================================

export class CatalogAPIClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * 📤 Importar catálogo desde Excel/CSV
   * 
   * @param file - Archivo Excel o CSV
   * @param onProgress - Callback para mostrar progreso (opcional)
   * @returns Resultado de la importación
   */
  async importCatalog(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ImportResult> {
    try {
      // Validar archivo antes de enviar
      const validExtensions = [".xlsx", ".xls", ".csv"]
      const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf("."))
      
      if (!validExtensions.includes(fileExt)) {
        throw new CatalogAPIError(
          `Invalid file type. Allowed: ${validExtensions.join(", ")}`,
          400
        )
      }

      // Validar tamaño (max 10MB)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        throw new CatalogAPIError(
          `File too large. Maximum size: 10MB`,
          400
        )
      }

      console.log(`📤 Uploading catalog: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)

      const formData = new FormData()
      formData.append("file", file)

      // Simular progreso inicial
      onProgress?.(10)

      const response = await fetchWithAuth(`${this.baseUrl}/api/catalog/import`, {
        method: "POST",
        body: formData,
      })

      onProgress?.(90)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Upload failed" }))
        throw new CatalogAPIError(
          error.message || "Failed to import catalog",
          response.status,
          error
        )
      }

      const result: ImportResult = await response.json()
      
      onProgress?.(100)

      console.log(`✅ Import completed:`, {
        imported: result.products_imported,
        updated: result.products_updated,
        skipped: result.products_skipped,
        duration: `${result.duration_seconds}s`,
      })

      return result

    } catch (error) {
      console.error("❌ Import failed:", error)
      
      if (error instanceof CatalogAPIError) {
        throw error
      }
      
      throw new CatalogAPIError(
        error instanceof Error ? error.message : "Unknown error during import",
        500
      )
    }
  }

  /**
   * 📋 Listar productos con paginación y búsqueda
   * 
   * @param page - Número de página (default 1)
   * @param pageSize - Items por página (default 50)
   * @param search - Término de búsqueda (opcional)
   * @returns Lista de productos paginada
   */
  async listProducts(
    page: number = 1,
    pageSize: number = 50,
    search?: string
  ): Promise<ProductsListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      })

      if (search && search.trim()) {
        params.append("search", search.trim())
      }

      console.log(`📋 Fetching products: page=${page}, size=${pageSize}, search="${search || ""}"`)

      const response = await fetchWithAuth(
        `${this.baseUrl}/api/catalog/products?${params.toString()}`
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to fetch products" }))
        throw new CatalogAPIError(
          error.message || "Failed to fetch products",
          response.status
        )
      }

      const data: ProductsListResponse = await response.json()

      // Calcular margen de ganancia para cada producto
      data.products = data.products.map(product => ({
        ...product,
        margin: product.unit_price > 0 
          ? ((product.unit_price - product.unit_cost) / product.unit_price) * 100
          : 0
      }))

      console.log(`✅ Fetched ${data.products.length} products (total: ${data.total})`)

      return data

    } catch (error) {
      console.error("❌ List products failed:", error)
      
      if (error instanceof CatalogAPIError) {
        throw error
      }
      
      throw new CatalogAPIError(
        error instanceof Error ? error.message : "Unknown error fetching products",
        500
      )
    }
  }

  /**
   * 🔍 Buscar un producto específico (semantic search)
   * 
   * @param query - Nombre del producto a buscar
   * @returns Producto encontrado o null
   */
  async searchProduct(query: string): Promise<SearchResult | null> {
    try {
      if (!query.trim()) {
        throw new CatalogAPIError("Search query cannot be empty", 400)
      }

      console.log(`🔍 Searching product: "${query}"`)

      const params = new URLSearchParams({ query: query.trim() })
      const response = await fetchWithAuth(
        `${this.baseUrl}/api/catalog/search?${params.toString()}`
      )

      if (response.status === 404) {
        console.log(`⚠️ No product found for: "${query}"`)
        return null
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Search failed" }))
        throw new CatalogAPIError(
          error.message || "Search failed",
          response.status
        )
      }

      const result: SearchResult = await response.json()
      
      console.log(`✅ Found product: ${result.product_name} (confidence: ${result.confidence})`)

      return result

    } catch (error) {
      console.error("❌ Search failed:", error)
      
      if (error instanceof CatalogAPIError) {
        throw error
      }
      
      throw new CatalogAPIError(
        error instanceof Error ? error.message : "Unknown error during search",
        500
      )
    }
  }

  /**
   * ✏️ Actualizar un producto
   * 
   * @param productId - ID del producto
   * @param updates - Campos a actualizar
   * @returns Producto actualizado
   */
  async updateProduct(
    productId: string,
    updates: Partial<Omit<CatalogProduct, "id" | "created_at" | "updated_at">>
  ): Promise<CatalogProduct> {
    try {
      console.log(`✏️ Updating product ${productId}:`, updates)

      const response = await fetchWithAuth(
        `${this.baseUrl}/api/catalog/products/${productId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Update failed" }))
        throw new CatalogAPIError(
          error.message || "Failed to update product",
          response.status
        )
      }

      const result = await response.json()
      
      console.log(`✅ Product updated successfully`)

      return result.product

    } catch (error) {
      console.error("❌ Update failed:", error)
      
      if (error instanceof CatalogAPIError) {
        throw error
      }
      
      throw new CatalogAPIError(
        error instanceof Error ? error.message : "Unknown error updating product",
        500
      )
    }
  }

  /**
   * 🗑️ Eliminar un producto (soft delete)
   * 
   * @param productId - ID del producto
   * @param productName - Nombre del producto (para logging)
   * @returns Mensaje de confirmación
   */
  async deleteProduct(productId: string, productName?: string): Promise<{ message: string }> {
    try {
      console.log(`🗑️ Deleting product ${productId}: ${productName || ""}`)

      const response = await fetchWithAuth(
        `${this.baseUrl}/api/catalog/products/${productId}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Delete failed" }))
        throw new CatalogAPIError(
          error.message || "Failed to delete product",
          response.status
        )
      }

      const result = await response.json()
      
      console.log(`✅ Product deleted successfully`)

      return { message: result.message }

    } catch (error) {
      console.error("❌ Delete failed:", error)
      
      if (error instanceof CatalogAPIError) {
        throw error
      }
      
      throw new CatalogAPIError(
        error instanceof Error ? error.message : "Unknown error deleting product",
        500
      )
    }
  }

  /**
   * �️ Eliminar todo el inventario (clear catalog)
   * 
   * @returns Número de productos eliminados
   */
  async clearCatalog(): Promise<{ deleted_count: number; message: string }> {
    try {
      console.log(`🗑️ Clearing entire catalog...`)

      const response = await fetchWithAuth(
        `${this.baseUrl}/api/catalog/clear`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Clear catalog failed" }))
        throw new CatalogAPIError(
          error.message || "Failed to clear catalog",
          response.status
        )
      }

      const result = await response.json()
      
      console.log(`✅ Catalog cleared successfully: ${result.deleted_count} products deleted`)

      return result

    } catch (error) {
      console.error("❌ Clear catalog failed:", error)
      
      if (error instanceof CatalogAPIError) {
        throw error
      }
      
      throw new CatalogAPIError(
        error instanceof Error ? error.message : "Unknown error clearing catalog",
        500
      )
    }
  }

  /**
   * �📊 Obtener estadísticas del catálogo
   * 
   * @returns Estadísticas del catálogo
   */
  async getStats(): Promise<CatalogStats> {
    try {
      console.log(`📊 Fetching catalog stats`)

      const response = await fetchWithAuth(`${this.baseUrl}/api/catalog/stats`)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to fetch stats" }))
        throw new CatalogAPIError(
          error.message || "Failed to fetch stats",
          response.status
        )
      }

      const stats: CatalogStats = await response.json()
      
      console.log(`✅ Stats fetched:`, stats)

      return stats

    } catch (error) {
      console.error("❌ Get stats failed:", error)
      
      if (error instanceof CatalogAPIError) {
        throw error
      }
      
      throw new CatalogAPIError(
        error instanceof Error ? error.message : "Unknown error fetching stats",
        500
      )
    }
  }

  /**
   * 🔄 Buscar múltiples productos (batch search)
   * WORKAROUND: Backend no tiene endpoint batch, hacemos múltiples requests
   * 
   * @param queries - Array de nombres de productos
   * @param onProgress - Callback para progreso
   * @returns Array de resultados
   */
  async searchProductsBatch(
    queries: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Array<{ query: string; result: SearchResult | null }>> {
    try {
      console.log(`🔄 Batch search for ${queries.length} products`)

      const results: Array<{ query: string; result: SearchResult | null }> = []

      for (let i = 0; i < queries.length; i++) {
        const query = queries[i]
        onProgress?.(i + 1, queries.length)

        try {
          const result = await this.searchProduct(query)
          results.push({ query, result })
        } catch (error) {
          console.warn(`⚠️ Failed to search "${query}":`, error)
          results.push({ query, result: null })
        }

        // Rate limiting: esperar 100ms entre requests
        if (i < queries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      console.log(`✅ Batch search completed: ${results.filter(r => r.result).length}/${queries.length} found`)

      return results

    } catch (error) {
      console.error("❌ Batch search failed:", error)
      throw new CatalogAPIError(
        error instanceof Error ? error.message : "Unknown error during batch search",
        500
      )
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const catalogAPI = new CatalogAPIClient()
