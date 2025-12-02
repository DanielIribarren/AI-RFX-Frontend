# 🎨 DOCUMENTACIÓN FRONTEND - CHAT CONVERSACIONAL RFX
## Actualización en Tiempo Real con IA

**Proyecto:** AI-RFX Frontend  
**Feature:** Panel de Chat Conversacional para Actualización de RFX  
**Fecha:** Diciembre 1, 2025  
**Versión:** 1.0  
**Filosofía:** AI-FIRST + KISS + Real-time Updates

---

## 📋 TABLA DE CONTENIDOS

1. [Visión General](#visión-general)
2. [Principios de Diseño](#principios-de-diseño)
3. [Flujo de Interacción](#flujo-de-interacción)
4. [Arquitectura de Componentes](#arquitectura-de-componentes)
5. [Componentes Detallados](#componentes-detallados)
6. [Estados y Transiciones](#estados-y-transiciones)
7. [Integración con Backend](#integración-con-backend)
8. [Casos de Uso](#casos-de-uso)
9. [Especificaciones Técnicas](#especificaciones-técnicas)

---

## 🎯 VISIÓN GENERAL

### ¿Qué es?

Un **panel de chat conversacional** que permite a los usuarios actualizar RFX mediante lenguaje natural, similar a V0 o Lovable, donde:

- ✅ Usuario escribe lo que quiere cambiar
- ✅ IA entiende la intención y aplica cambios
- ✅ Cambios se reflejan **en tiempo real** en la vista principal
- ✅ Sin lógica hardcoded, todo manejado por IA
- ✅ Historial de conversación persistido en BD

### ¿Por qué?

**Problema actual:**
- Editar RFX requiere múltiples clicks y formularios
- No es intuitivo para usuarios no técnicos
- Cambios complejos son difíciles de realizar

**Solución:**
- "Agrega 20 refrescos" → IA lo hace
- "Cambia la fecha a mañana" → IA lo hace
- "El cliente envió un nuevo archivo con cambios" → IA lo procesa

---

## 🏛️ PRINCIPIOS DE DISEÑO

### 1. AI-FIRST (No Hardcoded Logic)

```typescript
// ❌ MAL: Lógica hardcoded
if (message.includes("agregar")) {
  // Parsear manualmente...
  addProduct(...)
}

// ✅ BIEN: IA decide qué hacer
const response = await api.chat.send({
  message: userMessage,
  rfxContext: currentRFX
})
// IA retorna: { action: "add_product", data: {...}, confidence: 0.95 }
```

**Principio:** La IA es el cerebro, el frontend solo ejecuta y muestra resultados.

### 2. KISS (Keep It Simple)

**Componente único inicial:**
- `RFXUpdateChatPanel.tsx` - Todo en uno
- No crear abstracciones prematuras
- Si crece, refactorizar después

**Estado mínimo:**
```typescript
{
  isOpen: boolean,
  messages: Message[],
  isTyping: boolean
}
```

### 3. Real-time Updates (Como V0/Lovable)

**Flujo:**
```
Usuario escribe → IA procesa → Cambios se aplican → UI se actualiza automáticamente
                                                    ↓
                                            Sin recargar página
                                            Sin confirmación manual
                                            Con visual feedback
```

### 4. Observabilidad

Cada interacción debe ser trazable:
- ¿Qué pidió el usuario?
- ¿Qué entendió la IA?
- ¿Qué cambios se aplicaron?
- ¿Hubo errores?

---

## 🔄 FLUJO DE INTERACCIÓN

### Flujo Principal (Happy Path)

```
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: Usuario abre RFX                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ RFX: Sofia elena catering                                   │ │
│ │ [Datos] [Presupuesto] [💬 Actualizar RFX]                   │ │
│ │                          ↑                                   │ │
│ │                    Botón visible                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

                            ↓ Click

┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: Panel se desliza desde la derecha (300ms animation)     │
│ ┌───────────────────────┐┌──────────────────────────────────┐  │
│ │ Contenido RFX (70%)   ││ 💬 Chat Panel (30%)         [X] │  │
│ │                       ││ ─────────────────────────────────│  │
│ │ Productos:            ││                                  │  │
│ │ 1. Pasos salados (50) ││ 💡 ¡Hola! Soy tu asistente.     │  │
│ │ 2. Café (20)          ││                                  │  │
│ │                       ││ Puedes pedirme:                  │  │
│ │                       ││ • Agregar productos              │  │
│ │                       ││ • Modificar cantidades           │  │
│ │                       ││ • Cambiar datos                  │  │
│ │                       ││ • Procesar archivos              │  │
│ │                       ││                                  │  │
│ │                       ││ ┌──────────────────────────────┐ │  │
│ │                       ││ │ 📎 Escribe tu mensaje...     │ │  │
│ │                       ││ └──────────────────────────────┘ │  │
│ └───────────────────────┘└──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

                            ↓ Usuario escribe

┌─────────────────────────────────────────────────────────────────┐
│ PASO 3: Usuario envía mensaje                                   │
│ ┌───────────────────────┐┌──────────────────────────────────┐  │
│ │ Contenido RFX         ││ 💬 Chat Panel               [X] │  │
│ │                       ││ ─────────────────────────────────│  │
│ │ Productos:            ││                                  │  │
│ │ 1. Pasos salados (50) ││              Usuario    11:50 AM │  │
│ │ 2. Café (20)          ││    ┌──────────────────────────┐  │  │
│ │                       ││    │ Agregar 20 refrescos    │  │  │
│ │                       ││    └──────────────────────────┘  │  │
│ │                       ││                                  │  │
│ │                       ││ Agente IA                        │  │
│ │                       ││ ┌────────────────────────────┐   │  │
│ │                       ││ │ ⏳ Analizando solicitud... │   │  │
│ │                       ││ │ ● ● ●                      │   │  │
│ │                       ││ └────────────────────────────┘   │  │
│ └───────────────────────┘└──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

                            ↓ IA procesa (1-3 segundos)

┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: IA responde + Cambios se aplican en tiempo real         │
│ ┌───────────────────────┐┌──────────────────────────────────┐  │
│ │ Contenido RFX         ││ 💬 Chat Panel               [X] │  │
│ │                       ││ ─────────────────────────────────│  │
│ │ Productos:            ││              Usuario    11:50 AM │  │
│ │ 1. Pasos salados (50) ││    ┌──────────────────────────┐  │  │
│ │ 2. Café (20)          ││    │ Agregar 20 refrescos    │  │  │
│ │ 3. Refrescos (20) 🆕  ││    └──────────────────────────┘  │  │
│ │    ↑                  ││                                  │  │
│ │    └─ Glow animation  ││ Agente IA            11:50 AM    │  │
│ │       2 segundos      ││ ┌────────────────────────────┐   │  │
│ │                       ││ │ ✅ ¡Listo! He agregado:   │   │  │
│ │ Total: $290 → $340    ││ │                           │   │  │
│ │        ↑              ││ │ 📦 Refrescos variados     │   │  │
│ │        └─ Actualizado ││ │    20 unidades            │   │  │
│ │                       ││ │    $2.50 c/u              │   │  │
│ │                       ││ │                           │   │  │
│ │                       ││ │ 💰 Total: $290 → $340     │   │  │
│ │                       ││ │                           │   │  │
│ │                       ││ │ ¿Algo más?                │   │  │
│ │                       ││ └────────────────────────────┘   │  │
│ │                       ││                                  │  │
│ │                       ││ 👁️ Ver cambios aplicados         │  │
│ └───────────────────────┘└──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo con Confirmación (Casos Ambiguos)

```
Usuario: "Agregar pasos salados"
         ↓
IA detecta: Ya existe "Pasos salados variados (50)"
         ↓
┌────────────────────────────────────────────────┐
│ Agente IA                          11:51 AM    │
│ ┌──────────────────────────────────────────┐   │
│ │ ⚠️ Encontré un producto similar:         │   │
│ │                                          │   │
│ │ Ya existe:                               │   │
│ │ • Pasos salados variados (50 unidades)   │   │
│ │                                          │   │
│ │ ¿Qué deseas hacer?                       │   │
│ │                                          │   │
│ │ ┌────────────────────────────────────┐   │   │
│ │ │ 1️⃣ Aumentar cantidad a 100 ⭐     │   │   │
│ │ └────────────────────────────────────┘   │   │
│ │ ┌────────────────────────────────────┐   │   │
│ │ │ 2️⃣ Agregar como producto nuevo    │   │   │
│ │ └────────────────────────────────────┘   │   │
│ │ ┌────────────────────────────────────┐   │   │
│ │ │ 3️⃣ Cancelar                        │   │   │
│ │ └────────────────────────────────────┘   │   │
│ └──────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

**Cuándo pedir confirmación:**
- ✅ Productos duplicados/similares
- ✅ Cambios que afectan múltiples items
- ✅ Eliminaciones masivas
- ✅ Cambios de precio significativos (>20%)
- ❌ Cambios simples y claros (agregar nuevo producto único)

---

## 🔄 ACTUALIZACIÓN EN TIEMPO REAL

### Estrategia: Polling Optimista (Recomendado)

**Flujo completo:**

```
Usuario escribe: "Agregar 20 refrescos"
         ↓
[Frontend] POST /api/rfx/{id}/chat
         ↓
[Backend] IA procesa (1-2 segundos)
         ↓
[Backend] Retorna: { 
  message: "✅ Agregado...",
  changes: [{ type: "add_product", data: {...} }]
}
         ↓
[Frontend] Recibe response
         ↓
[Frontend] Llama onUpdate(changes)
         ↓
[RFXDataView] Actualiza estado React
         ↓
[React] Re-render automático
         ↓
[UI] Usuario ve cambio con glow animation ✨
```

### Implementación del Flujo

#### 1. Chat Panel envía mensaje y recibe cambios

```typescript
// RFXUpdateChatPanel.tsx

const handleSendMessage = async () => {
  // Agregar mensaje del usuario
  setMessages(prev => [...prev, userMessage])
  
  // Llamar al backend
  const response = await api.chat.send({
    rfxId,
    message: inputValue,
    context: rfxData // Contexto actual del RFX
  })
  
  // Agregar respuesta de IA
  setMessages(prev => [...prev, assistantMessage])
  
  // ⭐ APLICAR CAMBIOS INMEDIATAMENTE
  if (response.changes && !response.requiresConfirmation) {
    onUpdate(response.changes) // Callback al parent
  }
}
```

#### 2. Parent Component aplica cambios en estado

```typescript
// rfx-data-view.tsx

export default function RFXDataView({...props}) {
  const [productos, setProductos] = useState(initialProductos)
  const [rfxData, setRfxData] = useState(initialData)
  
  // ⭐ Callback que recibe cambios del chat
  const handleChatUpdate = (changes: RFXChange[]) => {
    changes.forEach(change => {
      switch (change.type) {
        case "add_product":
          // Agregar producto inmediatamente
          setProductos(prev => [...prev, {
            id: crypto.randomUUID(),
            ...change.data,
            isNew: true // Flag para glow animation
          }])
          
          // Remover flag después de 2 segundos
          setTimeout(() => {
            setProductos(prev => 
              prev.map(p => ({ ...p, isNew: false }))
            )
          }, 2000)
          break
          
        case "update_product":
          // Actualizar producto existente
          setProductos(prev => 
            prev.map(p => 
              p.id === change.target 
                ? { ...p, ...change.data, isModified: true }
                : p
            )
          )
          break
          
        case "delete_product":
          // Eliminar producto
          setProductos(prev => 
            prev.filter(p => p.id !== change.target)
          )
          break
          
        case "update_field":
          // Actualizar campo del RFX (fecha, lugar, etc)
          setRfxData(prev => ({
            ...prev,
            [change.target]: change.data.newValue
          }))
          break
      }
    })
    
    // Recalcular total
    updateTotal()
  }
  
  return (
    <div className="flex">
      {/* Vista principal */}
      <div className={isChatOpen ? "w-[70%]" : "w-full"}>
        <ProductTable productos={productos} />
      </div>
      
      {/* Chat panel */}
      <RFXUpdateChatPanel
        isOpen={isChatOpen}
        rfxId={rfxId}
        rfxData={rfxData}
        onUpdate={handleChatUpdate} // ⭐ Callback
      />
    </div>
  )
}
```

#### 3. UI muestra cambios con visual feedback

```typescript
// ProductTable.tsx

function ProductRow({ producto }: { producto: Product }) {
  return (
    <tr className={cn(
      "transition-all duration-300",
      producto.isNew && "animate-glow", // ⭐ Glow para nuevos
      producto.isModified && "bg-yellow-50" // Highlight para modificados
    )}>
      <td>
        {producto.nombre}
        {producto.isNew && <Badge className="ml-2">🆕 Nuevo</Badge>}
      </td>
      <td>{producto.cantidad}</td>
      <td>{formatPrice(producto.precio)}</td>
    </tr>
  )
}

// globals.css
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    background-color: transparent;
  }
  50% {
    box-shadow: 0 0 20px 5px rgba(59, 130, 246, 0.3);
    background-color: rgba(59, 130, 246, 0.1);
  }
}

.animate-glow {
  animation: glow 2s ease-in-out;
}
```

### Ventajas de este Approach

1. **✅ Instantáneo:** Usuario ve cambio inmediatamente (no espera)
2. **✅ Simple:** No requiere WebSockets ni infraestructura compleja
3. **✅ Confiable:** Request/Response tradicional, fácil de debuggear
4. **✅ Visual Feedback:** Glow animation indica qué cambió
5. **✅ Optimista:** Asumimos que IA validó correctamente

### Manejo de Errores

```typescript
const handleChatUpdate = async (changes: RFXChange[]) => {
  // 1. Guardar estado anterior (para rollback)
  const previousState = { productos, rfxData }
  
  // 2. Aplicar cambios optimísticamente
  applyChangesOptimistically(changes)
  
  try {
    // 3. Confirmar con backend (guardar en BD)
    await api.rfx.saveChanges(rfxId, changes)
  } catch (error) {
    // 4. Si falla, revertir al estado anterior
    setProductos(previousState.productos)
    setRfxData(previousState.rfxData)
    
    // 5. Notificar al usuario
    toast.error("Error al guardar cambios. Se revirtieron los cambios.")
    
    // 6. Log para debugging
    logger.error("Failed to save changes", error, { changes })
  }
}
```

### Alternativas (Para Futuro)

#### WebSockets (Si necesitas streaming)

```typescript
// Para respuestas de IA en streaming (como ChatGPT)
const ws = new WebSocket(`ws://backend/rfx/${rfxId}/chat`)

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  
  if (data.type === "token") {
    // IA escribiendo en tiempo real
    appendToLastMessage(data.token)
  }
  
  if (data.type === "change") {
    // Aplicar cambio inmediatamente
    onUpdate([data.change])
  }
}
```

**Cuándo usar WebSockets:**
- ⚠️ Solo si necesitas streaming de respuestas
- ⚠️ Requiere infraestructura adicional
- ⚠️ Más complejo de debuggear
- ✅ Mejor UX para respuestas largas

**Recomendación:** Empezar con Polling, migrar a WebSockets solo si es necesario.

---

## 🏗️ ARQUITECTURA DE COMPONENTES

### Estructura de Carpetas

```
components/
└── rfx-update-chat/
    ├── RFXUpdateChatPanel.tsx       # Componente principal (todo en uno)
    ├── types.ts                     # Tipos TypeScript
    └── utils.ts                     # Helpers (formateo, validación)
```

### Integración en RFXDataView

```typescript
// rfx-data-view.tsx

import RFXUpdateChatPanel from "@/components/rfx-update-chat/RFXUpdateChatPanel"

export default function RFXDataView({...props}) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  
  return (
    <div className="relative">
      {/* Header con botón */}
      <div className="flex items-center gap-2">
        <Tabs>
          <TabsList>
            <TabsTrigger value="datos">Datos</TabsTrigger>
            <TabsTrigger value="presupuesto">Presupuesto</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Botón Actualizar RFX */}
        <Button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          variant={isChatOpen ? "secondary" : "default"}
        >
          💬 Actualizar RFX
        </Button>
      </div>
      
      {/* Contenido principal */}
      <div className={cn(
        "transition-all duration-300",
        isChatOpen ? "w-[70%]" : "w-full"
      )}>
        {/* Contenido del RFX */}
      </div>
      
      {/* Panel de Chat */}
      <RFXUpdateChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        rfxId={rfxId}
        onUpdate={(changes) => {
          // Aplicar cambios en tiempo real
          applyChanges(changes)
        }}
      />
    </div>
  )
}
```

---

## 📦 COMPONENTES DETALLADOS

### 1. RFXUpdateChatPanel.tsx

**Responsabilidad:** Panel completo de chat conversacional

```typescript
// components/rfx-update-chat/RFXUpdateChatPanel.tsx

"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, Minimize2, Maximize2, Paperclip, Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import type { ChatMessage, RFXChange, ChatResponse } from "./types"

interface RFXUpdateChatPanelProps {
  isOpen: boolean
  onClose: () => void
  rfxId: string
  rfxData: any // Contexto completo del RFX
  onUpdate: (changes: RFXChange[]) => void
}

export default function RFXUpdateChatPanel({
  isOpen,
  onClose,
  rfxId,
  rfxData,
  onUpdate
}: RFXUpdateChatPanelProps) {
  // ==================== ESTADO ====================
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ==================== EFECTOS ====================
  
  // Cargar historial de conversación al abrir
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory()
    }
  }, [isOpen, rfxId])

  // Auto-scroll al último mensaje
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus en textarea al abrir
  useEffect(() => {
    if (isOpen && !isMinimized) {
      textareaRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  // ==================== FUNCIONES ====================

  const loadChatHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const history = await api.chat.getHistory(rfxId)
      
      if (history.length === 0) {
        // Mensaje de bienvenida si no hay historial
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: `¡Hola! Soy tu asistente de actualización de RFX.

Puedes pedirme:
• Agregar productos nuevos
• Modificar cantidades o precios
• Cambiar fecha, lugar o cliente
• Eliminar productos
• Procesar archivos con cambios

Escribe tu solicitud abajo ↓`,
          timestamp: new Date().toISOString(),
          metadata: { type: "welcome" }
        }])
      } else {
        setMessages(history)
      }
    } catch (error) {
      console.error("Error loading chat history:", error)
      // Mostrar mensaje de bienvenida por defecto
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "¡Hola! ¿En qué puedo ayudarte con este RFX?",
        timestamp: new Date().toISOString()
      }])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachedFiles.length === 0) return
    if (isTyping) return

    // Crear mensaje del usuario
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
      files: attachedFiles.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      }))
    }

    // Agregar mensaje del usuario inmediatamente
    setMessages(prev => [...prev, userMessage])
    
    // Limpiar input
    const messageToSend = inputValue.trim()
    const filesToSend = [...attachedFiles]
    setInputValue("")
    setAttachedFiles([])
    
    // Mostrar indicador de "typing"
    setIsTyping(true)

    try {
      // Llamar al backend (IA procesa)
      const response: ChatResponse = await api.chat.send({
        rfxId,
        message: messageToSend,
        files: filesToSend,
        context: {
          current_products: rfxData.productos,
          current_total: rfxData.total,
          delivery_date: rfxData.fechaEntrega,
          delivery_location: rfxData.lugarEntrega,
          client_name: rfxData.solicitante,
          client_email: rfxData.emailSolicitante
        }
      })

      // Agregar respuesta de la IA
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.message,
        timestamp: new Date().toISOString(),
        metadata: {
          confidence: response.confidence,
          changes: response.changes,
          requiresConfirmation: response.requiresConfirmation,
          options: response.options
        }
      }

      setMessages(prev => [...prev, assistantMessage])

      // Si hay cambios y no requiere confirmación, aplicarlos
      if (response.changes && !response.requiresConfirmation) {
        onUpdate(response.changes)
      }

    } catch (error) {
      console.error("Error sending message:", error)
      
      // Mensaje de error
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `❌ Lo siento, ocurrió un error al procesar tu solicitud.

${error instanceof Error ? error.message : "Error desconocido"}

Por favor, intenta de nuevo o reformula tu solicitud.`,
        timestamp: new Date().toISOString(),
        metadata: { type: "error" }
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleOptionClick = async (option: any) => {
    // Usuario seleccionó una opción de confirmación
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: option.label,
      timestamp: new Date().toISOString(),
      metadata: { selectedOption: option.value }
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      const response = await api.chat.confirmOption({
        rfxId,
        optionValue: option.value,
        context: option.context
      })

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.message,
        timestamp: new Date().toISOString(),
        metadata: {
          changes: response.changes
        }
      }

      setMessages(prev => [...prev, assistantMessage])

      // Aplicar cambios
      if (response.changes) {
        onUpdate(response.changes)
      }

    } catch (error) {
      console.error("Error confirming option:", error)
    } finally {
      setIsTyping(false)
    }
  }

  const handleFileAttach = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // ==================== RENDER ====================

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-full bg-white border-l shadow-lg",
        "transition-all duration-300 ease-in-out z-50",
        isOpen ? "translate-x-0" : "translate-x-full",
        isMinimized ? "w-[60px]" : "w-[30%] min-w-[400px]"
      )}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          {!isMinimized && (
            <h3 className="font-semibold text-gray-900">Actualizar RFX</h3>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0"
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* MESSAGES AREA */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-180px)]">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  onOptionClick={handleOptionClick}
                />
              ))
            )}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-2">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Analizando solicitud...
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="border-t p-4 bg-white">
            {/* Attached Files */}
            {attachedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1 text-xs"
                  >
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFileAttach}
                className="h-8 w-8 p-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.xlsx,.csv,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />

              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={isTyping}
              />

              <Button
                onClick={handleSendMessage}
                disabled={(!inputValue.trim() && attachedFiles.length === 0) || isTyping}
                className="h-8 w-8 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-gray-500 mt-2">
              Enter para enviar, Shift+Enter para nueva línea
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// ==================== COMPONENTE DE MENSAJE ====================

interface ChatMessageComponentProps {
  message: ChatMessage
  onOptionClick?: (option: any) => void
}

function ChatMessageComponent({ message, onOptionClick }: ChatMessageComponentProps) {
  const isUser = message.role === "user"
  const isWelcome = message.metadata?.type === "welcome"
  const isError = message.metadata?.type === "error"
  const hasOptions = message.metadata?.options && message.metadata.options.length > 0

  return (
    <div className={cn(
      "flex",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "rounded-lg p-3 max-w-[80%]",
        isUser && "bg-blue-600 text-white",
        !isUser && !isWelcome && !isError && "bg-gray-100 text-gray-900",
        isWelcome && "bg-blue-50 border border-blue-200 text-blue-900",
        isError && "bg-red-50 border border-red-200 text-red-900"
      )}>
        {/* Timestamp */}
        <div className={cn(
          "text-xs mb-1",
          isUser ? "text-blue-100" : "text-gray-500"
        )}>
          {isUser ? "Usuario" : "Agente IA"} • {formatTime(message.timestamp)}
        </div>

        {/* Content */}
        <div className="whitespace-pre-wrap text-sm">
          {message.content}
        </div>

        {/* Files */}
        {message.files && message.files.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.files.map((file, index) => (
              <div key={index} className="text-xs opacity-80">
                📎 {file.name} ({formatFileSize(file.size)})
              </div>
            ))}
          </div>
        )}

        {/* Options (Confirmación) */}
        {hasOptions && (
          <div className="mt-3 space-y-2">
            {message.metadata.options.map((option: any, index: number) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onOptionClick?.(option)}
                className="w-full justify-start text-left"
              >
                {option.emoji} {option.label}
              </Button>
            ))}
          </div>
        )}

        {/* Changes Applied */}
        {message.metadata?.changes && message.metadata.changes.length > 0 && (
          <div className="mt-2 text-xs opacity-80">
            ✅ {message.metadata.changes.length} cambio(s) aplicado(s)
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== HELPERS ====================

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit"
  })
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
```

---

### 2. types.ts

```typescript
// components/rfx-update-chat/types.ts

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  files?: {
    name: string
    size: number
    type: string
  }[]
  metadata?: {
    type?: "welcome" | "error" | "confirmation"
    confidence?: number
    changes?: RFXChange[]
    requiresConfirmation?: boolean
    options?: ConfirmationOption[]
  }
}

export interface RFXChange {
  type: "add_product" | "update_product" | "delete_product" | "update_field"
  target: string // ID del producto o nombre del campo
  data: any
  description: string // Descripción legible del cambio
}

export interface ConfirmationOption {
  value: string
  label: string
  emoji: string
  context: any
}

export interface ChatResponse {
  message: string
  confidence: number
  changes?: RFXChange[]
  requiresConfirmation: boolean
  options?: ConfirmationOption[]
}

export interface ChatHistoryItem {
  id: string
  rfx_id: string
  user_message: string
  assistant_message: string
  changes_applied: RFXChange[]
  timestamp: string
  files?: any[]
}
```

---

## 🔄 ESTADOS Y TRANSICIONES

### Estados del Panel

```typescript
type PanelState = 
  | "closed"       // Panel no visible
  | "opening"      // Animación de apertura (300ms)
  | "open"         // Panel abierto y funcional
  | "minimized"    // Panel colapsado (solo header)
  | "closing"      // Animación de cierre (300ms)

type ChatState =
  | "idle"         // Esperando input del usuario
  | "typing"       // Usuario escribiendo
  | "sending"      // Enviando mensaje al backend
  | "processing"   // IA procesando (mostrar "typing...")
  | "applying"     // Aplicando cambios en UI
  | "error"        // Error en el proceso
```

### Transiciones de Estado

```
┌─────────┐
│ closed  │
└────┬────┘
     │ Click "Actualizar RFX"
     ↓
┌─────────┐
│ opening │ (300ms animation)
└────┬────┘
     ↓
┌─────────┐     Click "Minimizar"      ┌───────────┐
│  open   │ ←────────────────────────→ │ minimized │
└────┬────┘                            └───────────┘
     │ Click "Cerrar" o Esc
     ↓
┌─────────┐
│ closing │ (300ms animation)
└────┬────┘
     ↓
┌─────────┐
│ closed  │
└─────────┘
```

### Flujo de Mensaje

```
┌──────┐  Usuario escribe + Enter  ┌─────────┐
│ idle │ ───────────────────────→  │ sending │
└──────┘                            └────┬────┘
                                         │ API call
                                         ↓
                                    ┌────────────┐
                                    │ processing │ (Mostrar "typing...")
                                    └─────┬──────┘
                                          │ Response recibida
                                          ↓
                                    ┌──────────┐
                                    │ applying │ (Aplicar cambios)
                                    └────┬─────┘
                                         │ Cambios aplicados
                                         ↓
                                    ┌──────┐
                                    │ idle │ (Listo para nuevo mensaje)
                                    └──────┘
```

---

## 🔌 INTEGRACIÓN CON BACKEND

### Endpoints Requeridos

#### 1. Enviar Mensaje al Chat

```typescript
POST /api/rfx/{rfx_id}/chat

// Request
{
  message: string,
  files?: File[],
  context: {
    currentProducts: Product[],
    currentTotal: number,
    deliveryDate: string,
    location: string,
    client: string
  }
}

// Response
{
  message: string,                    // Respuesta de la IA
  confidence: number,                 // 0.0 - 1.0
  changes?: RFXChange[],             // Cambios a aplicar
  requiresConfirmation: boolean,      // ¿Necesita confirmación?
  options?: ConfirmationOption[]      // Opciones si requiere confirmación
}
```

**Ejemplo Request:**
```json
{
  "message": "Agregar 20 refrescos",
  "context": {
    "currentProducts": [
      { "id": "1", "nombre": "Pasos salados", "cantidad": 50, "precio": 5.0 },
      { "id": "2", "nombre": "Café", "cantidad": 20, "precio": 2.0 }
    ],
    "currentTotal": 290.0,
    "deliveryDate": "2025-12-05",
    "location": "Oficina Central",
    "client": "Sofia Elena"
  }
}
```

**Ejemplo Response (Sin Confirmación):**
```json
{
  "message": "✅ ¡Listo! He agregado:\n\n📦 Refrescos variados\n   20 unidades\n   $2.50 c/u\n\n💰 Total actualizado: $290 → $340\n\n¿Necesitas algo más?",
  "confidence": 0.95,
  "changes": [
    {
      "type": "add_product",
      "target": "new",
      "data": {
        "nombre": "Refrescos variados",
        "cantidad": 20,
        "precio": 2.50,
        "unidad": "unidades"
      },
      "description": "Agregado: Refrescos variados (20 unidades)"
    }
  ],
  "requiresConfirmation": false
}
```

**Ejemplo Response (Con Confirmación):**
```json
{
  "message": "⚠️ Encontré un producto similar:\n\nYa existe:\n• Pasos salados variados (50 unidades)\n\n¿Qué deseas hacer?",
  "confidence": 0.75,
  "requiresConfirmation": true,
  "options": [
    {
      "value": "increase_quantity",
      "label": "Aumentar cantidad a 100",
      "emoji": "1️⃣",
      "context": {
        "productId": "1",
        "newQuantity": 100
      }
    },
    {
      "value": "add_new",
      "label": "Agregar como producto nuevo",
      "emoji": "2️⃣",
      "context": {
        "newProduct": {
          "nombre": "Pasos salados",
          "cantidad": 50,
          "precio": 5.0
        }
      }
    },
    {
      "value": "cancel",
      "label": "Cancelar",
      "emoji": "3️⃣",
      "context": null
    }
  ]
}
```

#### 2. Confirmar Opción

```typescript
POST /api/rfx/{rfx_id}/chat/confirm

// Request
{
  optionValue: string,
  context: any
}

// Response
{
  message: string,
  changes: RFXChange[]
}
```

#### 3. Obtener Historial de Chat

```typescript
GET /api/rfx/{rfx_id}/chat/history

// Response
{
  messages: ChatMessage[]
}
```

#### 4. Guardar Mensaje en Historial

```typescript
POST /api/rfx/{rfx_id}/chat/history

// Request
{
  userMessage: string,
  assistantMessage: string,
  changesApplied: RFXChange[],
  files?: any[]
}

// Response
{
  success: boolean,
  messageId: string
}
```

### Estructura de RFXChange

```typescript
// Agregar Producto
{
  type: "add_product",
  target: "new",
  data: {
    nombre: string,
    cantidad: number,
    precio: number,
    unidad: string,
    costo_unitario?: number
  },
  description: "Agregado: Refrescos (20 unidades)"
}

// Actualizar Producto
{
  type: "update_product",
  target: "product_id_123",
  data: {
    cantidad?: number,
    precio?: number,
    nombre?: string
  },
  description: "Actualizado: Pasos salados - cantidad 50 → 100"
}

// Eliminar Producto
{
  type: "delete_product",
  target: "product_id_456",
  data: null,
  description: "Eliminado: Café (20 unidades)"
}

// Actualizar Campo del RFX
{
  type: "update_field",
  target: "fechaEntrega",
  data: {
    oldValue: "2025-12-05",
    newValue: "2025-12-06"
  },
  description: "Fecha de entrega actualizada: 5 dic → 6 dic"
}
```

---

## 🎯 CASOS DE USO

### Caso 1: Agregar Producto Simple

**Usuario:** "Agregar 20 refrescos"

**Flujo:**
1. Frontend envía mensaje + contexto al backend
2. IA analiza: intención = agregar producto
3. IA genera cambio: `add_product` con datos del producto
4. Backend retorna respuesta con cambio
5. Frontend aplica cambio inmediatamente
6. UI muestra producto nuevo con glow animation

**Código de Aplicación:**
```typescript
function applyChanges(changes: RFXChange[]) {
  changes.forEach(change => {
    switch (change.type) {
      case "add_product":
        // Agregar producto a la lista
        setProductos(prev => [...prev, {
          id: crypto.randomUUID(),
          ...change.data,
          isNew: true // Para glow animation
        }])
        
        // Actualizar total
        updateTotal()
        
        // Highlight temporal
        setTimeout(() => {
          removeNewFlag(change.data.nombre)
        }, 2000)
        break
        
      // ... otros casos
    }
  })
}
```

### Caso 2: Modificar Cantidad

**Usuario:** "Cambiar pasos salados a 100"

**Flujo:**
1. IA identifica producto por nombre
2. IA genera cambio: `update_product` con nueva cantidad
3. Frontend actualiza cantidad en la tabla
4. Highlight en la fila modificada

### Caso 3: Producto Duplicado (Requiere Confirmación)

**Usuario:** "Agregar pasos salados"

**Flujo:**
1. IA detecta producto similar existente
2. IA retorna `requiresConfirmation: true` con opciones
3. Frontend muestra botones de opción en el mensaje
4. Usuario selecciona opción
5. Frontend envía confirmación al backend
6. IA aplica acción seleccionada

### Caso 4: Cambiar Fecha de Entrega

**Usuario:** "Cambiar la fecha a mañana"

**Flujo:**
1. IA calcula fecha de mañana
2. IA genera cambio: `update_field` con nueva fecha
3. Frontend actualiza campo de fecha
4. Highlight temporal en el campo

### Caso 5: Eliminar Producto

**Usuario:** "Eliminar el café"

**Flujo:**
1. IA identifica producto por nombre
2. IA genera cambio: `delete_product`
3. Frontend muestra confirmación (opcional)
4. Frontend elimina producto de la lista
5. Actualiza total

### Caso 6: Procesar Archivo con Cambios

**Usuario:** Adjunta archivo + "El cliente envió esto con cambios"

**Flujo:**
1. Frontend envía archivo + mensaje
2. Backend procesa archivo con IA
3. IA extrae cambios del archivo
4. IA genera múltiples cambios
5. Frontend aplica todos los cambios
6. Muestra resumen de cambios aplicados

### Caso 7: Cambio Masivo

**Usuario:** "Aumentar todos los precios en 10%"

**Flujo:**
1. IA identifica todos los productos
2. IA calcula nuevos precios
3. IA genera múltiples `update_product` changes
4. Frontend pide confirmación (cambio masivo)
5. Usuario confirma
6. Frontend aplica todos los cambios
7. Highlight en todos los productos modificados

### Caso 8: Cambio Ambiguo

**Usuario:** "Agregar más comida"

**Flujo:**
1. IA detecta solicitud ambigua
2. IA retorna mensaje pidiendo clarificación
3. Frontend muestra mensaje de IA
4. Usuario clarifica: "20 empanadas"
5. IA procesa con información completa

---

## 🎨 ESPECIFICACIONES TÉCNICAS

### Animaciones

```css
/* Apertura del panel */
@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Glow effect para items nuevos */
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
  50% {
    box-shadow: 0 0 20px 5px rgba(59, 130, 246, 0.5);
  }
}

/* Typing dots animation */
@keyframes typingDots {
  0%, 20% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.3;
  }
}
```

### Responsive Breakpoints

```typescript
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200
}

// Panel width por breakpoint
const PANEL_WIDTH = {
  mobile: "100%",      // Fullscreen overlay
  tablet: "40%",       // 40% del ancho
  desktop: "30%"       // 30% del ancho
}

// Contenido width cuando panel está abierto
const CONTENT_WIDTH = {
  mobile: "0%",        // Oculto (panel fullscreen)
  tablet: "60%",       // 60% del ancho
  desktop: "70%"       // 70% del ancho
}
```

### Performance Optimizations

```typescript
// 1. Virtualización de mensajes (si hay muchos)
import { useVirtualizer } from '@tanstack/react-virtual'

// 2. Debounce en textarea
const debouncedSave = useMemo(
  () => debounce((value: string) => {
    // Auto-save draft
  }, 1000),
  []
)

// 3. Lazy load de historial
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['chat-history', rfxId],
  queryFn: ({ pageParam = 0 }) => api.chat.getHistory(rfxId, pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor
})

// 4. Optimistic updates
const applyChangeOptimistically = (change: RFXChange) => {
  // Aplicar cambio inmediatamente en UI
  updateUI(change)
  
  // Enviar al backend en background
  api.chat.applyChange(change).catch(() => {
    // Revertir si falla
    revertUI(change)
  })
}
```

### Accesibilidad

```typescript
// Keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Esc para cerrar
    if (e.key === "Escape" && isOpen) {
      onClose()
    }
    
    // Ctrl/Cmd + K para abrir
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault()
      setIsOpen(true)
    }
  }
  
  window.addEventListener("keydown", handleKeyDown)
  return () => window.removeEventListener("keydown", handleKeyDown)
}, [isOpen])

// ARIA labels
<div
  role="dialog"
  aria-labelledby="chat-title"
  aria-describedby="chat-description"
>
  <h3 id="chat-title">Actualizar RFX</h3>
  <p id="chat-description">
    Chat conversacional para actualizar tu RFX con IA
  </p>
</div>

// Focus trap
import { FocusTrap } from '@headlessui/react'

<FocusTrap active={isOpen}>
  {/* Panel content */}
</FocusTrap>
```

### Error Handling

```typescript
// Error boundaries
class ChatErrorBoundary extends React.Component {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Chat error:", error, errorInfo)
    // Log to monitoring service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <p className="text-red-600">
            ❌ Error en el chat. Por favor, recarga la página.
          </p>
          <Button onClick={() => window.location.reload()}>
            Recargar
          </Button>
        </div>
      )
    }
    
    return this.props.children
  }
}

// Network error handling
const handleNetworkError = (error: any) => {
  if (!navigator.onLine) {
    return "Sin conexión a internet. Verifica tu conexión."
  }
  
  if (error.status === 429) {
    return "Demasiadas solicitudes. Espera un momento."
  }
  
  if (error.status >= 500) {
    return "Error del servidor. Intenta de nuevo más tarde."
  }
  
  return "Error al procesar tu solicitud. Intenta de nuevo."
}
```

---

## 📊 MÉTRICAS Y OBSERVABILIDAD

### Eventos a Trackear

```typescript
// Analytics events
const trackChatEvent = (event: string, data: any) => {
  analytics.track(event, {
    rfx_id: rfxId,
    timestamp: new Date().toISOString(),
    ...data
  })
}

// Eventos importantes
trackChatEvent("chat_opened", { source: "button_click" })
trackChatEvent("message_sent", { 
  messageLength: message.length,
  hasFiles: files.length > 0,
  fileCount: files.length
})
trackChatEvent("ai_response_received", {
  confidence: response.confidence,
  hasChanges: response.changes?.length > 0,
  requiresConfirmation: response.requiresConfirmation,
  responseTime: Date.now() - startTime
})
trackChatEvent("changes_applied", {
  changeCount: changes.length,
  changeTypes: changes.map(c => c.type)
})
trackChatEvent("chat_closed", {
  messageCount: messages.length,
  sessionDuration: Date.now() - sessionStart
})
```

### Logs Estructurados

```typescript
const logger = {
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({
      level: "info",
      message,
      component: "RFXUpdateChat",
      rfxId,
      timestamp: new Date().toISOString(),
      ...data
    }))
  },
  
  error: (message: string, error: any, data?: any) => {
    console.error(JSON.stringify({
      level: "error",
      message,
      error: error.message,
      stack: error.stack,
      component: "RFXUpdateChat",
      rfxId,
      timestamp: new Date().toISOString(),
      ...data
    }))
  }
}

// Uso
logger.info("Chat opened", { source: "button_click" })
logger.error("Failed to send message", error, { message: userMessage })
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Componente Base (MVP)
- [ ] Crear estructura de carpetas
- [ ] Implementar `types.ts`
- [ ] Crear `RFXUpdateChatPanel.tsx` básico
- [ ] Integrar en `rfx-data-view.tsx`
- [ ] Implementar animación de apertura/cierre
- [ ] Implementar área de mensajes
- [ ] Implementar input con textarea
- [ ] Implementar envío de mensajes

### Fase 2: Funcionalidad Core
- [ ] Integrar con API de chat
- [ ] Implementar loading states
- [ ] Implementar error handling
- [ ] Implementar aplicación de cambios en tiempo real
- [ ] Implementar highlight de elementos modificados
- [ ] Implementar historial de conversación
- [ ] Implementar adjuntar archivos

### Fase 3: Confirmaciones y Opciones
- [ ] Implementar botones de opción en mensajes
- [ ] Implementar flujo de confirmación
- [ ] Implementar detección de casos ambiguos
- [ ] Implementar validación de cambios

### Fase 4: UX Enhancements
- [ ] Implementar minimizar panel
- [ ] Implementar scroll automático
- [ ] Implementar typing indicator
- [ ] Implementar timestamps
- [ ] Implementar formato de mensajes (markdown)
- [ ] Implementar preview de archivos adjuntos

### Fase 5: Performance y Accesibilidad
- [ ] Implementar virtualización de mensajes
- [ ] Implementar lazy loading de historial
- [ ] Implementar keyboard shortcuts
- [ ] Implementar ARIA labels
- [ ] Implementar focus trap
- [ ] Implementar responsive design

### Fase 6: Observabilidad
- [ ] Implementar analytics events
- [ ] Implementar logs estructurados
- [ ] Implementar error boundaries
- [ ] Implementar monitoring de performance

---

## 🚀 PRÓXIMOS PASOS

1. **Revisar y Aprobar Documentación**
   - ¿Falta algo?
   - ¿Algún cambio necesario?

2. **Documentar Backend** (siguiente paso)
   - Endpoints de API
   - Lógica del agente de IA
   - Persistencia de historial
   - Procesamiento de archivos

3. **Implementar Frontend**
   - Seguir checklist de implementación
   - Testing incremental
   - Iteración basada en feedback

4. **Implementar Backend**
   - Crear endpoints
   - Implementar agente de IA
   - Testing de integración

5. **Testing E2E**
   - Casos de uso reales
   - Performance testing
   - User acceptance testing

---

## 📝 NOTAS FINALES

### Principios a Mantener

1. **AI-FIRST:** La IA decide, el código ejecuta
2. **KISS:** Simple hasta que se demuestre que necesita complejidad
3. **Real-time:** Cambios instantáneos, feedback inmediato
4. **Observabilidad:** Todo debe ser trazable y debuggeable

### Decisiones de Diseño

- **Panel desde la derecha:** Sidebar izquierdo ya está ocupado
- **30% width en desktop:** Balance entre chat y contenido
- **Historial persistido:** Mejor UX, permite auditoría
- **Confirmación solo en ambiguos:** No molestar al usuario innecesariamente
- **Componente único inicial:** KISS, refactorizar si crece

### Referencias

- **V0.dev:** Inspiración para real-time updates
- **Lovable.dev:** Inspiración para UX conversacional
- **ChatGPT:** Referencia de interfaz de chat
- **Linear:** Referencia de panel lateral

---

**¿Listo para proceder con la documentación del backend?** 🚀
