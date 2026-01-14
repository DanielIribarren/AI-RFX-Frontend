# 🔔 Guía de Migración: Toast Notifications

Migración del componente custom `ToastNotification` a `sonner` de shadcn/ui.

---

## ✅ Cambios Implementados

### 1. Toaster Agregado al Layout Principal

**Archivo:** `app/layout.tsx`

```tsx
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster /> {/* ✅ Agregado */}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 2. Helper Creado

**Archivo:** `lib/toast.ts`

Proporciona funciones helper para usar sonner con una API simple:

```typescript
import { showSuccessToast, showErrorToast, showWarningToast } from "@/lib/toast"

// Uso simple
showSuccessToast({
  title: "Éxito",
  message: "Operación completada",
  duration: 4000 // opcional
})

showErrorToast({
  title: "Error",
  message: "Algo salió mal"
})
```

---

## 🔄 Cómo Migrar Componentes Existentes

### Antes (ToastNotification custom)

```tsx
import { ToastNotification, ToastType } from "@/components/toast-notification"

function MyComponent() {
  const [toast, setToast] = useState<{
    isOpen: boolean
    type: ToastType
    title: string
    message?: string
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  })

  const handleSuccess = () => {
    setToast({
      isOpen: true,
      type: "success",
      title: "RFX eliminado",
      message: "El RFX ha sido eliminado exitosamente",
    })
  }

  return (
    <>
      <button onClick={handleSuccess}>Eliminar</button>
      
      <ToastNotification
        isOpen={toast.isOpen}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
        type={toast.type}
        title={toast.title}
        message={toast.message}
      />
    </>
  )
}
```

### Después (sonner)

```tsx
import { showSuccessToast, showErrorToast } from "@/lib/toast"

function MyComponent() {
  const handleSuccess = () => {
    showSuccessToast({
      title: "RFX eliminado",
      message: "El RFX ha sido eliminado exitosamente",
    })
  }

  return (
    <button onClick={handleSuccess}>Eliminar</button>
  )
}
```

**Beneficios:**
- ✅ Sin estado local para el toast
- ✅ Sin componente JSX adicional
- ✅ Código más limpio (15 líneas → 5 líneas)
- ✅ API más simple

---

## 📋 Archivos a Migrar

### 1. app-sidebar.tsx

**Ubicación:** `components/app-sidebar.tsx`

**Cambios necesarios:**

```tsx
// ❌ ANTES
import { ToastNotification, ToastType } from "@/components/toast-notification"

const [toast, setToast] = useState<{
  isOpen: boolean
  type: ToastType
  title: string
  message?: string
}>({ isOpen: false, type: "success", title: "", message: "" })

// Mostrar toast
setToast({
  isOpen: true,
  type: "success",
  title: "RFX eliminado",
  message: `"${rfxTitle}" ha sido eliminado exitosamente`,
})

// JSX
<ToastNotification
  isOpen={toast.isOpen}
  onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
  type={toast.type}
  title={toast.title}
  message={toast.message}
/>

// ✅ DESPUÉS
import { showSuccessToast, showErrorToast } from "@/lib/toast"

// Mostrar toast
showSuccessToast({
  title: "RFX eliminado",
  message: `"${rfxTitle}" ha sido eliminado exitosamente`,
})

// Sin JSX adicional necesario
```

**Pasos:**
1. Eliminar import de `ToastNotification`
2. Agregar import de `showSuccessToast`, `showErrorToast`
3. Eliminar estado `toast`
4. Reemplazar `setToast()` con `showSuccessToast()` o `showErrorToast()`
5. Eliminar componente `<ToastNotification />` del JSX

### 2. rfx-history.tsx

**Ubicación:** `components/rfx-history.tsx`

**Mismos cambios que app-sidebar.tsx**

---

## 🎨 Tipos de Toast Disponibles

### Success (Verde)

```tsx
import { showSuccessToast } from "@/lib/toast"

showSuccessToast({
  title: "Operación exitosa",
  message: "Los cambios se guardaron correctamente",
  duration: 4000 // opcional, default 4000ms
})
```

### Error (Rojo)

```tsx
import { showErrorToast } from "@/lib/toast"

showErrorToast({
  title: "Error al guardar",
  message: "No se pudo completar la operación",
})
```

### Warning (Naranja)

```tsx
import { showWarningToast } from "@/lib/toast"

showWarningToast({
  title: "Advertencia",
  message: "Esta acción no se puede deshacer",
})
```

### Info (Azul)

```tsx
import { showInfoToast } from "@/lib/toast"

showInfoToast({
  title: "Información",
  message: "Se encontraron 5 resultados",
})
```

---

## 🔧 API Completa

### Funciones Helper

```typescript
// Funciones específicas por tipo
showSuccessToast(options: ToastOptions)
showErrorToast(options: ToastOptions)
showWarningToast(options: ToastOptions)
showInfoToast(options: ToastOptions)

// Función genérica (para compatibilidad)
showToast(type: ToastType, options: ToastOptions)

// ToastOptions
interface ToastOptions {
  title: string
  message?: string
  duration?: number // default: 4000ms
}
```

### Uso Directo de sonner (Avanzado)

```tsx
import { toast } from "@/lib/toast"

// API completa de sonner
toast.success("Título", {
  description: "Descripción",
  duration: 4000,
  action: {
    label: "Deshacer",
    onClick: () => console.log("Deshacer"),
  },
})

toast.promise(
  fetchData(),
  {
    loading: "Cargando...",
    success: "Datos cargados",
    error: "Error al cargar",
  }
)
```

---

## 📊 Comparación

| Aspecto | ToastNotification (custom) | sonner |
|---------|---------------------------|--------|
| Líneas de código | ~15 por uso | ~3 por uso |
| Estado local | Requerido | No necesario |
| JSX adicional | Sí | No |
| Configuración | Manual | Automática |
| Temas | Manual | Automático (dark/light) |
| Animaciones | Custom | Incluidas |
| Posición | Fixed | Configurable |
| Stack múltiple | No | Sí |
| Promise support | No | Sí |

---

## ✅ Checklist de Migración

Para cada archivo que migres:

- [ ] Eliminar import de `ToastNotification`
- [ ] Agregar import de helpers (`showSuccessToast`, etc.)
- [ ] Eliminar estado local del toast
- [ ] Reemplazar `setToast()` con funciones helper
- [ ] Eliminar componente `<ToastNotification />` del JSX
- [ ] Verificar que funciona correctamente
- [ ] Eliminar tipos no usados (`ToastType`)

---

## 🗑️ Después de Migrar Todo

Una vez que todos los componentes estén migrados:

1. **Eliminar archivo:** `components/toast-notification.tsx`
2. **Verificar:** No hay imports de `ToastNotification` en el proyecto
3. **Limpiar:** Eliminar tipos no usados

```bash
# Buscar usos restantes
grep -r "ToastNotification" --include="*.tsx" --include="*.ts"

# Si no hay resultados, es seguro eliminar
rm components/toast-notification.tsx
```

---

## 🎯 Beneficios de la Migración

### Código Más Limpio
- **Antes:** 15-20 líneas por componente
- **Después:** 3-5 líneas por componente
- **Reducción:** ~75% menos código

### Mejor UX
- ✅ Stack de múltiples toasts
- ✅ Animaciones suaves incluidas
- ✅ Soporte para dark mode automático
- ✅ Posición configurable
- ✅ Promise support para operaciones async

### Mantenibilidad
- ✅ Menos código custom para mantener
- ✅ Componente estándar de shadcn/ui
- ✅ Actualizaciones automáticas con shadcn
- ✅ Documentación oficial disponible

---

## 📚 Referencias

- [Sonner Documentation](https://sonner.emilkowal.ski/)
- [shadcn/ui Sonner](https://ui.shadcn.com/docs/components/sonner)
- Helper creado: `lib/toast.ts`

---

**Última actualización:** 13 de enero, 2026  
**Estado:** Toaster configurado, listo para migrar componentes
