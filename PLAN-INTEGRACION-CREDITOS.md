# 💳 Plan de Implementación - Sistema de Créditos (Frontend)

## 🎯 Objetivo
Integrar el consumo, visualización y validación de créditos en la interfaz de usuario, manejando elegantemente los límites de uso.

---

## 1. 🏗️ Arquitectura de Datos (KISS)

En lugar de complicados gestores de estado global (Redux/Zustand), usaremos un **Contexto de React** ligero para mantener los créditos sincronizados.

### `CreditsContext`
- **Estado:**
  - `creditsAvailable`: number
  - `creditsTotal`: number
  - `isLoading`: boolean
- **Métodos:**
  - `refreshCredits()`: Llama a `GET /api/credits/info`
  - `checkCredits(cost)`: Valida localmente antes de una acción (optimista).

---

## 2. 🔌 Integración de Endpoints (`lib/api-credits.ts`)

Crearemos un módulo dedicado para estos endpoints para no ensuciar `api.ts`.

| Acción | Endpoint | Componente/Hook Afectado |
|--------|----------|--------------------------|
| **Consultar Créditos** | `GET /api/credits/info` | `CreditsContext`, `CreditsIndicator` |
| **Procesar RFX** | `POST /api/rfx/process` | `Dashboard/UploadZone` |
| **Enviar Chat** | `POST /api/rfx/:id/chat` | `RFXUpdateChatPanel` |
| **Generar Propuesta** | `POST /api/proposals/generate` | `ProposalGenerator` |
| **Ver Planes** | `GET /api/credits/plans` | `PricingPage`, `UpgradeModal` |

---

## 3. 🚨 Manejo de Errores Contextual (Token Limit)

En lugar de interrumpir con modales globales, mostraremos alertas **inline** donde ocurre la acción.

### Componente: `<LowCreditsAlert />`
Componente reutilizable para mensajes de error/advertencia inline.
- **Estilo:** Borde negro fino, fondo blanco o gris muy suave (`bg-gray-50`). Texto negro.
- **Icono:** ⚠️ o 💎 (monocromático).
- **Acción:** Link subrayado "Get more credits" (lleva a `/pricing`).

---

## 4. 📍 Puntos de Integración en UI

### A. Gestión de Créditos (`Profile` & `Organization Settings`)
**Ubicación:**
1.  **User Profile:** `/settings/profile` (Créditos personales).
2.  **Organization General:** `/settings/organization/general` (Créditos de la org).

**Componente: `<CreditsUsageCard />`**
- **Diseño:** Tarjeta minimalista (B&W).
- **Contenido:**
  - Barra de progreso (negra).
  - Texto: "120 / 500 credits used".
  - Fecha de renovación: "Resets on Jan 1st".
  - Botón "Upgrade Plan" (Outline black).

### B. Dashboard / Subida de Archivos
- **Acción:** Usuario arrastra un PDF.
- **Validación:**
  - Si `credits < 10`: Deshabilitar zona de carga.
  - Mostrar `<LowCreditsAlert />` en la zona de drop con mensaje: "Insufficient credits to process new files."

### C. Chat Conversacional (`RFXUpdateChatPanel`)
- **Ubicación:** Justo **arriba del input** de texto del chat.
- **Comportamiento:**
  - Si el backend retorna 402 o validación local falla.
  - Mostrar alerta compacta: "Not enough credits to send message. [Get more]"
  - Input deshabilitado o visualmente indicando restricción.

### D. Generación de Propuestas (`ProposalGenerator`)
- **Ubicación:** Inmediatamente **debajo del botón** principal "Generate Proposal".
- **Comportamiento:**
  - Si no hay créditos suficientes: Botón deshabilitado (gris).
  - Texto debajo: "Requires 5 credits (You have 2). [Upgrade Plan]" en texto pequeño gris oscuro.

---

## 5. 📅 Roadmap de Tareas

1. [ ] Crear `lib/api-credits.ts`.
2. [ ] Crear `contexts/CreditsContext.tsx`.
3. [ ] Crear componente `<CreditsUsageCard />` (Estilo B&W).
4. [ ] Crear componente `<LowCreditsAlert />` (Inline, B&W).
5. [ ] Integrar `<CreditsUsageCard />` en `settings/profile` y `settings/organization`.
6. [ ] Implementar lógica de bloqueo y alerta en `RFXUpdateChatPanel` (arriba del input).
7. [ ] Implementar lógica de bloqueo y alerta en `ProposalGenerator` (debajo del botón).
