"use client";

import { useState } from "react";
import RfxChatInput from "@/components/features/rfx/RFXChatInput";
import { useRouter } from "next/navigation";
import type { RFXResponse } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileProcessed = async (text: string) => {
    setIsAnalyzing(true);
    try {
      // Simulate analysis with timeout (legacy behavior)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("File processed:", text);
      // Note: Real navigation happens in handleRFXProcessed
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRFXProcessed = async (response: RFXResponse) => {
    console.log("RFX processed, navigating to results:", response);
    
    if (response.status === "success" && response.data?.id) {
      // Navigate to results using the RFX ID
      router.push(`/rfx-result-wrapper-v2/data/${response.data.id}`);
    } else {
      console.error("Error processing RFX:", response.message);
      alert(`Error al procesar RFX: ${response.message || "Error desconocido"}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-4">
      <div className="w-full space-y-10">
        {/* Header */}
        <div className="text-center space-y-5">
          <div className="flex items-center justify-center gap-3 animate-float">
            <div className="bg-brand-gradient p-3 rounded-2xl shadow-lg">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-primary">
              RFX Analyzer
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Procesa documentos RFX con <span className="text-brand-gradient font-semibold">inteligencia artificial</span>. 
            Escribe instrucciones específicas o adjunta archivos para comenzar.
          </p>
        </div>

        {/* Chat Input */}
        <RfxChatInput
          onFileProcessed={handleFileProcessed}
          onRFXProcessed={handleRFXProcessed}
          isLoading={isAnalyzing}
        />

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="group card-elevated-lg p-7 hover-lift hover-glow-brand cursor-default">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-2xl mb-4 w-fit group-hover:scale-110 transition-transform duration-300">
              <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-lg">Procesamiento Inteligente</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Extrae automáticamente información clave de documentos RFX usando IA avanzada.
            </p>
          </div>

          <div className="group card-elevated-lg p-7 hover-lift hover-glow-brand cursor-default border-brand-accent">
            <div className="bg-gradient-to-br from-primary to-primary-dark p-4 rounded-2xl mb-4 w-fit group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg className="h-8 w-8 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-lg flex items-center gap-2">
              Generación Automática
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Popular</span>
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Crea propuestas comerciales personalizadas basadas en los requisitos identificados.
            </p>
          </div>

          <div className="group card-elevated-lg p-7 hover-lift hover-glow-brand cursor-default">
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 rounded-2xl mb-4 w-fit group-hover:scale-110 transition-transform duration-300">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-lg">Análisis Competitivo</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Identifica factores clave de competitividad y oportunidades de mejora.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
