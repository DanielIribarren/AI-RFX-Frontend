# Vista: Intake (`/intake`)

## 📝 Objetivo
Definir cómo debe funcionar el nuevo flujo de `Intake` desde la perspectiva del usuario, incluyendo:

- vistas y navegación
- estados del sistema
- decisiones UX
- validaciones mínimas antes de generar/publicar una propuesta
- puntos abiertos que todavía están en evaluación

Este documento describe el flujo objetivo del producto con base en lo ya implementado, no un rediseño desde cero.

---

## 🎯 Resultado Esperado
Un usuario interno de una organización debe poder:

1. entrar a `Intake`
2. seleccionar o heredar la `business unit` activa
3. subir un documento o texto
4. pasar a una vista de revisión sin timeout visible
5. confirmar o corregir información crítica
6. crear una `opportunity` lista para generar/publicar propuesta
7. continuar al pipeline comercial sin pasos ambiguos

El flujo debe sentirse lineal, claro y confiable.

---

## 👥 Actores

### Usuario interno
Miembro del equipo comercial u operativo de una organización.

Responsabilidades:
- subir solicitudes
- revisar extracción
- confirmar información
- continuar a oportunidad/propuesta

### Cliente externo
No participa en `Intake`.

Solo entra después, en:
- propuesta pública `/p/[token]`
- aceptación
- pago

---

## 🧱 Principios UX del flujo

### 1. El usuario no debe esperar en el uploader
El procesamiento pesado no debe bloquear la pantalla de subida.

Regla:
- `POST /api/rfx/process` responde rápido con `session_id`
- la espera ocurre en review, no en upload

### 2. Una sola intención por pantalla
Cada vista debe responder a una sola pregunta:

- `Intake`: ¿qué solicitud vamos a procesar?
- `Review`: ¿la extracción tiene sentido?
- `Opportunity`: ¿ya está lista para venderse/publicarse?

### 3. No mostrar caminos rotos
Si una acción no forma parte del flujo validado, no debe parecer disponible.

Ejemplos:
- no mostrar chat editable si está fuera de scope o inestable
- no permitir `Publish` si el pricing es inválido
- no mostrar `Submit payment proof` sin métodos de pago

### 4. La organización manda, no el usuario aislado
El flujo pertenece a la organización:

- la `business unit` activa define el contexto
- la oportunidad creada pertenece al tenant
- otros miembros del equipo deben poder verla después

---

## 🗺️ Rutas y navegación

### Entrada principal
- `/intake`

### Transición de revisión
- `/intake?review_rfx_id=<session_id>`

La revisión ocurre en la misma ruta de intake para evitar sensación de salto extraño o duplicación mental del flujo.

### Salida principal del flujo
- `/opportunities/[id]`

Después de confirmar la review, el usuario ya no debe ir a una “pantalla técnica” intermedia como destino principal. Debe caer en la oportunidad comercial.

### Rutas relacionadas
- `/dashboard`
  - resumen del pipeline
- `/opportunities`
  - lista de oportunidades
- `/product-inventory`
  - catálogo y pricing necesarios para que la propuesta tenga sentido
- `/payments-settings`
  - métodos de pago por `business unit`
- `/p/[token]`
  - propuesta pública para el cliente

---

## 🔄 Flujo UX completo

## Fase 1: Intake Upload

### Vista
Ruta:
- `/intake`

### Qué ve el usuario
- selector o contexto visible de `business unit`
- uploader de archivo
- opción para pegar texto si aplica
- explicación corta de qué hace el sistema

### Reglas UX
- si la organización tiene una sola `business unit`, se toma automáticamente y no se debe introducir fricción innecesaria
- si tiene varias, el selector debe ser visible y claro
- si no existe ninguna `business unit` válida, el flujo debe bloquearse con CTA de configuración

### Acción principal
- `Process request`

### Comportamiento esperado
Al subir el archivo:
- el backend crea `session_id`
- responde rápido
- el frontend navega a la fase de review

### No debe pasar
- quedarse en “Finalizing” sin cambiar de vista
- exigir que el usuario espere toda la extracción en el uploader

---

## Fase 2: Review Session

### Vista
Ruta:
- `/intake?review_rfx_id=<session_id>`

### Qué ve el usuario
- resumen extraído
- requester
- company
- fecha
- location
- productos detectados
- pricing preliminar si existe
- estado del review

### Qué hace el sistema
- hace polling del estado de la sesión
- cuando el preview todavía no está listo, muestra una espera explícita
- cuando el preview falla, muestra error claro

### Acción principal
- `Confirm and continue`

### Decisión UX importante
La review no debe ser un chat abierto por defecto.

En el estado actual del producto, la review es:
- una validación estructurada de lo extraído
- no una conversación libre permanente

### Estado actual implementado
- la review por sesión está operativa
- el chat conversacional de sesión fue desactivado deliberadamente porque estaba fuera del flujo estable y dependía de un stack legacy roto

### Posible evolución
Si se reactiva chat en esta fase, debe tener un rol claro:
- completar datos faltantes
- corregir cantidades
- ajustar composición
- resolver faltantes antes de generar propuesta

No debe volver como “chat genérico” ambiguo.

---

## Fase 3: Confirmación

### Qué ocurre al confirmar
La confirmación de review debe:

1. persistir el `rfx_v2`
2. mantener el contexto correcto de `business_unit`
3. generar la propuesta inicial
4. redirigir al detalle comercial

### Salida esperada
- navegación a `/opportunities/[id]`

### No debe pasar
- caer en una oportunidad sin propuesta generada
- dejar un botón `Publish` bloqueado sin explicación

---

## Fase 4: Opportunity Detail

### Vista
Ruta:
- `/opportunities/[id]`

### Qué ve el usuario
- resumen del scope
- productos/líneas
- estado comercial
- total de propuesta
- pagos si existen

### Acción principal
- `Publish proposal`

### Validación mínima obligatoria antes de publicar
La propuesta no debe ser publicable si:

- total <= 0
- faltan precios unitarios relevantes
- faltan costos unitarios relevantes
- la configuración del catálogo no permite una propuesta comercial seria

### Estado actual implementado
Hoy ya existe un bloqueo de publicación para propuestas con total `0`.

Además:
- el mensaje ya debe indicar qué corregir
- debe mandar al usuario a `Product Inventory`
- idealmente con la `business unit` correcta activa

### Próxima mejora lógica
Separar dos niveles:

1. `proposal generated`
2. `proposal ready to publish`

Porque generar HTML/documento no implica todavía calidad comercial suficiente.

---

## Fase 5: Public Proposal

### Vista
Ruta:
- `/p/[token]`

### Qué ve el cliente
- branding de la `business unit`
- propuesta
- monto
- equivalencia BCV
- aceptación
- instrucciones de pago
- carga de comprobante

### Reglas UX
- si no hay métodos de pago, no debe aparecer la subida de comprobante
- si ya está completamente pagada, debe mostrarse estado final claro

---

## Fase 6: Payment Confirmation

### Vista interna
Ruta:
- `/opportunities/[id]`

### Qué hace el equipo interno
- ve pagos enviados
- abre `View proof`
- confirma el pago

### Estado actual implementado
- el comprobante ahora se abre con signed URL
- esto permite mantener el bucket privado sin romper UX interna

---

## 🧭 Navegación ideal del usuario

### Camino principal
1. `Dashboard` o acceso directo a `Intake`
2. `/intake`
3. `/intake?review_rfx_id=...`
4. `/opportunities/[id]`
5. publicar
6. cliente entra a `/p/[token]`
7. cliente acepta y paga
8. equipo confirma en `/opportunities/[id]`

### Navegación secundaria permitida
- de oportunidad a `RFX data`
- de oportunidad a `Product Inventory`
- de oportunidad a link público

### Navegación que debe minimizarse
- saltos a vistas técnicas intermedias que no agregan decisión UX real

---

## ⚠️ Estados críticos del flujo

### Estado: `processing_preview`
UX:
- mostrar carga
- no dejar confirmar
- no dejar conversar si ese canal no está activo

### Estado: `preview_failed`
UX:
- mostrar error explícito
- ofrecer retry del intake, no mensajes ambiguos

### Estado: `review_ready`
UX:
- mostrar resumen y CTA principal de confirmación

### Estado: `proposal_generated_but_not_publishable`
UX:
- explicar qué falta
- dirigir a catálogo
- no permitir publish

### Estado: `published`
UX:
- mostrar link público
- mostrar views
- dejar copiar/abrir preview

### Estado: `payment_pending` / `confirmed`
UX:
- reflejar claramente el resumen de pagos

---

## ✅ Validaciones UX que el flujo necesita

## Antes de procesar
- `business unit` válida
- usuario autenticado
- organización válida

## Antes de confirmar review
- preview listo
- extracción mínima visible

## Antes de generar/publicar propuesta
- productos con sentido comercial
- pricing suficiente
- costo y precio unitario donde aplique
- total > 0

## Antes de subir comprobante
- propuesta aceptada
- método de pago válido
- monto válido
- archivo permitido

---

## 🚫 Fuera de scope del flujo actual

Estas piezas no deben contaminar el flujo principal mientras no estén cerradas:

- colaboración multiusuario avanzada
- activity log completo
- notificaciones
- exportaciones
- CRM first-class
- suscripciones/billing nuevo
- ajuste fino de prompts/IA por vertical
- chat legacy ambiguo para review

---

## 🔍 Decisiones abiertas

## 1. Reintroducir chat en review
Tiene sentido evaluarlo, pero solo si se redefine como herramienta de completitud de información.

Pregunta correcta:
- ¿el chat existe para iterar antes de generar propuesta?

Si la respuesta es sí, entonces debe conectarse con validación de propuesta.

## 2. Validación formal de “proposal readiness”
Falta una capa explícita que diga:

- esta extracción ya está lista para generar propuesta
- o no lo está, y esto es lo que falta

El chat, si vuelve, debería operar sobre esa capa.

## 3. Diferenciar “review” de “proposal configuration”
Hoy ambas ideas están muy cerca.

A futuro podría haber:
- review de extracción
- resolución de faltantes
- readiness check
- generación de propuesta

Pero sin introducir cuatro pantallas nuevas si no agregan claridad real.

---

## 📌 Estado actual resumido

### Ya implementado
- session-first intake
- review con polling
- confirmación que crea oportunidad y propuesta
- publish con validación de total `> 0`
- propuesta pública
- aceptación
- subida de pago
- confirmación manual
- signed URLs para comprobantes

### Temporalmente desactivado
- chat conversacional de sesión en review

### Próxima discusión lógica
- reactivar chat, pero como herramienta estructurada de completitud y validación, no como feature heredada

---

## 💡 Regla final del flujo
El nuevo `Intake` no debe sentirse como una herramienta técnica de parsing.

Debe sentirse como el primer paso de un flujo comercial:

- recibir una solicitud
- entenderla
- validar si está completa
- convertirla en una oportunidad vendible

Si una pantalla, acción o endpoint no ayuda a ese objetivo, probablemente sobra o debe salir del camino principal.
