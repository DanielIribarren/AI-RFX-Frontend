# RFX Frontend: Analisis UI/UX y Roadmap Agentic

## 1) Objetivo
Definir un plan claro para mejorar consistencia visual, experiencia de uso y retencion, migrando de una experiencia "caja negra" a una experiencia "agente visible" (thinking, tool execution, resultados interactivos), reutilizando `shadcn` y el branding actual.

## 2) Alcance de este documento
- Diagnostico actual del frontend.
- Problemas de UI/UX que impactan retencion.
- Arquitectura UX objetivo (Agentic UI) adaptada a RFX.
- Roadmap por fases con entregables y riesgos.
- KPI de producto para medir impacto real.

## 3) Evidencia del estado actual (codebase)

### 3.1 Inconsistencia visual y de tokens
- Script ejecutado: `node scripts/analyze-hardcoded-styles.js`
- Resultado actual:
  - `155` archivos analizados
  - `85` archivos con issues
  - `271` ocurrencias de colores hardcoded
  - `140` valores arbitrarios
  - `245` patrones repetidos sin utilidad/componente
- Top archivos con mayor deuda:
  - `components/marketing/LandingPage.tsx`
  - `app/(workspace)/product-inventory/page.tsx`
  - `components/layout/AppSidebar.tsx`
  - `components/features/products/ProductTable.tsx`
  - `components/features/rfx/ProcessedFilesContent.tsx`

### 3.2 Inconsistencia de idioma y tono (ES/EN mezclado)
Se detecta mezcla de copy en flujos principales:
- Login/Signup en ingles (`Sign In`, `Back`, `Loading...`).
- Workspace y errores mayormente en espanol.
- Sidebar y estados mezclados (`Today`, `Yesterday`, `Delete error`).

Impacto: sensacion de producto no unificado y menor percepcion de calidad.

### 3.3 UX transaccional y no agentica
Hay muchos `alert()`, `window.confirm()` y mensajes bloqueantes en flujos clave:
- Procesamiento RFX
- Guardado de costos
- Finalizacion
- Descarga de propuesta

Impacto:
- Interacciones abruptas y poco modernas.
- Baja continuidad del flujo.
- Sensacion de "app de utileria", no "copiloto inteligente".

### 3.4 Poca visibilidad del trabajo del agente
Actualmente se muestra progreso basico de carga, pero no una narrativa clara de:
- Que esta pensando el agente.
- Que herramientas esta ejecutando.
- Que cambios aplico y por que.

Impacto en retencion: el usuario solo ve resultado final, no percibe "esfuerzo inteligente".

### 3.5 Ruido tecnico en produccion UX
Hay alto volumen de `console.log` en componentes y APIs del frontend, incluidos flujos de usuario.

Impacto:
- Dificulta observabilidad util.
- Senal de capa de experiencia no consolidada.

## 4) Problema de producto (retencion)
La app agrega valor funcional, pero la experiencia no comunica:
- progreso confiable,
- razonamiento operativo,
- control interactivo posterior al resultado.

Esto reduce el "hook": el usuario siente que ejecuto una tarea puntual, no que trabajo con un agente continuo.

## 5) Arquitectura UX objetivo (Agentic UI para RFX)

## 5.1 Regla de 3 estados (base)
1. `Thinking State`: panel colapsable con pasos del analisis.
2. `Execution State`: feed de herramientas/acciones en vivo (badges + timeline).
3. `Result State`: artefacto editable (tabla, propuesta, resumen de cambios).

## 5.2 Componentes nuevos (sobre shadcn)
Implementar componentes reutilizables:
- `AgentRunPanel`
  - Header con estado global (`thinking`, `executing`, `needs_review`, `done`).
  - Tiempo transcurrido.
- `ThinkingTrace`
  - Lista de pasos resumidos (no chain-of-thought sensible).
- `ToolExecutionFeed`
  - Eventos tipo: "Extrayendo PDF", "Validando productos", "Calculando margenes".
  - Badge por estado (`pending`, `running`, `success`, `error`).
- `ResultArtifacts`
  - Panel derecho con:
    - Cambios aplicados
    - Tabla editable
    - Vista de propuesta/preview
- `MemoryContextCard`
  - "Aprendido en sesiones anteriores" (si existe backend/contexto).

## 5.3 Patrones de interaccion
- Reemplazar `alert()` por `AlertDialog`, `Toast`, `InlineStatus`.
- Reemplazar `window.confirm()` por `AlertDialog` con copy claro.
- Mostrar "aplicando cambios..." en contexto del componente afectado, no modal global.
- Mantener actividad visible en sidebar o header de ejecucion.

## 6) Mapa de implementacion por area

### 6.1 Flujo Dashboard -> RFX Process
Archivos:
- `app/(workspace)/dashboard/page.tsx`
- `components/features/rfx/RFXChatInput.tsx`

Cambios:
- Integrar `AgentRunPanel` durante `processRFX`.
- Mostrar milestones de proceso.
- Remover alerts de error en favor de estado inline + acciones de reintento.

### 6.2 Flujo Resultados / Data / Budget
Archivos:
- `components/features/rfx/RFXResultsWrapperV2.tsx`
- `components/features/rfx/RFXDataView.tsx`
- `app/(workspace)/rfx-result-wrapper-v2/data/[id]/page.tsx`
- `app/(workspace)/rfx-result-wrapper-v2/budget/[id]/page.tsx`

Cambios:
- Insertar `ToolExecutionFeed` para operaciones de chat/actualizacion.
- Convertir respuestas de chat en "change cards" auditables.
- Mantener panel de ejecucion persistente y colapsable.

### 6.3 Sidebar / Historial
Archivos:
- `components/layout/AppSidebar.tsx`
- `components/features/rfx/RFXHistory.tsx`

Cambios:
- Unificar idioma de estado/fecha.
- Sustituir confirmaciones nativas por dialogos consistentes.
- Anadir estado de actividad reciente del agente por RFX (ultimo run).

### 6.4 Auth y entrada de producto
Archivos:
- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`

Cambios:
- Unificar lenguaje (recomendado: espanol en toda app, o estrategia i18n formal).
- Homologar feedback de carga/error con tokens de diseno.

## 7) Roadmap de ejecucion

### Fase 0 (1 semana): Baseline UX + consistencia minima
- Definir diccionario de copy (ES unico en MVP).
- Eliminar `alert()`/`confirm()` de flujos core.
- Reducir logs no esenciales en UI.
- Entregable: UX estable y coherente.

### Fase 1 (1-2 semanas): Agentic Core UI
- Implementar `AgentRunPanel`, `ThinkingTrace`, `ToolExecutionFeed`.
- Integrar en flujo de proceso inicial y chat update.
- Entregable: usuario ve progreso real por etapas.

### Fase 2 (1-2 semanas): Artifacts + control
- Implementar panel lateral de artefactos editables.
- Mostrar "cambios aplicados" con diff simple.
- Entregable: pasar de "respuesta texto" a "resultado interactivo".

### Fase 3 (1 semana): Design hardening
- Refactor de tokens en top 10 archivos con mayor deuda visual.
- Consolidar utilidades CSS/componente para patrones repetidos.
- Entregable: UI consistente y mantenible.

### Fase 4 (continuo): Medicion y optimizacion
- Instrumentar eventos de producto para retencion.
- Iterar sobre fricciones de onboarding, tiempo a primer valor y finalizacion.

## 8) KPI de exito (retencion y UX)
- `Activation`: % usuarios que completan primer RFX + abren resultado.
- `Time to First Value`: tiempo desde upload hasta primer artefacto usable.
- `Interaction Depth`: promedio de acciones post-resultado (editar, confirmar, descargar).
- `Return Rate D7/D30`: retencion por cohorte.
- `Error Recovery Rate`: % errores recuperados sin abandono.

## 9) Riesgos y dependencias
- Para un feed realmente "en vivo", idealmente backend debe exponer eventos de ejecucion (SSE/WebSocket o polling por etapas).
- Si backend aun no emite eventos granulares, fase inicial puede simular etapas con hitos del frontend y eventos de API.
- Debe evitarse exponer razonamiento sensible; mostrar solo trazas utiles y seguras.

## 10) Propuesta de decision tecnica inmediata
1. Aprobar este roadmap como plan base.
2. Ejecutar Fase 0 + inicio de Fase 1 sobre flujo principal:
   - `dashboard`
   - `RFXChatInput`
   - `RFXResultsWrapperV2`
3. Establecer guideline obligatorio:
   - Sin `alert()`/`confirm()` en nuevas features.
   - Sin hardcoded colors fuera de excepciones documentadas.
   - Copy consistente por idioma objetivo.

## 11) Resultado esperado
Pasar de una app "funcional pero opaca" a una experiencia de agente visible, confiable e interactivo, donde el usuario:
- entiende que esta haciendo la IA,
- siente control sobre los cambios,
- y percibe valor continuo (no solo una respuesta puntual).
