"use client"

import { useState, useRef } from "react"
import RfxChatInput from "@/components/features/rfx/RFXChatInput"
import type { RfxData, RfxResponse } from "@/types/rfx-types"
import type { RFXResponse } from "@/lib/api"
import RfxResultsWrapperV2 from "@/components/features/rfx/RFXResultsWrapperV2"
import RfxHistory, { RfxHistoryRef } from "@/components/features/rfx/RFXHistory"
import AppSidebar, { AppSidebarRef } from "@/components/layout/AppSidebar"
import { AiModelSelector } from "@/components/shared/AIModelSelector"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { api } from "@/lib/api" // 🆕 Import API para cargar datos de RFX

interface ExtractedData {
  solicitante: string
  email: string
  productos: string
  fechaEntrega: string
  lugarEntrega: string
}

export default function Dashboard() {
  const [rfxData, setRfxData] = useState<RfxData | null>(null)
  const [backendData, setBackendData] = useState<RFXResponse | undefined>(undefined)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentView, setCurrentView] = useState<"main" | "results" | "history">("main")
  const [finalizedRfx, setFinalizedRfx] = useState<{ data: ExtractedData; propuesta: string } | null>(null)
  const [aiModel, setAiModel] = useState<string>("chatgpt-4o") // Default to ChatGPT-4o

  // Refs for refreshing components
  const sidebarRef = useRef<AppSidebarRef>(null)
  const historyRef = useRef<RfxHistoryRef>(null)

  const handleFileProcessed = async (text: string) => {
    setIsAnalyzing(true)

    try {
      // Simulate analysis with timeout
      await new Promise((resolve) => setTimeout(resolve, 2000))

      console.log(`Analyzing with ${aiModel}:`, text) // Log the selected AI model

      // Create mock analysis data
      const lines = text.split('\n').filter(line => line.trim())
      const analyzedData: RfxData = {
        title: "Documento RFX Analizado",
        client: "Solicitante Detectado",
        deadline: "Fecha detectada automáticamente",
        requirements: lines.slice(0, 5).map((line, index) => ({
          id: index + 1,
          text: line.trim(),
          category: "Requerimiento",
          importance: Math.random() * 0.4 + 0.6 // Between 0.6 and 1.0
        })),
        keyDates: [
          { event: "Fecha límite de propuesta", date: "2024-02-15" },
          { event: "Reunión de clarificación", date: "2024-02-08" }
        ],
        competitiveFactors: [
          { factor: "Precio", weight: 0.4 },
          { factor: "Experiencia técnica", weight: 0.3 },
          { factor: "Tiempo de entrega", weight: 0.3 }
        ],
        summary: `Se detectaron ${lines.length} líneas de contenido en el documento RFX.`
      }

      setRfxData(analyzedData)
      setCurrentView("results")
    } catch (error) {
      console.error("Error al analizar el documento:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleRFXProcessed = async (response: RFXResponse) => {
    // 🔍 DEBUG: Log raw backend response
    console.log("🔍 DEBUG: Raw Backend Response:", response)
    console.log("📊 DEBUG: Response Status:", response.status)
    console.log("📄 DEBUG: Response Message:", response.message)
    
    setBackendData(response)
    setIsAnalyzing(true)

    if (response.status === "success" && response.data) {
      const data = response.data
      
      // 🔍 DEBUG: Log extracted data details
      console.log("📦 DEBUG: Backend Data Object:", data)
                  console.log("👤 DEBUG: Solicitante extraído:", data.nombre_solicitante)
      console.log("📧 DEBUG: Email extraído:", data.email)
      console.log("📦 DEBUG: Productos extraídos:", data.productos)
      console.log("📅 DEBUG: Fecha extraída:", data.fecha)
      console.log("🕐 DEBUG: Hora extraída:", data.hora_entrega)
      console.log("📍 DEBUG: Lugar extraído:", data.lugar)
      console.log("💰 DEBUG: Costo total:", data.costo_total)
      console.log("🔧 DEBUG: Metadatos:", data.metadatos)
      
      // Convert backend data to frontend format
      // Handle both new V2.0 structure and legacy structure safely
      const productos = data.products || data.productos || []
      const extractedData: ExtractedData = {
        solicitante: data.requester_name || data.nombre_solicitante || data.nombre_cliente || "Unknown",
        email: data.email || "",
        productos: Array.isArray(productos) ? productos.map(p => {
          // Handle both new and legacy product structures
          const nombre = p.product_name || p.nombre || "Unknown Product"
          const cantidad = p.quantity || p.cantidad || 0
          const unidad = p.unit || p.unidad || "units"
          return `${nombre} (${cantidad} ${unidad})`
        }).join(', ') : "No products",
        fechaEntrega: data.delivery_date || data.fecha || "",
        lugarEntrega: data.location || data.lugar || ""
      }
      
      // 🔍 DEBUG: Log converted data
      console.log("🔄 DEBUG: Converted Frontend Data:", extractedData)

      // Create mock RfxData for display
      const clientName = data.requester_name || data.nombre_solicitante || data.nombre_cliente || "Unknown Client"
      const deliveryDate = data.delivery_date || data.fecha || "TBD"
      const deliveryTime = data.delivery_time || data.hora_entrega || "TBD"
      const location = data.location || data.lugar || "TBD"
      
      const analyzedData: RfxData = {
        title: `RFX: ${clientName}`,
        client: clientName,
        deadline: deliveryDate,
        requirements: Array.isArray(productos) ? productos.map((p, index) => ({
          id: index + 1,
          text: p.product_name || p.nombre || "Unknown Product",
          category: "Producto",
          importance: 0.8
        })) : [],
        keyDates: [
          { event: "Fecha de entrega", date: deliveryDate },
          { event: "Hora de entrega", date: deliveryTime },
        ],
        competitiveFactors: [
          { factor: "Precio", weight: 0.4 },
          { factor: "Calidad", weight: 0.3 },
          { factor: "Entrega", weight: 0.3 },
        ],
        summary: `Solicitud de ${productos.length} productos para entrega el ${deliveryDate} en ${location}.`,
      }

      setRfxData(analyzedData)
      setCurrentView("results")

      // If proposal was generated, show success message
      if (response.propuesta_id) {
        console.log(`✅ Propuesta generada automáticamente: ${response.propuesta_id}`)
        console.log(`📄 URL de descarga: ${response.propuesta_url}`)
      }

      // Refresh sidebar and history after successful RFX processing
      try {
        await sidebarRef.current?.refresh()
        await historyRef.current?.refresh()
        console.log("✅ Sidebar and history refreshed after RFX processing")
      } catch (error) {
        console.warn("⚠️ Error refreshing components:", error)
      }
    } else {
      console.error("❌ DEBUG: Error processing RFX:", response.error || response.message)
      console.log("📋 DEBUG: Full error response:", response)
    }
    setIsAnalyzing(false)
  }

  const handleNavigateToMain = () => {
    setCurrentView("main")
    setRfxData(null)
    setBackendData(undefined)
    setFinalizedRfx(null)
  }

  const handleNavigateToHistory = () => {
    setCurrentView("history")
  }

  const handleSelectRfx = (rfxId: string) => {
    // Handle selecting a specific RFX from the sidebar
    console.log("Selected RFX:", rfxId)
    // In a real app, you would load the RFX data and navigate to results
  }

  const handleFinalize = async (data: ExtractedData, propuesta: string) => {
    setFinalizedRfx({ data, propuesta })
    // In a real app, this would save to a database or local storage
    console.log("RFX finalized:", { data, propuesta })

    // Refresh sidebar and history after finalizing RFX
    try {
      await sidebarRef.current?.refresh()
      await historyRef.current?.refresh()
      console.log("✅ Sidebar and history refreshed after RFX finalization")
    } catch (error) {
      console.warn("⚠️ Error refreshing components after finalization:", error)
    }
  }

  const handleProposalGenerated = async () => {
    // Refresh sidebar and history after proposal generation
    try {
      await sidebarRef.current?.refresh()
      await historyRef.current?.refresh()
      console.log("✅ Sidebar and history refreshed after proposal generation")
    } catch (error) {
      console.warn("⚠️ Error refreshing components after proposal generation:", error)
    }
  }

  // 🆕 NUEVA FUNCIÓN: Manejar navegación al análisis completo desde el historial
  const handleViewFullAnalysis = async (rfxId: string, rfxData: any) => {
    try {
      // ✅ Verificar autenticación antes de hacer peticiones
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        console.warn('⚠️ No access token found, redirecting to login');
        window.location.href = '/login';
        return;
      }

      console.log("🔍 Loading full analysis for RFX:", rfxId)
      
      // 🔍 DEBUG: Log input parameters to trace UUID vs name issue
      console.log('🔍 DEBUG handleViewFullAnalysis Input:', {
        rfxId: rfxId,
        rfxId_type: typeof rfxId,
        rfxData: rfxData
      })
      
      // Cargar datos completos del RFX usando la API
      const response = await api.getRFXById(rfxId)
      
      if (response.status === "success" && response.data) {
        console.log("✅ RFX data loaded successfully:", response.data)
        
        // 🔍 DEBUG: Log what comes from backend
        console.log('🔍 DEBUG Backend Response Data:', {
          response_data_id: response.data.id,
          id_type: typeof response.data.id,
          full_response: response
        })
        
        // Establecer los datos cargados como backendData
        setBackendData(response)
        
        // Navegar a la vista de resultados
        setCurrentView("results")
        
        console.log("🎯 Navigated to full analysis view for RFX:", rfxId)
      } else {
        console.error("❌ Error loading RFX data:", response.message)
        alert(`Error al cargar los datos del RFX: ${response.message}`)
      }
    } catch (error) {
      console.error("❌ Error loading full analysis:", error)
      alert("Error al cargar el análisis completo. Por favor, intente nuevamente.")
    }
  }

  const getBreadcrumbItems = () => {
    switch (currentView) {
      case "results":
        return (
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={handleNavigateToMain} className="cursor-pointer">
                Principal
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Análisis RFX</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        )
      case "history":
        return (
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={handleNavigateToMain} className="cursor-pointer">
                Principal
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Historial</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        )
      default:
        return (
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Principal</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        )
    }
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case "results":
        return (
          <RfxResultsWrapperV2
            onNewRfx={handleNavigateToMain}
            onFinalize={handleFinalize}
            onNavigateToHistory={handleNavigateToHistory}
            backendData={backendData}
            onProposalGenerated={handleProposalGenerated}
            useRealBackend={true}
            enableAdvancedPricing={true}
            enableTaxConfiguration={true}
            useApiCalculations={true}
          />
        )
      case "history":
        return <RfxHistory 
          ref={historyRef} 
          onNewRfx={handleNavigateToMain} 
          onNavigateToMain={handleNavigateToMain}
          onViewFullAnalysis={handleViewFullAnalysis} // 🆕 Pasar callback para ver análisis completo
        />
      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <div className="w-full space-y-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="text-primary">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900">RFX Analyzer</h1>
                </div>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Procesa documentos RFX con inteligencia artificial. Escribe instrucciones específicas o adjunta
                  archivos para comenzar.
                </p>
              </div>

              {/* Chat Input */}
              <RfxChatInput
                onFileProcessed={handleFileProcessed}
                onRFXProcessed={handleRFXProcessed}
                isLoading={isAnalyzing}
              />

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-background p-6 rounded-lg shadow-sm border border">
                  <div className="text-primary mb-3">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Procesamiento Inteligente</h3>
                  <p className="text-sm text-muted-foreground">
                    Extrae automáticamente información clave de documentos RFX usando IA avanzada.
                  </p>
                </div>

                <div className="bg-background p-6 rounded-lg shadow-sm border border">
                  <div className="text-green-600 mb-3">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Generación Automática</h3>
                  <p className="text-sm text-muted-foreground">
                    Crea propuestas comerciales personalizadas basadas en los requisitos identificados.
                  </p>
                </div>

                <div className="bg-background p-6 rounded-lg shadow-sm border border">
                  <div className="text-primary mb-3">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Análisis Competitivo</h3>
                  <p className="text-sm text-muted-foreground">
                    Identifica factores clave de competitividad y oportunidades de mejora.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar
        ref={sidebarRef}
        onNewRfx={handleNavigateToMain}
        onNavigateToHistory={handleNavigateToHistory}
        onSelectRfx={handleSelectRfx}
        currentView={currentView}
      />
      <SidebarInset className="bg-background">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200/60 px-4 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-gray-700" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-gray-300" />
          <Breadcrumb>{getBreadcrumbItems()}</Breadcrumb>

          {/* AI Model Selector in Header */}
          <div className="ml-auto">
            <AiModelSelector selectedModel={aiModel} onModelChange={setAiModel} />
          </div>
        </header>
        <div className="flex flex-1 flex-col bg-background">{renderCurrentView()}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
