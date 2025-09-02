"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { RFXResponse } from "@/lib/api";
import RFXDataView from "@/components/rfx-data-view";
import { useRFXCurrency } from "@/contexts/RFXCurrencyContext";

interface ProductoIndividual {
  id: string;
  nombre: string;
  cantidad: number;
  cantidadOriginal: number;
  cantidadEditada: number;
  unidad: string;
  precio: number;
  isQuantityModified: boolean;
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
      
      return {
        id: product.id || `product-${index}`,
        nombre: productName,
        cantidad: originalQuantity,
        cantidadOriginal: originalQuantity,
        cantidadEditada: originalQuantity,
        unidad: productUnit,
        precio: productPrice,
        isQuantityModified: false
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

  // Handle field save for extracted data
  const handleFieldSave = async (field: string, value: string | number) => {
    try {
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
      alert(`Error al guardar el campo ${field}.`);
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

  useEffect(() => {
    let isMounted = true;

    const loadRfxData = async () => {
      if (!id) {
        setError("ID de RFX no válido");
        setIsLoading(false);
        return;
      }

      try {
        console.log("🔍 Loading RFX data for ID:", id);
        const response = await api.getRFXById(id);
        
        if (isMounted) {
          if (response.status === "success" && response.data) {
            setBackendData(response);
            
            // Initialize RFX context with currency
            const backendCurrency = (response.data as any)?.currency;
            await rfxCurrency.setRfxContext(response.data.id, backendCurrency);
            
            // Extract individual products
            const individualProducts = extractIndividualProducts(response.data);
            setProductosIndividuales(individualProducts);
            
            // Check if products already have valid prices
            const hasValidPrices = individualProducts.every(p => p.precio && p.precio > 0);
            setCostsSaved(hasValidPrices);
            
            setError(null);
            console.log("✅ RFX data loaded successfully:", response.data);
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Cargando datos del RFX...
          </h2>
          <p className="text-gray-500">
            Por favor espere mientras cargamos la información.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12 bg-white rounded-lg border border-red-200">
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            Error al cargar RFX
          </h2>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Reintentar
            </button>
            <button 
              onClick={() => router.push("/dashboard")}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium"
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
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No se encontraron datos
          </h2>
          <p className="text-gray-500 mb-6">
            No se pudieron cargar los datos del RFX especificado.
          </p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Extract basic data for RFXDataView props
  const extractedData = {
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
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* RFX Data View */}
      <RFXDataView
        extractedData={extractedData}
        onFieldSave={handleFieldSave}
        onGenerateBudget={() => router.push(`/rfx-result-wrapper-v2/budget/${id}`)}
        onAddNewFiles={() => router.push("/dashboard")}
        onNavigateToHistory={() => router.push("/history")}
        rfxId={id}
        fechaCreacion={(backendData.data as any)?.created_at || new Date().toISOString()}
        validationMetadata={backendData.data?.metadata_json || null}
        originalText={backendData.data?.metadata_json?.texto_original_relevante || ""}
        isFinalized={false}
        productosIndividuales={productosIndividuales}
        onAddProduct={async () => {}}
        onDeleteProduct={() => {}}
        onQuantityChange={handleQuantityChange}
        onPriceChange={handleProductPriceChange}
        onUnitChange={handleUnitChange}
        onSaveProductCosts={saveProductCosts}
        isSavingCosts={isSavingCosts}
        costsSaved={costsSaved}
        // Pass default currency to children
        // @ts-ignore allow prop injection without breaking existing types
        defaultCurrency={(backendData.data as any)?.currency || selectedCurrency}
        // @ts-ignore pass currency change handler
        onCurrencyChange={handleCurrencyChange}
      />


    </div>
  );
}
