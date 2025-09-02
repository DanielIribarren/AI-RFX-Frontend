"use client";

import { useState } from "react";
import RfxChatInput from "@/components/rfx-chat-input";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="text-blue-600">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">RFX Analyzer</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-blue-600 mb-3">
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
            <p className="text-sm text-gray-600">
              Extrae automáticamente información clave de documentos RFX usando IA avanzada.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
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
            <p className="text-sm text-gray-600">
              Crea propuestas comerciales personalizadas basadas en los requisitos identificados.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-purple-600 mb-3">
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
            <p className="text-sm text-gray-600">
              Identifica factores clave de competitividad y oportunidades de mejora.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
