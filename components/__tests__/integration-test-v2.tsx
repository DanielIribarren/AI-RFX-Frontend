/**
 * Integration Test for V2.2 Real Backend Implementation
 * Tests the complete flow from RFX data to budget generation
 */

import React from 'react'
import RfxResultsWrapperV2 from '@/components/rfx-results-wrapper-v2'
import type { RFXResponse } from '@/lib/api'

// Mock data for testing
const mockBackendData: RFXResponse = {
  status: "success",
  data: {
    id: "test-rfx-123",
    requester_name: "Juan Pérez",
    email: "juan@empresa.com",
    company_name: "Empresa Test S.A.",
    delivery_date: "2024-12-31",
    location: "Madrid, España",
    products: [
      {
        product_name: "Licencias ERP",
        quantity: 120,
        unit: "licencias",
        subtotal: 450
      },
      {
        product_name: "Módulo CRM",
        quantity: 1,
        unit: "módulo",
        subtotal: 12000
      }
    ],
    metadata_json: {
      validation_status: {
        completeness: 0.95,
        accuracy: 0.9
      },
      texto_original_relevante: "Solicitud para implementación de ERP..."
    }
  }
}

// Test component with different configurations
export function TestRealBackendIntegration() {
  const handleNewRfx = () => {
    console.log('🔄 Test: New RFX requested')
  }

  const handleFinalize = (data: any, propuesta: string) => {
    console.log('✅ Test: RFX finalized', { data, propuesta })
  }

  const handleProposalGenerated = async () => {
    console.log('📄 Test: Proposal generated')
  }

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-bold">🧪 Test de Integración V2.2</h1>
      
      {/* Test 1: Legacy Mode */}
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Test 1: Modo Legacy</h2>
        <RfxResultsWrapperV2
          onNewRfx={handleNewRfx}
          onFinalize={handleFinalize}
          backendData={mockBackendData}
          onProposalGenerated={handleProposalGenerated}
          
          enableAdvancedPricing={false}
          enableTaxConfiguration={false}
          useApiCalculations={false}
          useRealBackend={false}
        />
      </div>

      {/* Test 2: Real Backend Mode - Basic */}
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Test 2: Backend Real V2.2 - Básico</h2>
        <RfxResultsWrapperV2
          onNewRfx={handleNewRfx}
          onFinalize={handleFinalize}
          backendData={mockBackendData}
          onProposalGenerated={handleProposalGenerated}
          
          enableAdvancedPricing={true}
          enableTaxConfiguration={false}
          useApiCalculations={true}
          useRealBackend={true}
        />
      </div>

      {/* Test 3: Real Backend Mode - Full Features */}
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Test 3: Backend Real V2.2 - Completo</h2>
        <RfxResultsWrapperV2
          onNewRfx={handleNewRfx}
          onFinalize={handleFinalize}
          backendData={mockBackendData}
          onProposalGenerated={handleProposalGenerated}
          
          enableAdvancedPricing={true}
          enableTaxConfiguration={true}
          useApiCalculations={true}
          useRealBackend={true}
        />
      </div>
    </div>
  )
}

// Usage instructions
export const testInstructions = `
## 🧪 Instrucciones de Test

### Preparación del Backend
1. Asegúrate que el backend esté ejecutándose en http://localhost:5001
2. Verifica que los endpoints de pricing V2.2 estén disponibles:
   - GET /api/pricing/config/{rfx_id}
   - PUT /api/pricing/config/{rfx_id}
   - POST /api/pricing/calculate/{rfx_id}

### Tests a Realizar

#### Test 1: Modo Legacy ✅
- Debería funcionar sin errores
- Usa cálculos locales únicamente
- No hay conexión al backend real

#### Test 2: Backend Real V2.2 - Básico ✅
- Configura coordinación y costo por persona
- Usa cálculos híbridos (local + API)
- Conecta al backend real para configuraciones

#### Test 3: Backend Real V2.2 - Completo ✅
- Incluye sistema de impuestos
- Funcionalidades avanzadas completas
- Validación en tiempo real

### Flujo de Test Completo

1. **Vista de Datos Extraídos**
   - ✅ Tabs funcionando (Datos Extraídos / Archivos Procesados)
   - ✅ Botón "Generar Presupuesto" navega correctamente
   - ✅ Datos se muestran correctamente

2. **Vista de Generación de Presupuesto**
   - ✅ PricingConfigurationCard con backend real
   - ✅ BudgetPreviewCard con cálculos híbridos
   - ✅ Navegación de vuelta a datos
   - ✅ Guardado de configuración en backend

3. **Integración Completa**
   - ✅ Estado compartido entre vistas
   - ✅ Persistencia en backend real
   - ✅ Cálculos precisos con SQL
   - ✅ Validación en tiempo real

### Verificaciones de Funcionalidad

#### PricingConfigurationCard
- [ ] Carga configuración desde backend real
- [ ] Guarda cambios en backend real
- [ ] Muestra errores de validación
- [ ] Indica estado de conexión

#### BudgetPreviewCard  
- [ ] Cálculos locales instantáneos
- [ ] Cálculos API con backend real
- [ ] Fallback automático en caso de error
- [ ] Indicadores visuales de método de cálculo

#### Flujo de Navegación
- [ ] Data View → Budget View funciona
- [ ] Budget View → Data View funciona
- [ ] Estado persiste entre navegaciones
- [ ] Configuración se mantiene

### Debugging

Si encuentras errores:

1. **Error de conexión al backend**
   - Verifica que el backend esté en http://localhost:5001
   - Revisa la consola para errores de red

2. **Error de endpoints**
   - Verifica que los endpoints V2.2 estén implementados
   - Revisa la respuesta del servidor

3. **Error de configuración**
   - Verifica que el esquema V2.2 esté en la BD
   - Revisa los logs del servidor de pricing

4. **Error de cálculos**
   - Debería usar fallback local automáticamente
   - Revisa la consola para detalles del error

### Logs Esperados

- 🎯 "Using REAL backend V2.2 API for calculations"
- ✅ "Configuration loaded from real backend"
- 💾 "Configuration saved to real backend"
- 🔄 "Loading configuration from REAL backend V2.2"
`

export default TestRealBackendIntegration
