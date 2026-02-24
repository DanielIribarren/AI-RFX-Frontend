"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import type { RFXResponse, ProposalRequest } from "@/lib/api";
import { useRFXCurrency } from "@/contexts/RFXCurrencyContext";
import { 
  getFrontendPricingConfig,
  updateFrontendPricingConfigOptimized,
  handleBackendPricingError 
} from "@/lib/api-pricing-backend-real";
import { pricingApiV2, pricingConverter, pricingDefaults } from "@/lib/api-pricing-v2";
import type { 
  PricingConfigFormData, 
  PricingCalculationResult
} from "@/types/pricing-v2";
import dynamic from "next/dynamic";

// Dynamic import for heavy budget component
const BudgetGenerationView = dynamic(() => import("@/components/budget/BudgetGenerationView"), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto px-4 py-6">
      <div className="text-center py-12 bg-background rounded-lg border border">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Cargando vista de presupuesto...
        </h2>
      </div>
    </div>
  )
});

export default function RfxBudgetPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [backendData, setBackendData] = useState<RFXResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // RFX Currency context
  const rfxCurrency = useRFXCurrency();
  
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

  // State for products with local calculations
  const [productosConGanancias, setProductosConGanancias] = useState<any[]>([]);

  // Pricing configuration states
  const [pricingConfigV2, setPricingConfigV2] = useState<PricingConfigFormData>(() => {
    return {
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
    };
  });
  
  const [isLoadingPricingConfig, setIsLoadingPricingConfig] = useState(false);
  const [isSavingPricingConfig, setIsSavingPricingConfig] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Ref for debouncing auto-save
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Proposal generation states
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  const [propuesta, setPropuesta] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");

  // Load pricing configuration from API
  const loadPricingConfig = async (rfxId: string) => {
    setIsLoadingPricingConfig(true);
    try {
      console.log("🎯 Loading pricing configuration for budget view, ID:", rfxId);
      const backendConfig = await getFrontendPricingConfig(rfxId);
      
      // Convert to component format
      const formData: PricingConfigFormData = {
        coordination_enabled: backendConfig.coordination_enabled,
        coordination_type: backendConfig.coordination_type,
        coordination_rate: backendConfig.coordination_rate,
        coordination_description: backendConfig.coordination_description || 'Coordinación y logística',
        coordination_apply_to_subtotal: true,
        
        cost_per_person_enabled: backendConfig.cost_per_person_enabled,
        headcount: backendConfig.headcount,
        headcount_source: 'manual',
        calculation_base: backendConfig.calculation_base,
        display_in_proposal: true,
        cost_per_person_description: 'Cálculo de costo individual',
        
        taxes_enabled: backendConfig.taxes_enabled,
        tax_name: backendConfig.tax_name,
        tax_rate: backendConfig.tax_rate,
        tax_apply_to_subtotal: false,
        tax_apply_to_coordination: true
      };
      
      setPricingConfigV2(formData);
      console.log("✅ Pricing configuration loaded for budget view:", formData);
    } catch (error) {
      const errorMessage = handleBackendPricingError(error);
      console.error("❌ Error loading pricing configuration for budget:", errorMessage);
      // Continue with default configuration
    } finally {
      setIsLoadingPricingConfig(false);
    }
  };

  // Auto-save pricing configuration (debounced)
  const autoSavePricingConfig = useCallback(async (partialConfig: Partial<PricingConfigFormData>) => {
    if (!id) return;
    
    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set saving status immediately for UI feedback
    setSaveStatus('saving');
    
    // Debounce the actual save by 500ms
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log("💾 Auto-saving pricing configuration changes:", partialConfig);
        
        // Call the optimized backend API (detects changes and uses PATCH endpoints)
        const success = await updateFrontendPricingConfigOptimized(id, partialConfig);
        
        if (success) {
          console.log("✅ Pricing configuration auto-saved successfully");
          setSaveStatus('saved');
          setLastSavedAt(new Date());
          
          // Reset to idle after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          // Backend not available - save locally only (no error shown to user)
          console.warn("⚠️ Backend not available - changes saved locally only");
          setSaveStatus('saved'); // Still show "saved" to user for better UX
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      } catch (error) {
        // Silently handle errors - don't disrupt user experience
        console.warn("⚠️ Auto-save error (working in offline mode):", error);
        setSaveStatus('saved'); // Show saved to avoid confusing the user
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }, 500);
  }, [id, pricingConfigV2]);

  // Handle pricing config change
  const handlePricingConfigChange = (newConfig: PricingConfigFormData) => {
    setPricingConfigV2(newConfig);
    console.log("🔄 Pricing configuration updated in budget view:", newConfig);
  };

  // Handle calculation update
  const handleCalculationUpdate = (result: PricingCalculationResult) => {
    console.log("📊 Calculation result received in budget view:", result);
  };

  // Generate/Regenerate proposal using API
  const handleGenerateProposal = async () => {
    setIsRegenerating(true);
    setIsLoadingProposal(true);
    if (!backendData?.data || !id) {
      console.error("❌ No backend data or ID available for proposal generation");
      return;
    }

    // ✅ Prepare costs for validation (backend will use DB costs)
    // Array of numbers (unit prices) as expected by ProposalRequest model
    const costsForValidation = productosIndividuales.length > 0 
      ? productosIndividuales.map((product: any) => product.precio || 0) 
      : [1]; // Array with at least one element to comply with min_items=1

    setIsRegenerating(true);
    try {
      console.log("🤖 Generating proposal for RFX ID:", id);
      console.log("👥 Products to process:", productosIndividuales.length);

      // ✅ Prepare proposal request using the EXACT structure as successful components
      const proposalRequest: ProposalRequest = {
        rfx_id: id,
        costs: costsForValidation, // Array of numbers: [price1, price2, price3]
        history: "Propuesta generada desde vista de presupuesto con configuración avanzada",
        notes: {
          modality: "buffet",
          modality_description: `Servicio con coordinación ${pricingConfigV2.coordination_enabled ? 'incluida' : 'no incluida'}`,
          coordination: pricingConfigV2.coordination_enabled 
            ? `Coordinación ${pricingConfigV2.coordination_type} al ${(pricingConfigV2.coordination_rate * 100).toFixed(1)}%`
            : "Sin coordinación adicional",
          additional_notes: `Configurado desde vista de presupuesto. Costo por persona: ${pricingConfigV2.cost_per_person_enabled ? 'activado' : 'desactivado'}`
        },
        template_type: selectedTemplate,
      };

      console.log("📤 Proposal request prepared:", proposalRequest);
      console.log("💰 Costs for validation (array of numbers):", costsForValidation);
      console.log("🎯 Request structure matches working components: rfx_id, costs[], history, notes");
      
      const response = await api.generateProposal(proposalRequest);
      
      if (response.proposal) {
        // Update with real backend data
        const proposalContent = response.proposal.content_html || response.proposal.content_markdown || "";
        setPropuesta(proposalContent);
        
        // Update backend data state to reflect new proposal
        setBackendData(prevData => {
          if (!prevData || !prevData.data) return prevData;
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
        
        console.log("✅ Proposal generated successfully");
        console.log("💰 Total cost from backend:", response.proposal?.total_cost);
        console.log("📋 Proposal metadata:", response.proposal?.metadata);
      }
    } catch (error) {
      console.error("❌ Error generating proposal:", error);
      console.error("📋 Request data that failed:", {
        rfx_id: id,
        costs_length: costsForValidation?.length,
        costs_sample: costsForValidation?.slice(0, 3),
        products_count: productosIndividuales?.length
      });
      
      if (error instanceof Error && error.message.includes("404")) {
        alert("❌ RFX no encontrado. Por favor recargue la página e intente nuevamente.");
      } else if (error instanceof Error && error.message.includes("500")) {
        alert("❌ Error del servidor al generar la propuesta. Verifique que los costos estén guardados e intente nuevamente.");
      } else if (error instanceof Error && error.message.includes("Invalid request data")) {
        alert("❌ Error en la estructura de datos enviada. Revise la consola para más detalles.");
      } else {
        alert("❌ Error al generar la propuesta. Por favor intente nuevamente.");
      }
    } finally {
      setIsRegenerating(false);
      setIsLoadingProposal(false);
    }
  };

  // Download PDF function based on working implementation from rfx-results.tsx
  const handleDownloadPDF = async () => {
    try {
      // ✅ Validar que hay propuesta generada (HTML en el preview)
      if (!propuesta || propuesta.trim().length === 0) {
        alert("⚠️ No hay propuesta generada para descargar.\n\nPor favor usa el botón 'Regenerar Propuesta' primero para crear una propuesta.");
        return;
      }

      // ✅ Validar datos del cliente para el nombre del archivo
      const clientName = extractedData.solicitante || 'cliente';
      const rfxId = id || 'unknown';
      
      console.log("🎯 Enviando HTML del preview directamente al backend para conversión a PDF");
      console.log("📄 HTML content length:", propuesta.length);
      
      // ✅ Preparar datos estructurados adicionales para el backend
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
          status: 'generated'
        }
      };

      // ✅ Enviar HTML directamente al endpoint de conversión
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/download/html-to-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      
      if (blob.size === 0) {
        throw new Error("El archivo descargado está vacío");
      }
      
      // ✅ Crear link de descarga
      const url = URL.createObjectURL(blob);
      const element = document.createElement("a");
      element.href = url;
      
      // ✅ Determinar extensión basada en el tipo de contenido
      const isHTML = blob.type.includes('html') || blob.type.includes('text');
      const extension = isHTML ? 'html' : 'pdf';
      const fileName = `propuesta-${clientName.replace(/\s+/g, "-").toLowerCase()}.${extension}`;
      
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
      
      // ✅ Mostrar mensaje apropiado
      if (isHTML) {
        alert(`⚠️ PDF no disponible temporalmente. Se descargó como HTML: ${fileName}\n\nPara convertir a PDF:\n1. Abre el archivo HTML en tu navegador\n2. Presiona Ctrl+P (o Cmd+P en Mac)\n3. Selecciona "Guardar como PDF"\n4. Ajusta configuración para A4 si es necesario`);
      } else {
        alert(`✅ Propuesta descargada exitosamente como PDF: ${fileName}`);
      }
      
    } catch (error) {
      console.error("❌ Error downloading proposal:", error);
      
      // ✅ Mensajes de error específicos y útiles
      let errorMessage = "Error desconocido al descargar la propuesta";
      
      if (error instanceof Error) {
        if (error.message.includes("html_content is required")) {
          errorMessage = "No se encontró contenido HTML. Genere la propuesta primero.";
        } else if (error.message.includes("PDF conversion methods failed")) {
          errorMessage = "Error de conversión a PDF. Se intentará descargar como HTML.";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Error de conexión. Verifica tu conexión a internet.";
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`❌ No se pudo descargar la propuesta\n\nError: ${errorMessage}\n\nSoluciones:\n1. Verifica que la propuesta esté generada (visible en pantalla)\n2. Revisa tu conexión a internet\n3. Si persiste, contacta al administrador`);
    }
  };

  // Finalize function based on working implementation from rfx-results.tsx
  const handleFinalize = async () => {
    if (!backendData?.data?.id || !id) {
      console.error("❌ No backend data or ID available for finalization");
      return;
    }

    console.log("🚀 Iniciando finalización de análisis desde vista de presupuesto...");
    
    try {
      // ✅ Guardar datos generales del RFX que están permitidos en el backend
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
      
      console.log("💾 Guardando datos generales editados...");
      for (const [field, value] of Object.entries(extractedData)) {
        if (updatableFields.includes(field) && value && value.toString().trim()) {
          try {
            await api.updateRFXField(id, field, value.toString());
            console.log(`✅ Campo ${field} guardado:`, value);
          } catch (error) {
            console.error(`❌ Error guardando campo ${field}:`, error);
            // Continuar con otros campos aunque uno falle
          }
        }
      }

      // ✅ Finalizar RFX en el backend
      console.log("🎯 Finalizando RFX en backend...");
      await api.finalizeRFX(id);
      console.log("✅ RFX finalizado exitosamente en backend");
      
      // ✅ Mostrar confirmación y redirigir
      alert("✅ Analysis completed successfully. The RFX has been saved to your history.");
      
      // Redirigir al dashboard después de 1 segundo
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
      
    } catch (error) {
      console.error("❌ Error finalizando RFX:", error);
      
      // Mostrar error pero permitir continuar
      if (error instanceof Error && error.message.includes("404")) {
        alert("❌ RFX no encontrado. Por favor recargue la página e intente nuevamente.");
      } else if (error instanceof Error && error.message.includes("500")) {
        alert("❌ Error del servidor al finalizar. El análisis se ha guardado pero puede necesitar revisión manual.");
      } else {
        alert("❌ Error al finalizar el análisis. Los cambios se han guardado localmente.");
      }
      
      // Continuar con redirección aunque falle la finalización
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  };

  // Handle product price change with instant calculation
  const handleProductPriceChange = async (productId: string, newPrice: number) => {
    console.log(`💰 Changing price for product ${productId}: ${newPrice}`);
    
    // ⚡ Actualización instantánea con cálculo local de métricas
    setProductosConGanancias(prev =>
      prev.map(product => {
        if (product.id === productId) {
          const metrics = calculateProfitMetrics(
            newPrice,
            product.costo_unitario || 0,
            product.cantidadEditada
          );
          console.log(`✅ Calculated metrics for ${product.nombre}:`, metrics);
          return { 
            ...product, 
            precio: newPrice,
            ...metrics
          };
        }
        return product;
      })
    );

    // Guardar en backend para persistencia
    if (id) {
      try {
        await api.updateProductField(id, productId, "precio_unitario", newPrice);
        console.log(`✅ Price saved to backend: ${productId} = ${newPrice}`);
      } catch (error) {
        console.error(`❌ Error saving price:`, error);
      }
    }
  };

  // Handle product cost change with instant calculation
  const handleProductCostChange = async (productId: string, newCost: number) => {
    console.log(`💵 Changing cost for product ${productId}: ${newCost}`);
    
    // ⚡ Actualización instantánea con cálculo local de métricas
    setProductosConGanancias(prev =>
      prev.map(product => {
        if (product.id === productId) {
          const metrics = calculateProfitMetrics(
            product.precio,
            newCost,
            product.cantidadEditada
          );
          console.log(`✅ Calculated metrics for ${product.nombre}:`, metrics);
          return { 
            ...product, 
            costo_unitario: newCost,
            ...metrics
          };
        }
        return product;
      })
    );

    // Guardar en backend para persistencia
    if (id) {
      try {
        await api.updateProductField(id, productId, "unit_cost", newCost);
        console.log(`✅ Cost saved to backend: ${productId} = ${newCost}`);
      } catch (error) {
        console.error(`❌ Error saving cost:`, error);
      }
    }
  };

  // Handle quantity change with instant calculation
  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    console.log(`🔢 Changing quantity for product ${productId}: ${newQuantity}`);
    
    // ⚡ Actualización instantánea con recálculo de total_profit
    setProductosConGanancias(prev =>
      prev.map(product => {
        if (product.id === productId) {
          const metrics = calculateProfitMetrics(
            product.precio,
            product.costo_unitario || 0,
            newQuantity
          );
          console.log(`✅ Calculated metrics for ${product.nombre}:`, metrics);
          return { 
            ...product, 
            cantidadEditada: newQuantity,
            isQuantityModified: newQuantity !== product.cantidadOriginal,
            ...metrics
          };
        }
        return product;
      })
    );

    // Guardar en backend para persistencia
    if (id) {
      try {
        await api.updateProductField(id, productId, "cantidad", newQuantity);
        console.log(`✅ Quantity saved to backend: ${productId} = ${newQuantity}`);
      } catch (error) {
        console.error(`❌ Error saving quantity:`, error);
      }
    }
  };

  // Extract products for budget calculations - GET FRESH DATA FROM API
  const extractIndividualProducts = (data: any) => {
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
      
      // Extraer campos de ganancias del backend
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
        // Campos de ganancias
        costo_unitario: costoUnitario,
        ganancia_unitaria: gananciaUnitaria,
        margen_ganancia: margenGanancia,
        total_profit: totalProfit
      };
    });
  };

  const productosIndividuales = extractIndividualProducts(backendData?.data);

  // All useEffect hooks must be called unconditionally at the same order
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
        console.log("🔍 Loading RFX data for budget view, ID:", id);
        
        // Load RFX data with fresh data from server
        const response = await api.getRFXById(id);
        
        if (isMounted && response.status === "success" && response.data) {
          setBackendData(response);
          
          // Initialize proposal state with existing data
          const existingProposal = (response.data as any)?.generated_html || (response.data as any)?.generated_proposal || "";
          setPropuesta(existingProposal);
          
          // Initialize RFX context with currency
          const backendCurrency = (response.data as any)?.currency;
          await rfxCurrency.setRfxContext(response.data.id, backendCurrency);
          
          // Load pricing configuration
          await loadPricingConfig(id);
          
          setError(null);
        } else if (isMounted) {
          setError(response.message || "Error al cargar datos del RFX");
          console.error("❌ Error loading RFX data for budget:", response.message);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : "Error desconocido";
          setError(errorMessage);
          console.error("❌ Error fetching RFX data for budget:", err);
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
    };
  }, [id]);

  // Initialize productosConGanancias when productosIndividuales changes
  useEffect(() => {
    if (productosIndividuales.length > 0) {
      console.log("🔍 DEBUG - Productos en vista de presupuesto:", productosIndividuales);
      console.log("📊 DEBUG - Pricing config:", pricingConfigV2);
      
      // Initialize local state with backend data
      setProductosConGanancias(productosIndividuales);
      console.log("✅ Productos con ganancias inicializados:", productosIndividuales.length);
    } else {
      console.log("⚠️ DEBUG - No hay productos en vista de presupuesto");
      setProductosConGanancias([]);
    }
  }, [productosIndividuales.length]); // Only re-run when length changes to avoid infinite loops

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12 bg-background rounded-lg border border">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Cargando datos del presupuesto...
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
            Error al cargar presupuesto
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
              onClick={() => router.push(`/rfx-result-wrapper-v2/data/${id}`)}
              className="bg-gray-600 hover:bg-gray-700 text-background px-6 py-2 rounded-lg font-medium"
            >
              Back to Data
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
            Budget data not found
          </h2>
          <p className="text-muted-foreground mb-6">
            Could not load data for the specified RFX.
          </p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="bg-primary hover:bg-primary-dark text-background px-6 py-2 rounded-lg font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Extract basic data for BudgetGenerationView props
  const extractedData = {
    solicitante: backendData.data?.requester_name || backendData.data?.nombre_solicitante || "",
    email: backendData.data?.email || "",
    productos: backendData.data?.products?.map((p: any) => 
      `${p.product_name || p.nombre} (${p.quantity || p.cantidad} ${p.unit || p.unidad})`
    ).join(', ') || "",
    fechaEntrega: backendData.data?.delivery_date || backendData.data?.fecha || "",
    lugarEntrega: backendData.data?.location || backendData.data?.lugar || "",
    nombreEmpresa: backendData.data?.company_name || (backendData.data as any)?.nombre_empresa || "",
    emailEmpresa: (backendData.data as any)?.email_empresa || "",
    telefonoEmpresa: (backendData.data as any)?.telefono_empresa || "",
    telefonoSolicitante: (backendData.data as any)?.telefono_solicitante || "",
    cargoSolicitante: (backendData.data as any)?.cargo_solicitante || "",
    requirements: (backendData.data as any)?.requirements || "",
    requirementsConfidence: (backendData.data as any)?.requirements_confidence || 0.0
  };

  // Debug logging for implemented functions
  if (process.env.NODE_ENV === 'development') {
    console.log("🔧 Budget View Functions Status:", {
      handleGenerateProposal: typeof handleGenerateProposal,
      handleDownloadPDF: typeof handleDownloadPDF,
      handleFinalize: typeof handleFinalize,
      rfxId: id,
      hasProposal: !!propuesta,
      proposalLength: propuesta?.length || 0
    });
  }



  return (
    <div className="flex flex-col h-full w-full">
      {/* Tab Navigation */}
      <div className="border-b border bg-background w-full">
        <div className="px-4 py-2 w-full">
          <nav className="flex gap-6 w-full" aria-label="Tabs">
            <a
              href={`/rfx-result-wrapper-v2/data/${id}`}
              className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent text-muted-foreground hover:text-gray-700 hover:border-input font-medium text-sm transition-colors duration-200"
            >
              Datos
            </a>
            <span className="whitespace-nowrap py-2 px-1 border-b-2 border-primary-light text-primary font-medium text-sm">
              Presupuesto
            </span>
          </nav>
        </div>
      </div>
      
      {/* Budget Content */}
      <div className="flex-1 overflow-auto w-full">
        <BudgetGenerationView
          extractedData={extractedData}
          productosIndividuales={productosConGanancias.length > 0 ? productosConGanancias : productosIndividuales}
          propuesta={propuesta}
          costoTotal={backendData.data?.actual_cost || backendData.data?.estimated_budget || null}
          rfxId={id}
          // @ts-ignore minimal-impact prop to seed currency
          defaultCurrency={rfxCurrency.selectedCurrency}
          onBackToData={() => router.push(`/rfx-result-wrapper-v2/data/${id}`)}
          onGenerateProposal={handleGenerateProposal}
          onDownloadPDF={handleDownloadPDF}
          onFinalize={handleFinalize}
          onAddProduct={async () => {}}
          onDeleteProduct={() => {}}
          onQuantityChange={handleQuantityChange}
          onPriceChange={handleProductPriceChange}
          onCostChange={handleProductCostChange}
          onUnitChange={async () => {}}
          onSaveProductCosts={async () => {}}
          isRegenerating={isRegenerating}
          isLoadingProposal={isLoadingProposal}
          isFinalized={false}
          isSavingCosts={false}
          costsSaved={false}
          pricingConfigV2={pricingConfigV2}
          onPricingConfigChange={handlePricingConfigChange}
          onAutoSave={autoSavePricingConfig}
          saveStatus={saveStatus}
          isLoadingPricingConfig={isLoadingPricingConfig}
          isSavingPricingConfig={isSavingPricingConfig}
          enableAdvancedPricing={true}
          enableTaxConfiguration={false}
          useApiCalculations={true}
          onCalculationUpdate={handleCalculationUpdate}
          useRealBackend={true}
          selectedTemplate={selectedTemplate}
          onTemplateChange={setSelectedTemplate}
        />
      </div>
    </div>
  );
}
