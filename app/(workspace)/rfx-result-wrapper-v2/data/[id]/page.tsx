"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { RFXResponse } from "@/lib/api";
import RFXDataView from "@/components/features/rfx/RFXDataView";
import { useRFXCurrency } from "@/contexts/RFXCurrencyContext";
import RFXUpdateChatPanel from "@/components/features/rfx/update-chat/RFXUpdateChatPanel";

interface ProductoIndividual {
  id: string;
  nombre: string;
  cantidad: number;
  cantidadOriginal: number;
  cantidadEditada: number;
  unidad: string;
  precio: number;
  isQuantityModified: boolean;
  // Nuevos campos de ganancias
  costo_unitario?: number;
  ganancia_unitaria?: number;
  margen_ganancia?: number;
  total_profit?: number;
}

export default function RfxDataPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [backendData, setBackendData] = useState<RFXResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productosIndividuales, setProductosIndividuales] = useState<ProductoIndividual[]>([]);
  const [isSavingCosts, setIsSavingCosts] = useState(false);
  const [costsSaved, setCostsSaved] = useState(false);
  const [extractedData, setExtractedData] = useState<any>({});
  
  // Chat panel state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // RFX Currency context
  const rfxCurrency = useRFXCurrency();
  const { 
    selectedCurrency, 
    formatPriceWithSymbol,
    getCurrencyInfo
  } = rfxCurrency;

  const currencyInfo = getCurrencyInfo();

  // Extract individual products from backend data
  const extractIndividualProducts = (data: any): ProductoIndividual[] => {
    if (!data) return [];

    const products = data.products || data.productos || data.requested_products || [];

    return products.map((product: any, index: number) => {
      let originalQuantity = 1;

      if (product.quantity !== undefined && product.quantity !== null) {
        originalQuantity = parseInt(String(product.quantity)) || 1;
      } else if (product.cantidad !== undefined && product.cantidad !== null) {
        originalQuantity = parseInt(String(product.cantidad)) || 1;
      } else if (product.qty !== undefined && product.qty !== null) {
        originalQuantity = parseInt(String(product.qty)) || 1;
      }

      const productName = product.product_name || product.nombre || product.name || `Producto ${index + 1}`;
      const productUnit = product.unit || product.unidad || product.measurement_unit || 'unidades';
      const productPrice = parseFloat(String(product.precio_unitario || product.estimated_unit_price || product.unit_price || product.price || 0)) || 0;

      // Extraer nuevos campos de ganancias con nombres correctos del backend
      const costoUnitario = parseFloat(String(product.unit_cost || product.costo_unitario || 0)) || 0;
      const gananciaUnitaria = parseFloat(String(product.unit_profit || product.ganancia_unitaria || 0)) || 0;
      const margenGanancia = parseFloat(String(product.unit_margin || product.margen_ganancia || 0)) || 0;
      const totalProfit = parseFloat(String(product.total_profit || 0)) || 0;

      return {
        id: product.id || `product-${index}`,
        nombre: productName,
        cantidad: originalQuantity,
        cantidadOriginal: originalQuantity,
        cantidadEditada: originalQuantity,
        unidad: productUnit,
        precio: productPrice,
        isQuantityModified: false,
        // Nuevos campos de ganancias con nombres correctos
        costo_unitario: costoUnitario,
        ganancia_unitaria: gananciaUnitaria,
        margen_ganancia: margenGanancia,
        total_profit: totalProfit
      };
    });
  };

  // Handle product price change
  const handleProductPriceChange = async (productId: string, newPrice: number) => {
    try {
      setProductosIndividuales(prev =>
        prev.map(product =>
          product.id === productId
            ? { ...product, precio: newPrice }
            : product
        )
      );

      if (backendData?.data?.id) {
        console.log(`🔄 Saving product price: ${productId} = ${newPrice}`);
        await api.updateProductField(backendData.data.id, productId, "precio_unitario", newPrice);
        console.log(`✅ Product price saved to backend: ${productId}`);
      }
    } catch (error) {
      console.error(`❌ Error saving product price:`, error);
      // Revert change on error
      setProductosIndividuales(prev =>
        prev.map(product =>
          product.id === productId
            ? { ...product, precio: product.precio }
            : product
        )
      );
    }
  };

  // Function to refresh RFX data after updates
  const refreshRFXData = async () => {
    if (!backendData?.data?.id) {
      console.warn("No RFX ID to refresh");
      return;
    }

    try {
      console.log("🔄 Refreshing RFX data:", backendData.data.id);

      // Get complete updated RFX data (includes all fields + products)
      const rfxResponse = await api.getRFXById(backendData.data.id);
      const productsResponse = await api.getProductsWithProfits(backendData.data.id);

      if (rfxResponse.status === "success" && rfxResponse.data) {
        // Combine RFX data with complete products data
        const updatedData = {
          ...rfxResponse.data,
          products: productsResponse.data?.products || productsResponse.data || rfxResponse.data.products
        };

        setBackendData({ ...rfxResponse, data: updatedData });

        // Extract updated individual products
        const updatedProducts = extractIndividualProducts(updatedData);
        setProductosIndividuales(updatedProducts);

        // Update extracted data fields (fecha, lugar, cliente, etc.)
        setExtractedData({
          solicitante: updatedData.requester_name || (updatedData as any)?.nombre_solicitante || "",
          email: updatedData.email || "",
          productos: updatedData.products?.map((p: any) => 
            `${p.product_name || p.nombre} (${p.quantity || p.cantidad} ${p.unit || p.unidad})`
          ).join(', ') || "",
          fechaEntrega: updatedData.delivery_date || (updatedData as any)?.fecha || "",
          lugarEntrega: updatedData.location || (updatedData as any)?.lugar || "",
          nombreEmpresa: updatedData.company_name || (updatedData as any)?.nombre_empresa || "",
          emailEmpresa: (updatedData as any)?.email_empresa || "",
          telefonoEmpresa: (updatedData as any)?.telefono_empresa || "",
          telefonoSolicitante: (updatedData as any)?.telefono_solicitante || "",
          cargoSolicitante: (updatedData as any)?.cargo_solicitante || "",
          requirements: (updatedData as any)?.requirements || "",
          requirementsConfidence: (updatedData as any)?.requirements_confidence || 0.0
        });

        console.log("✅ RFX data refreshed successfully (products + extracted fields)");
      } else {
        console.warn("Could not refresh RFX data");
      }
    } catch (error) {
      console.error("Error refreshing RFX data:", error);
    }
  };

  // Handle product cost change
  const handleProductCostChange = async (productId: string, newCost: number) => {
    // Guardar el valor anterior para revertir en caso de error
    let previousCost = 0;

    try {
      setProductosIndividuales(prev => {
        const product = prev.find(p => p.id === productId);
        if (product) {
          previousCost = product.costo_unitario || 0;
        }
        return prev.map(product =>
          product.id === productId
            ? { ...product, costo_unitario: newCost }
            : product
        );
      });

      if (backendData?.data?.id) {
        console.log(`🔄 Saving product cost: ${productId} = ${newCost} (was: ${previousCost})`);
        const result = await api.updateProductField(backendData.data.id, productId, "unit_cost", newCost);
        console.log(`✅ Product cost saved to backend:`, result);

        // Refresh data to get updated profit calculations
        await refreshRFXData();
      }
    } catch (error) {
      console.error(`❌ Error saving product cost:`, error);
      // Revertir cambio local si falla el backend
      setProductosIndividuales(prev =>
        prev.map(product =>
          product.id === productId
            ? { ...product, costo_unitario: previousCost }
            : product
        )
      );
      throw error; // Re-lanzar el error para que se maneje en el componente
    }
  };

  // Handle field save for extracted data
  const handleFieldSave = async (field: string, value: string | number) => {
    try {
      // Actualizar estado local inmediatamente para feedback instantáneo
      setExtractedData((prev: any) => ({ ...prev, [field]: value }));

      if (!backendData?.data?.id) return;

      let normalizedValue: string | number = value;
      if (field === "fechaEntrega" && typeof value === "string") {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          normalizedValue = `${yyyy}-${mm}-${dd}`;
        }
      }

      await api.updateRFXField(backendData.data.id, field, String(normalizedValue));
      console.log(`✅ Field ${field} persisted to backend:`, normalizedValue);
    } catch (error) {
      console.error(`Error saving field ${field}:`, error);
      // Revertir el cambio local si falla el guardado en backend
      if (backendData?.data) {
        setExtractedData((prev: any) => ({ ...prev, [field]: prev[field] }));
      }
      alert(`Error al guardar el campo ${field}.`);
    }
  };

  // Handle RFX title save
  const handleTitleSave = async (newTitle: string) => {
    if (!backendData?.data?.id) {
      throw new Error("No RFX ID available");
    }

    try {
      await api.updateRFXTitle(backendData.data.id, newTitle);
      
      // Update local state
      setBackendData(prev => {
        if (!prev?.data) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            title: newTitle
          }
        } as RFXResponse;
      });
      
      console.log(`✅ RFX title updated: "${newTitle}"`);
    } catch (error) {
      console.error("Error saving RFX title:", error);
      throw error; // Re-throw to let EditableTitle handle it
    }
  };

  // Handle quantity change
  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    try {
      setProductosIndividuales(prev => 
        prev.map(product => {
          if (product.id === productId) {
            return { 
              ...product, 
              cantidadEditada: newQuantity,
              isQuantityModified: newQuantity !== product.cantidadOriginal
            };
          }
          return product;
        })
      );

      if (backendData?.data?.id) {
        console.log(`🔄 Saving product quantity: ${productId} = ${newQuantity}`);
        await api.updateProductField(backendData.data.id, productId, "cantidad", newQuantity);
        console.log(`✅ Product quantity saved to backend: ${productId}`);
      }
    } catch (error) {
      console.error(`❌ Error saving product quantity:`, error);
      // Revert change on error
      setProductosIndividuales(prev => 
        prev.map(product => 
          product.id === productId 
            ? { 
                ...product, 
                cantidadEditada: product.cantidadOriginal,
                isQuantityModified: false
              }
            : product
        )
      );
    }
  };

  // Handle unit change
  const handleUnitChange = async (productId: string, newUnit: string) => {
    try {
      const trimmed = (newUnit || '').trim();
      if (!trimmed) return;

      setProductosIndividuales(prev => 
        prev.map(product => 
          product.id === productId 
            ? { ...product, unidad: trimmed }
            : product
        )
      );

      if (backendData?.data?.id) {
        console.log(`🔄 Saving product unit: ${productId} = ${trimmed}`);
        await api.updateProductField(backendData.data.id, productId, "unidad", trimmed);
        console.log(`✅ Product unit saved to backend: ${productId}`);
      }
    } catch (error) {
      console.error(`❌ Error saving product unit:`, error);
      // Revert change on error
      setProductosIndividuales(prev => 
        prev.map(product => 
          product.id === productId 
            ? { ...product, unidad: product.unidad }
            : product
        )
      );
    }
  };

  // Handle currency change using RFX context
  const handleCurrencyChange = async (newCurrency: string) => {
    try {
      await rfxCurrency.updateCurrency(newCurrency);
    } catch (error) {
      alert(`Error al actualizar la moneda. Por favor, intente nuevamente.`);
    }
  };

  // Add product handler
  const handleAddProduct = async (productData: {
    nombre: string;
    categoria?: string;
    cantidad: number;
    unidad: string;
    precio: number;
    descripcion?: string;
  }) => {
    if (!backendData?.data?.id) {
      alert("Error: No hay datos del RFX disponibles");
      return;
    }

    try {
      console.log("🔄 Adding product:", productData);
      const result = await api.addProduct(backendData.data.id, productData);
      console.log("✅ Product added successfully:", result);

      // Add product to local state
      const newProduct: ProductoIndividual = {
        id: result.data.product.id || `product-${Date.now()}`,
        nombre: productData.nombre,
        cantidad: productData.cantidad,
        cantidadOriginal: productData.cantidad,
        cantidadEditada: productData.cantidad,
        unidad: productData.unidad,
        precio: productData.precio,
        isQuantityModified: false,
        // Nuevos campos de ganancias (inicialmente 0)
        costo_unitario: 0,
        ganancia_unitaria: 0,
        margen_ganancia: 0,
        total_profit: 0
      };

      setProductosIndividuales(prev => [...prev, newProduct]);
      
    } catch (error) {
      console.error("Error adding product:", error);
      alert("❌ No se pudo agregar el producto. Por favor, intente nuevamente.");
      throw error;
    }
  };

  // Delete product handler
  const handleDeleteProduct = async (productId: string) => {
    if (!backendData?.data?.id) {
      console.error("❌ Cannot delete product: No RFX data available");
      alert("Error: No hay datos del RFX disponibles");
      return;
    }

    // Find product name for logging
    const product = productosIndividuales.find(p => p.id === productId);
    const productName = product?.nombre || "producto";

    try {
      console.log("🔄 Deleting product:", productId, productName);
      
      // Call API to delete product
      await api.deleteProduct(backendData.data.id, productId);
      console.log("✅ Product deleted successfully from backend");

      // Remove product from local state
      setProductosIndividuales(prev => prev.filter(p => p.id !== productId));
      console.log("✅ Product removed from local state");
      
    } catch (error: any) {
      console.error("❌ Error deleting product:", error);
      
      // More detailed error message
      let errorMessage = "No se pudo eliminar el producto.";
      if (error?.message) {
        errorMessage += ` Detalle: ${error.message}`;
      }
      if (error?.code === 'NETWORK_ERROR') {
        errorMessage += " Verifica tu conexión a internet.";
      }
      
      alert(`❌ ${errorMessage}`);
    }
  };

  // Save all product costs
  const saveProductCosts = async () => {
    if (!backendData?.data?.id) {
      alert("Error: No hay datos del RFX disponibles para guardar costos");
      return;
    }

    setIsSavingCosts(true);
    const rfxId = backendData.data.id;
    const productCosts = productosIndividuales.map(producto => ({
      product_id: producto.id,
      unit_price: producto.precio
    }));

    try {
      console.log("🔄 Saving product costs:", productCosts);
      const result = await api.updateProductCosts(rfxId, productCosts);
      console.log("✅ Product costs saved successfully:", result);
      
      setCostsSaved(true);
      const total = productosIndividuales.reduce((sum, p) => sum + (p.cantidadEditada * p.precio), 0);
      alert(`✅ Costos guardados exitosamente para ${result.data.updated_products.length} productos (Total: €${total.toFixed(2)})`);
      
    } catch (error) {
      console.error("Error saving product costs:", error);
      alert("❌ No se pudo guardar los costos de los productos. Por favor, intente nuevamente.");
    } finally {
      setIsSavingCosts(false);
    }
  };

  // Handle chat updates
  const handleChatUpdate = async (changes: any[]) => {
    console.log("🔄 Applying chat changes:", changes);
    
    // Refresh RFX data after changes
    await refreshRFXData();
  };

  useEffect(() => {
    let isMounted = true;

    const loadRfxData = async () => {
      if (!id) {
        setError("ID de RFX no válido");
        setIsLoading(false);
        return;
      }

      // ✅ Verificar autenticación antes de hacer peticiones
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        console.warn('⚠️ No access token found, redirecting to login');
        router.push('/login');
        setIsLoading(false);
        return;
      }

      try {
        console.log("🔍 Loading RFX data for ID:", id);
        const response = await api.getRFXById(id);

        if (isMounted) {
          if (response.status === "success" && response.data) {
            // Get complete product data with profits and costs from backend
            console.log("📊 Fetching complete products data with profits from /api/rfx/{id}/products");
            const productsResponse = await api.getProductsWithProfits(id);

            let completeData = response.data;

            if (productsResponse.status === "success" && productsResponse.data) {
              // Combine RFX data with complete products data including costs and profits
              completeData = {
                ...response.data,
                products: productsResponse.data.products || productsResponse.data
              };
              console.log("✅ Combined RFX data with complete products data:", {
                rfxId: completeData.id,
                productsCount: completeData.products?.length || 0,
                sampleProduct: completeData.products?.[0] ? {
                  id: (completeData.products[0] as any).id,
                  unit_cost: (completeData.products[0] as any).unit_cost,
                  unit_profit: (completeData.products[0] as any).unit_profit,
                  unit_margin: (completeData.products[0] as any).unit_margin
                } : null
              });
            } else {
              console.warn("⚠️ Could not fetch complete products data, using basic RFX products");
            }

            setBackendData({ ...response, data: completeData });

            // Initialize RFX context with currency
            const backendCurrency = (completeData as any)?.currency;
            await rfxCurrency.setRfxContext(completeData.id, backendCurrency);

            // Extract individual products with complete data including costs
            const individualProducts = extractIndividualProducts(completeData);
            setProductosIndividuales(individualProducts);

            // Check if products already have valid prices
            const hasValidPrices = individualProducts.every(p => p.precio && p.precio > 0);
            setCostsSaved(hasValidPrices);

            setError(null);
            console.log("✅ RFX data loaded successfully with complete products:", completeData);
          } else {
            setError(response.message || "Error al cargar datos del RFX");
            console.error("❌ Error loading RFX data:", response.message);
          }
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : "Error desconocido";
          setError(errorMessage);
          console.error("❌ Error fetching RFX data:", err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRfxData();

    return () => {
      isMounted = false;
      // Clean up RFX context when component unmounts
      rfxCurrency.clearRfxContext();
    };
  }, [id]);

  // Initialize extractedData from backendData when it loads
  useEffect(() => {
    if (backendData?.data) {
      setExtractedData({
        solicitante: backendData.data?.requester_name || (backendData.data as any)?.nombre_solicitante || "",
        email: backendData.data?.email || "",
        productos: backendData.data?.products?.map((p: any) => 
          `${p.product_name || p.nombre} (${p.quantity || p.cantidad} ${p.unit || p.unidad})`
        ).join(', ') || "",
        fechaEntrega: backendData.data?.delivery_date || (backendData.data as any)?.fecha || "",
        lugarEntrega: backendData.data?.location || (backendData.data as any)?.lugar || "",
        nombreEmpresa: backendData.data?.company_name || (backendData.data as any)?.nombre_empresa || "",
        emailEmpresa: (backendData.data as any)?.email_empresa || "",
        telefonoEmpresa: (backendData.data as any)?.telefono_empresa || "",
        telefonoSolicitante: (backendData.data as any)?.telefono_solicitante || "",
        cargoSolicitante: (backendData.data as any)?.cargo_solicitante || "",
        requirements: (backendData.data as any)?.requirements || "",
        requirementsConfidence: (backendData.data as any)?.requirements_confidence || 0.0
      });
    }
  }, [backendData]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12 bg-background rounded-lg border border">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Cargando datos del RFX...
          </h2>
          <p className="text-muted-foreground">
            Por favor espere mientras cargamos la información.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12 bg-background rounded-lg border border-red-200">
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            Error al cargar RFX
          </h2>
          <p className="text-destructive mb-6">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()}
              className="bg-destructive hover:bg-red-700 text-background px-6 py-2 rounded-lg font-medium"
            >
              Reintentar
            </button>
            <button 
              onClick={() => router.push("/dashboard")}
              className="bg-gray-600 hover:bg-gray-700 text-background px-6 py-2 rounded-lg font-medium"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!backendData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12 bg-background rounded-lg border border">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No se encontraron datos
          </h2>
          <p className="text-muted-foreground mb-6">
            No se pudieron cargar los datos del RFX especificado.
          </p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="bg-primary hover:bg-primary-dark text-background px-6 py-2 rounded-lg font-medium"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* RFX Data View */}
        <RFXDataView
          extractedData={extractedData}
          onFieldSave={handleFieldSave}
          onGenerateBudget={() => router.push(`/rfx-result-wrapper-v2/budget/${id}`)}
          rfxId={id}
          rfxTitle={(backendData.data as any)?.title || extractedData.nombreEmpresa || "Datos Extraídos"}
          onTitleSave={handleTitleSave}
          fechaCreacion={(backendData.data as any)?.created_at || new Date().toISOString()}
          validationMetadata={backendData.data?.metadata_json || null}
          originalText={backendData.data?.metadata_json?.texto_original_relevante || ""}
          isFinalized={false}
          productosIndividuales={productosIndividuales}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
          onQuantityChange={handleQuantityChange}
          onPriceChange={handleProductPriceChange}
          onCostChange={handleProductCostChange}
          onUnitChange={handleUnitChange}
          onSaveProductCosts={saveProductCosts}
          isSavingCosts={isSavingCosts}
          costsSaved={costsSaved}
          // Chat panel control
          isChatOpen={isChatOpen}
          onChatToggle={() => setIsChatOpen(!isChatOpen)}
          // Pass default currency to children
          // @ts-ignore allow prop injection without breaking existing types
          defaultCurrency={(backendData.data as any)?.currency || selectedCurrency}
          // @ts-ignore pass currency change handler
          onCurrencyChange={handleCurrencyChange}
        />
      </div>

      {/* RFX Update Chat Panel - Outside container for proper fixed positioning */}
      <RFXUpdateChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        rfxId={id}
        rfxData={extractedData}
        onUpdate={handleChatUpdate}
      />
    </>
  );
}
