# 🛡️ Reporte de Preparación para Producción

Este documento detalla el estado actual del proyecto `AI-RFX-Frontend` y las acciones necesarias para garantizar un lanzamiento exitoso, seguro y optimizado para la captación de clientes.

**Dominio Objetivo:** `https://rfx-app.anvroc.com`

---

## 🚨 1. Áreas Críticas (Bloqueantes para Producción)

Estas ausencias afectan directamente la experiencia del usuario y la percepción profesional de la marca.

### A. Manejo de Errores (Inexistente)
*   **Problema:** No existen páginas personalizadas para errores 404 (Página no encontrada) ni 500 (Error del servidor).
*   **Impacto:** Si un usuario escribe mal una URL o el sistema falla, verá una página de error genérica de Vercel/Next.js (blanca y técnica). Esto genera desconfianza inmediata.
*   **Solución Requerida:**
    *   Crear `app/not-found.tsx`: Diseño amigable con enlace para volver al inicio.
    *   Crear `app/error.tsx`: Interfaz para capturar errores inesperados con opción de "Reintentar".

### B. Estados de Carga (UX)
*   **Problema:** No hay un `loading.tsx` global o específico.
*   **Impacto:** Durante la navegación, el usuario puede percibir "parpadeos" o pantallas en blanco, afectando las métricas de Core Web Vitals (LCP).
*   **Solución Requerida:** Implementar un esqueleto de carga (Skeleton UI) o indicador de progreso.

---

## 🚀 2. SEO y Marketing (Adquisición de Clientes)

Para "comenzar a obtener los primeros clientes", el proyecto debe ser visible y atractivo al compartirse.

### A. Social Sharing (Open Graph / Twitter Cards)
*   **Estado Actual:** ❌ Faltante.
*   **Problema:** Al compartir `https://rfx-app.anvroc.com` en WhatsApp, LinkedIn, Slack o Twitter, el enlace aparecerá sin imagen, y posiblemente sin título o descripción adecuados. Esto reduce drásticamente el CTR (tasa de clics).
*   **Acción Requerida (Imagen Cover):**
    *   **Falta imagen de portada:** No existe un archivo `opengraph-image` (1200x630px).
    *   **Recomendación:** Crear una imagen estática de alta calidad con el logo y propuesta de valor, O implementar `@vercel/og` para generar imágenes dinámicas con el título de cada página.
    *   **Tipografía:** Si se desea diferenciar la marca, podemos configurar una fuente distinta (ej. *Geist*, *Roboto* o una serif moderna) específicamente para estas imágenes generadas.

### B. Configuración de Dominio y Metadatos
*   **Estado Actual:** `sitemap.ts` y `robots.ts` usan una variable de entorno genérica.
*   **Acción Requerida:**
    *   Configurar `metadataBase` en `app/layout.tsx` apuntando a `https://rfx-app.anvroc.com` para que las URLs relativas de imágenes funcionen.
    *   Asegurar que `NEXT_PUBLIC_APP_URL` esté configurada en Vercel.

---

## 📉 3. Análisis de Pérdida de Leads (Formularios)

Evaluación de `app/(auth)/login` y `app/(auth)/signup` para detectar fugas de conversión.

### Hallazgos:
1.  **Validación de Lado del Cliente (Front-end):**
    *   ✅ Existe validación básica (campos requeridos, longitud de contraseña).
    *   ✅ Se usa `useState` para manejo local.
    *   ⚠️ **Riesgo:** Si el usuario recarga la página por error, pierde todo lo que escribió (no hay persistencia temporal).

2.  **Manejo de Errores de Envío:**
    *   ✅ Se capturan errores del `useAuth` y se muestran en un `Alert`.
    *   ⚠️ **Fuga de Leads:** Si el backend falla (ej. timeout, error 500) o hay un error de validación complejo, **no hay registro de ese intento fallido**. El usuario recibe el error y probablemente se vaya. No nos enteramos de que intentó registrarse.

3.  **Analytics de Conversión:**
    *   ⚠️ **Crítico:** No hay tracking de eventos (ej. `begin_checkout`, `sign_up_attempt`). No sabremos cuánta gente empieza a llenar el formulario y lo abandona (Tasa de Abandono).

### Recomendaciones para Evitar Pérdida de Leads:
1.  **Logging de Errores Frontend:** Enviar los errores de registro a un servicio de monitoreo (o un endpoint simple de logs) para detectar si hay problemas recurrentes que impiden el registro.
2.  **Persistencia de Datos (Opcional):** Guardar el email/nombre en `sessionStorage` por si ocurre una recarga accidental.
3.  **Feedback Más Claro:** Asegurar que los mensajes de error del backend sean amigables (ej. "Este correo ya está registrado" en lugar de "Error 409").

---

## 📊 4. Analytics

*   **Estado:** No implementado.
*   **Recomendación:** Para la fase de "obtener primeros clientes", es vital saber de dónde vienen.
    *   Integrar Google Analytics 4 (GA4) o una alternativa ligera (PostHog, Plausible) lo antes posible.
    *   Configurar eventos clave: `view_pricing`, `click_signup`, `submit_lead`.

---

## ✅ Plan de Acción Sugerido

1.  **Inmediato:** Crear páginas `not-found.tsx` y `error.tsx`.
2.  **Configuración:** Establecer `metadataBase` con el dominio final.
3.  **Visual:** Definir/Generar la imagen Open Graph (Cover) por defecto.
4.  **Monitoreo:** Agregar un manejo de errores más robusto en el formulario de registro.
