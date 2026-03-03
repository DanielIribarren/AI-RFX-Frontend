"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { ProposalRequest, RFXResponse } from "@/lib/api";
import { getReviewState } from "@/lib/review-api";
import RFXDataView from "@/components/features/rfx/RFXDataView";
import BudgetGenerationView from "@/components/budget/BudgetGenerationView";
import { useRFXCurrency } from "@/contexts/RFXCurrencyContext";
import RFXUpdateChatPanel from "@/components/features/rfx/update-chat/RFXUpdateChatPanel";
import type { PricingConfigFormData } from "@/types/pricing-v2";
import { getFrontendPricingConfig, updateFrontendPricingConfigOptimized } from "@/lib/api-pricing-backend-real";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessageSquare, ReceiptText, Settings2 } from "lucide-react";

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
  specifications?: Record<string, any> | null;
  bundle_breakdown?: Array<any>;
  is_bundle?: boolean;
  inferred_bundle?: boolean;
}

const UUID_V4_OR_COMPAT_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function RfxDataPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [backendData, setBackendData] = useState<RFXResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productosIndividuales, setProductosIndividuales] = useState<ProductoIndividual[]>([]);
  const [isSavingCosts, setIsSavingCosts] = useState(false);
  const [costsSaved, setCostsSaved] = useState(false);
  const [extractedData, setExtractedData] = useState<any>({});
  
  // Chat panel state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"informacion" | "presupuesto">("informacion");

  // Proposal/budget states
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  const [propuesta, setPropuesta] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");
  const isValidRfxId = typeof id === "string" && UUID_V4_OR_COMPAT_REGEX.test(id);

  // Pricing configuration state
  const [pricingConfigV2, setPricingConfigV2] = useState<PricingConfigFormData>({
    coordination_enabled: false,
    coordination_type: 'standard',
    coordination_rate: 0.18,
    coordination_description: 'Coordinación y logística',
    coordination_apply_to_subtotal: true,
    cost_per_person_enabled: false,
    headcount: 120,
    headcount_source: 'manual',
    calculation_base: 'final_total',
    display_in_proposal: true,
    cost_per_person_description: 'Cálculo de costo individual',
    taxes_enabled: false,
    tax_name: 'IVA',
    tax_rate: 0.16,
    tax_apply_to_subtotal: false,
    tax_apply_to_coordination: true
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // RFX Currency context
  const rfxCurrency = useRFXCurrency();
  const { selectedCurrency } = rfxCurrency;

  // Load pricing configuration
  useEffect(() => {
    const loadPricingConfig = async () => {
      if (!isValidRfxId) return;
      
      try {
        const config = await getFrontendPricingConfig(id);
        if (config) {
          setPricingConfigV2(prev => ({
            ...prev,
            ...config
          }));
        }
      } catch (error) {
        console.error('Error loading pricing config:', error);
      }
    };

    loadPricingConfig();
  }, [id, isValidRfxId]);

  const updateTabInUrl = useCallback((tab: "informacion" | "presupuesto") => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "presupuesto") {
      params.set("tab", "presupuesto");
    } else {
      params.delete("tab");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleWorkspaceTabChange = useCallback((nextTab: string) => {
    const tab = nextTab === "presupuesto" ? "presupuesto" : "informacion";
    setActiveWorkspaceTab(tab);
    updateTabInUrl(tab);
  }, [updateTabInUrl]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const nextTab = tabParam === "presupuesto" ? "presupuesto" : "informacion";
    setActiveWorkspaceTab(nextTab);
  }, [searchParams]);

  // Auto-save pricing config with debounce
  const autoSavePricingConfig = useCallback(async (partialConfig: Partial<PricingConfigFormData>) => {
    if (!id) return;

    setSaveStatus('saving');
    
    try {
      await updateFrontendPricingConfigOptimized(id, partialConfig);
      setSaveStatus('saved');
      
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error saving pricing config:', error);
      setSaveStatus('error');
      
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  }, [id]);

  // Handlers de coordinación
  const handleCoordinationToggle = async (enabled: boolean) => {
    console.log('🔄 Coordination toggle (data view):', enabled);
    setPricingConfigV2(prev => ({ ...prev, coordination_enabled: enabled }));
    await autoSavePricingConfig({ coordination_enabled: enabled });
  };

  const handleCoordinationRateChange = async (rate: number) => {
    console.log('🔄 Coordination rate change (data view):', rate);
    setPricingConfigV2(prev => ({ ...prev, coordination_rate: rate }));
    await autoSavePricingConfig({ coordination_rate: rate });
  };

  // ⚡ Calculate profit metrics locally (instant feedback)
  // Formula: Margen Bruto = ((Precio - Costo) / Precio) * 100
  const calculateProfitMetrics = (precio: number, costo: number, cantidad: number) => {
    const ganancia_unitaria = precio - costo;
    const margen_ganancia = precio > 0 ? (ganancia_unitaria / precio) * 100 : 0;
    const total_profit = ganancia_unitaria * cantidad;
    
    return {
      ganancia_unitaria,
      margen_ganancia,
      total_profit
    };
  };

  // Extract individual products from backend data
  const extractIndividualProducts = (data: any): ProductoIndividual[] => {
    if (!data) return [];

    const products = data.products || data.productos || data.requested_products || [];

    const parseMaybeJson = (value: any) => {
      if (!value) return null;
      if (typeof value === "object") return value;
      if (typeof value !== "string") return null;
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };

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
      const productUnit = product.unit || product.unidad || product.unit_of_measure || product.measurement_unit || 'unidades';
      const productPrice = parseFloat(String(product.precio_unitario || product.estimated_unit_price || product.unit_price || product.price || 0)) || 0;
      const specifications = parseMaybeJson(product.specifications || product.especificaciones);
      const bundleBreakdown = Array.isArray(product.bundle_breakdown)
        ? product.bundle_breakdown
        : Array.isArray(specifications?.bundle_breakdown)
          ? specifications.bundle_breakdown
          : [];

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
        total_profit: totalProfit,
        specifications,
        bundle_breakdown: bundleBreakdown,
        is_bundle: Boolean(product.is_bundle || specifications?.is_bundle || bundleBreakdown.length > 0),
        inferred_bundle: Boolean(product.inferred_bundle || specifications?.inferred_bundle)
      };
    });
  };

  // Handle product price change
  const handleProductPriceChange = async (productId: string, newPrice: number) => {
    console.log(`💰 [PRICE CHANGE] Product: ${productId}, New Price: ${newPrice}`);
    
    try {
      // ⚡ Actualización instantánea con cálculo local de métricas
      setProductosIndividuales(prev =>
        prev.map(product => {
          if (product.id === productId) {
            const metrics = calculateProfitMetrics(
              newPrice,
              product.costo_unitario || 0,
              product.cantidadEditada
            );
            console.log(`✅ [INSTANT CALCULATION] ${product.nombre}:`, {
              precio_nuevo: newPrice,
              costo: product.costo_unitario || 0,
              cantidad: product.cantidadEditada,
              ganancia_unitaria: metrics.ganancia_unitaria,
              margen_ganancia: metrics.margen_ganancia.toFixed(2) + '%',
              total_profit: metrics.total_profit
            });
            return { 
              ...product, 
              precio: newPrice,
              ...metrics // ganancia_unitaria, margen_ganancia, total_profit
            };
          }
          return product;
        })
      );

      // Guardar en backend para persistencia
      if (backendData?.data?.id) {
        console.log(`🔄 Saving product price to backend: ${productId} = ${newPrice}`);
        await api.updateProductField(backendData.data.id, productId, "precio_unitario", newPrice);
        console.log(`✅ Product price saved to backend successfully`);
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
            `${p.product_name || p.nombre} (${p.quantity || p.cantidad} ${p.unit || p.unidad || p.unit_of_measure || "u"})`
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
    console.log(`💵 [COST CHANGE] Product: ${productId}, New Cost: ${newCost}`);
    
    // Guardar el valor anterior para revertir en caso de error
    let previousCost = 0;
    let previousMetrics = {};

    try {
      // ⚡ Actualización instantánea con cálculo local de métricas
      setProductosIndividuales(prev => {
        const product = prev.find(p => p.id === productId);
        if (product) {
          previousCost = product.costo_unitario || 0;
          previousMetrics = {
            ganancia_unitaria: product.ganancia_unitaria,
            margen_ganancia: product.margen_ganancia,
            total_profit: product.total_profit
          };
        }
        return prev.map(product => {
          if (product.id === productId) {
            const metrics = calculateProfitMetrics(
              product.precio,
              newCost,
              product.cantidadEditada
            );
            console.log(`✅ [INSTANT CALCULATION] ${product.nombre}:`, {
              precio: product.precio,
              costo_nuevo: newCost,
              cantidad: product.cantidadEditada,
              ganancia_unitaria: metrics.ganancia_unitaria,
              margen_ganancia: metrics.margen_ganancia.toFixed(2) + '%',
              total_profit: metrics.total_profit
            });
            return { 
              ...product, 
              costo_unitario: newCost,
              ...metrics // ganancia_unitaria, margen_ganancia, total_profit
            };
          }
          return product;
        });
      });

      // Guardar en backend para persistencia
      if (backendData?.data?.id) {
        console.log(`🔄 Saving product cost to backend: ${productId} = ${newCost} (was: ${previousCost})`);
        const result = await api.updateProductField(backendData.data.id, productId, "unit_cost", newCost);
        console.log(`✅ Product cost saved to backend successfully`);

        // Refresh data to get updated profit calculations from backend (confirmación)
        await refreshRFXData();
      }
    } catch (error) {
      console.error(`❌ Error saving product cost:`, error);
      // Revertir cambio local si falla el backend
      setProductosIndividuales(prev =>
        prev.map(product =>
          product.id === productId
            ? { ...product, costo_unitario: previousCost, ...previousMetrics }
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
    console.log(`🔢 [QUANTITY CHANGE] Product: ${productId}, New Quantity: ${newQuantity}`);
    
    try {
      // ⚡ Actualización instantánea con recálculo de total_profit
      setProductosIndividuales(prev => 
        prev.map(product => {
          if (product.id === productId) {
            const metrics = calculateProfitMetrics(
              product.precio,
              product.costo_unitario || 0,
              newQuantity
            );
            console.log(`✅ [INSTANT CALCULATION] ${product.nombre}:`, {
              precio: product.precio,
              costo: product.costo_unitario || 0,
              cantidad_nueva: newQuantity,
              ganancia_unitaria: metrics.ganancia_unitaria,
              margen_ganancia: metrics.margen_ganancia.toFixed(2) + '%',
              total_profit: metrics.total_profit
            });
            return { 
              ...product, 
              cantidadEditada: newQuantity,
              isQuantityModified: newQuantity !== product.cantidadOriginal,
              ...metrics // Recalcular total_profit con nueva cantidad
            };
          }
          return product;
        })
      );

      // Guardar en backend para persistencia
      if (backendData?.data?.id) {
        console.log(`🔄 Saving product quantity to backend: ${productId} = ${newQuantity}`);
        await api.updateProductField(backendData.data.id, productId, "cantidad", newQuantity);
        console.log(`✅ Product quantity saved to backend successfully`);
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

  const handleGenerateProposal = async () => {
    if (!backendData?.data || !id) {
      console.error("❌ No backend data or ID available for proposal generation");
      return;
    }

    setIsRegenerating(true);
    setIsLoadingProposal(true);
    try {
      const costsForValidation = productosIndividuales.length > 0
        ? productosIndividuales.map((product: any) => product.precio || 0)
        : [1];

      const proposalRequest: ProposalRequest = {
        rfx_id: id,
        costs: costsForValidation,
        history: "Propuesta generada desde workspace unificado",
        notes: {
          modality: "buffet",
          modality_description: `Servicio con coordinación ${pricingConfigV2.coordination_enabled ? 'incluida' : 'no incluida'}`,
          coordination: pricingConfigV2.coordination_enabled
            ? `Coordinación ${pricingConfigV2.coordination_type} al ${(pricingConfigV2.coordination_rate * 100).toFixed(1)}%`
            : "Sin coordinación adicional",
          additional_notes: `Configurado desde vista unificada. Costo por persona: ${pricingConfigV2.cost_per_person_enabled ? 'activado' : 'desactivado'}`
        },
        template_type: selectedTemplate,
      };

      const response = await api.generateProposal(proposalRequest);
      const proposalContent = response.proposal?.content_html || response.proposal?.content_markdown || "";

      if (proposalContent) {
        setPropuesta(proposalContent);
      }

      setBackendData(prevData => {
        if (!prevData?.data) return prevData;
        return {
          ...prevData,
          data: {
            ...prevData.data,
            generated_html: proposalContent,
            generated_proposal: proposalContent,
            actual_cost: response.proposal?.total_cost || prevData.data.actual_cost,
            estimated_budget: response.proposal?.total_cost || prevData.data.estimated_budget
          }
        };
      });
    } catch (error) {
      console.error("❌ Error generating proposal:", error);
      alert("❌ Error al generar la propuesta. Por favor intente nuevamente.");
    } finally {
      setIsRegenerating(false);
      setIsLoadingProposal(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      if (!propuesta || propuesta.trim().length === 0) {
        alert("⚠️ No hay propuesta generada para descargar.\n\nPor favor usa el botón 'Regenerar Propuesta' primero para crear una propuesta.");
        return;
      }

      const clientName = extractedData.solicitante || "cliente";
      const rfxId = id || "unknown";

      const structuredData = {
        client_info: {
          name: extractedData.solicitante,
          email: extractedData.email,
          company: extractedData.nombreEmpresa,
          delivery_date: extractedData.fechaEntrega,
          location: extractedData.lugarEntrega
        },
        costs: {
          total: backendData?.data?.actual_cost || backendData?.data?.estimated_budget,
          products: productosIndividuales
        },
        metadata: {
          rfx_id: rfxId,
          generated_at: new Date().toISOString(),
          status: "generated"
        }
      };

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const response = await fetch(`${apiBaseUrl}/api/download/html-to-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html_content: propuesta,
          document_id: rfxId,
          client_name: clientName,
          structured_data: structuredData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error del servidor: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const element = document.createElement("a");
      element.href = url;
      const isHTML = blob.type.includes("html") || blob.type.includes("text");
      const extension = isHTML ? "html" : "pdf";
      const fileName = `propuesta-${clientName.replace(/\s+/g, "-").toLowerCase()}.${extension}`;

      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("❌ Error downloading proposal:", error);
      alert("❌ No se pudo descargar la propuesta.");
    }
  };

  const handleFinalize = async () => {
    if (!backendData?.data?.id || !id) {
      console.error("❌ No backend data or ID available for finalization");
      return;
    }

    try {
      const updatableFields = [
        "solicitante",
        "email",
        "nombreEmpresa",
        "emailEmpresa",
        "telefonoEmpresa",
        "telefonoSolicitante",
        "cargoSolicitante",
        "fechaEntrega",
        "lugarEntrega",
        "requirements"
      ];

      for (const [field, value] of Object.entries(extractedData)) {
        if (updatableFields.includes(field) && value && value.toString().trim()) {
          try {
            await api.updateRFXField(id, field, value.toString());
          } catch (error) {
            console.error(`❌ Error guardando campo ${field}:`, error);
          }
        }
      }

      await api.finalizeRFX(id);
      alert("✅ Analysis completed successfully. The RFX has been saved to your history.");
      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    } catch (error) {
      console.error("❌ Error finalizando RFX:", error);
      alert("❌ Error al finalizar el análisis. Intente nuevamente.");
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
      if (!isValidRfxId) {
        setError("ID de RFX no válido");
        setIsLoading(false);
        router.replace("/dashboard");
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
        // Gate obligatorio: no entrar a Data View sin confirmación de review
        try {
          const reviewResponse = await getReviewState(id, "rfx");
          const reviewData = reviewResponse?.data;
          if (reviewData?.review_required && !reviewData?.review_confirmed) {
            router.replace(`/dashboard?review_rfx_id=${id}`);
            return;
          }
        } catch (reviewError) {
          // Si falla el endpoint de review, mantener comportamiento legacy
          console.warn("⚠️ Review state unavailable, continuing to Data View:", reviewError);
        }

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
            setPropuesta((completeData as any)?.generated_html || (completeData as any)?.generated_proposal || "");

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
  }, [id, isValidRfxId]);

  // Initialize extractedData from backendData when it loads
  useEffect(() => {
    if (backendData?.data) {
      setExtractedData({
        solicitante: backendData.data?.requester_name || (backendData.data as any)?.nombre_solicitante || "",
        email: backendData.data?.email || "",
        productos: backendData.data?.products?.map((p: any) => 
          `${p.product_name || p.nombre} (${p.quantity || p.cantidad} ${p.unit || p.unidad || p.unit_of_measure || "u"})`
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
              Retry
            </button>
            <button 
              onClick={() => router.push("/dashboard")}
              className="bg-gray-600 hover:bg-gray-700 text-background px-6 py-2 rounded-lg font-medium"
            >
              Back to Dashboard
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
        <Tabs value={activeWorkspaceTab} onValueChange={handleWorkspaceTabChange} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <TabsList className="grid grid-cols-2 w-full sm:w-auto">
              <TabsTrigger value="informacion" className="gap-2">
                <ReceiptText className="h-4 w-4" />
                Información RFX
              </TabsTrigger>
              <TabsTrigger value="presupuesto" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Presupuesto
              </TabsTrigger>
            </TabsList>
            <Button variant="outline" className="gap-2" onClick={() => setIsChatOpen(true)}>
              <MessageSquare className="h-4 w-4" />
              Chat de Iteración
            </Button>
          </div>

          <TabsContent value="informacion" className="mt-0">
            <RFXDataView
              extractedData={extractedData}
              onFieldSave={handleFieldSave}
              onGenerateBudget={() => handleWorkspaceTabChange("presupuesto")}
              showGenerateBudgetAction={false}
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
              isChatOpen={isChatOpen}
              onChatToggle={() => setIsChatOpen(!isChatOpen)}
              // @ts-ignore allow prop injection without breaking existing types
              defaultCurrency={(backendData.data as any)?.currency || selectedCurrency}
              // @ts-ignore pass currency change handler
              onCurrencyChange={handleCurrencyChange}
              // @ts-ignore Coordination props
              coordinationEnabled={pricingConfigV2.coordination_enabled}
              coordinationRate={pricingConfigV2.coordination_rate}
              onCoordinationToggle={handleCoordinationToggle}
              onCoordinationRateChange={handleCoordinationRateChange}
            />
          </TabsContent>

          <TabsContent value="presupuesto" className="mt-0">
            <BudgetGenerationView
              extractedData={extractedData}
              productosIndividuales={productosIndividuales}
              propuesta={propuesta}
              costoTotal={backendData.data?.actual_cost || backendData.data?.estimated_budget || null}
              rfxId={id}
              defaultCurrency={selectedCurrency}
              onBackToData={() => handleWorkspaceTabChange("informacion")}
              onGenerateProposal={handleGenerateProposal}
              onDownloadPDF={handleDownloadPDF}
              onFinalize={handleFinalize}
              isRegenerating={isRegenerating}
              isLoadingProposal={isLoadingProposal}
              isFinalized={false}
              isSavingCosts={isSavingCosts}
              costsSaved={costsSaved}
              pricingConfigV2={pricingConfigV2}
              onPricingConfigChange={setPricingConfigV2}
              onAutoSave={autoSavePricingConfig}
              saveStatus={saveStatus}
              isLoadingPricingConfig={false}
              isSavingPricingConfig={false}
              enableAdvancedPricing={true}
              enableTaxConfiguration={false}
              useApiCalculations={true}
              onCalculationUpdate={() => {}}
              useRealBackend={true}
              selectedTemplate={selectedTemplate}
              onTemplateChange={setSelectedTemplate}
              showBackButton={false}
              showHeaderDownloadAction={false}
              showPreviewTab={false}
            />
          </TabsContent>
        </Tabs>
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
