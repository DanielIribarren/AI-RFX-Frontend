# 💬 Solución Simple: Chat con Historial y Actualización en Tiempo Real

## 🎯 Objetivo

1. **Cargar historial del chat** al abrir el panel
2. **Detectar tipo de cambio** del chat y refrescar solo el componente afectado

---

## 📋 Estado Actual

### ✅ Ya Implementado en Frontend

1. **Endpoint de historial** - `api.chat.getHistory(rfxId)` en `lib/api.ts`
2. **Función de carga** - `loadChatHistory()` en `RFXUpdateChatPanel.tsx`
3. **Detección de cambios** - `handleChatUpdate()` en `rfx-results-wrapper-v2.tsx`

### ❌ Falta Implementar

1. **Backend endpoint** - `GET /api/rfx/{rfx_id}/chat/history` (probablemente no existe)
2. **Refrescar componentes específicos** según tipo de cambio

---

## 🔧 Solución Simple

### Paso 1: Backend - Crear Endpoint de Historial

**Archivo:** `backend/routes/rfx_chat.py` (o donde estén las rutas del chat)

```python
@rfx_chat_bp.route('/api/rfx/<rfx_id>/chat/history', methods=['GET'])
@jwt_required()
def get_chat_history(rfx_id):
    """
    Obtener historial de mensajes del chat para un RFX
    """
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Obtener mensajes de la base de datos
        messages = db.session.query(ChatMessage)\
            .filter_by(rfx_id=rfx_id)\
            .order_by(ChatMessage.created_at.asc())\
            .limit(limit)\
            .offset(offset)\
            .all()
        
        return jsonify({
            'status': 'success',
            'messages': [
                {
                    'id': msg.id,
                    'role': msg.role,  # 'user' o 'assistant'
                    'content': msg.content,
                    'timestamp': msg.created_at.isoformat(),
                    'metadata': msg.metadata or {}
                }
                for msg in messages
            ],
            'total': db.session.query(ChatMessage).filter_by(rfx_id=rfx_id).count()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Error al obtener historial del chat'
        }), 500
```

**Modelo de Base de Datos** (si no existe):

```python
class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rfx_id = db.Column(db.String(36), db.ForeignKey('rfx.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user' o 'assistant'
    content = db.Column(db.Text, nullable=False)
    metadata = db.Column(JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    rfx = db.relationship('RFX', backref='chat_messages')
```

**Guardar mensajes al enviar:**

```python
@rfx_chat_bp.route('/api/rfx/<rfx_id>/chat', methods=['POST'])
@jwt_required()
def send_chat_message(rfx_id):
    # ... código existente ...
    
    # Guardar mensaje del usuario
    user_message = ChatMessage(
        rfx_id=rfx_id,
        role='user',
        content=message,
        metadata={'files': [f.filename for f in files] if files else []}
    )
    db.session.add(user_message)
    
    # Procesar con IA...
    response = process_chat_message(...)
    
    # Guardar respuesta del asistente
    assistant_message = ChatMessage(
        rfx_id=rfx_id,
        role='assistant',
        content=response['message'],
        metadata={
            'changes': response.get('changes', []),
            'confidence': response.get('confidence')
        }
    )
    db.session.add(assistant_message)
    db.session.commit()
    
    return jsonify(response), 200
```

---

### Paso 2: Frontend - Refrescar Solo el Componente Afectado

**Archivo:** `components/rfx-results-wrapper-v2.tsx`

Modificar `handleChatUpdate` para refrescar solo lo necesario:

```typescript
const handleChatUpdate = async (changes: RFXChange[]) => {
  console.log('🔄 Applying chat changes:', changes)
  
  // Agrupar cambios por tipo
  const changeTypes = new Set(changes.map(c => c.type))
  
  for (const change of changes) {
    switch (change.type) {
      case "add_product":
        // Agregar producto al estado local
        const newProduct = {
          id: change.data.id || crypto.randomUUID(),
          nombre: change.data.nombre,
          cantidad: change.data.cantidad,
          precio: change.data.precio,
          unidad: change.data.unidad || 'unidades'
        }
        setProductosIndividuales(prev => [...prev, newProduct])
        
        // Persistir en backend
        await api.addProduct(backendData.data.id, newProduct)
        break

      case "update_product":
        // Actualizar producto en estado local
        const { product_id, field, value } = change.data
        setProductosIndividuales(prev =>
          prev.map(p => p.id === product_id ? { ...p, [field]: value } : p)
        )
        
        // Persistir en backend
        await api.updateProductField(backendData.data.id, product_id, field, value)
        break

      case "delete_product":
        // Eliminar producto del estado local
        const productId = change.data.product_id
        setProductosIndividuales(prev => prev.filter(p => p.id !== productId))
        
        // Persistir en backend
        await api.deleteProduct(backendData.data.id, productId)
        break

      case "update_field":
        // Actualizar campo del RFX
        const fieldName = change.data.field
        const fieldValue = change.data.value
        
        setExtractedData(prev => ({ ...prev, [fieldName]: fieldValue }))
        
        // Persistir en backend
        await api.updateRFXField(backendData.data.id, fieldName, fieldValue)
        break
    }
  }
  
  // Refrescar solo si hubo cambios en productos (para recalcular ganancias)
  if (changeTypes.has('add_product') || 
      changeTypes.has('update_product') || 
      changeTypes.has('delete_product')) {
    console.log('🔄 Refreshing products data for profit calculations')
    await refreshRFXData()
  }
  
  toast.success(`✅ ${changes.length} cambio(s) aplicado(s)`)
}
```

**Explicación:**
- Actualiza estado local inmediatamente (optimistic update)
- Persiste cada cambio en backend
- Solo refresca datos completos si hay cambios en productos (para recalcular ganancias)
- Si solo cambió un campo del RFX (fecha, lugar, etc.), no refresca todo

---

### Paso 3: Mejorar Tipos de Cambio del Backend

**Backend:** Asegurar que el chat devuelva el tipo correcto de cambio:

```python
def process_chat_message(message, context, rfx_id):
    # ... procesamiento con IA ...
    
    changes = []
    
    # Ejemplo: Agregar producto
    if intent == "add_product":
        changes.append({
            'type': 'add_product',
            'description': f'Agregado producto: {product_name}',
            'data': {
                'id': str(uuid.uuid4()),
                'nombre': product_name,
                'cantidad': quantity,
                'precio': price,
                'unidad': unit
            }
        })
    
    # Ejemplo: Actualizar producto
    elif intent == "update_product":
        changes.append({
            'type': 'update_product',
            'description': f'Actualizado {field} de {product_name}',
            'data': {
                'product_id': product_id,
                'field': field,  # 'cantidad', 'precio', 'nombre', etc.
                'value': new_value
            }
        })
    
    # Ejemplo: Eliminar producto
    elif intent == "delete_product":
        changes.append({
            'type': 'delete_product',
            'description': f'Eliminado producto: {product_name}',
            'data': {
                'product_id': product_id
            }
        })
    
    # Ejemplo: Actualizar campo del RFX
    elif intent == "update_field":
        changes.append({
            'type': 'update_field',
            'description': f'Actualizado {field_name}',
            'data': {
                'field': field_name,  # 'fechaEntrega', 'lugarEntrega', etc.
                'value': new_value
            }
        })
    
    return {
        'message': response_message,
        'changes': changes,
        'confidence': confidence_score,
        'requires_confirmation': False
    }
```

---

## 🎯 Resultado Final

### Flujo Completo

1. **Usuario abre chat** → `loadChatHistory()` carga mensajes desde backend
2. **Usuario envía mensaje** → Backend procesa y devuelve cambios con tipo específico
3. **Frontend detecta tipo** → Actualiza solo el estado afectado
4. **Persiste en backend** → Cada cambio se guarda
5. **Refresca si necesario** → Solo si hay cambios en productos (para recalcular)

### Ventajas

✅ **Simple** - No hay Context API innecesario
✅ **Eficiente** - Solo refresca lo necesario
✅ **Directo** - Cada cambio se aplica inmediatamente
✅ **Persistente** - Historial se guarda en BD
✅ **Escalable** - Fácil agregar nuevos tipos de cambio

---

## 📝 Checklist de Implementación

### Backend
- [ ] Crear tabla `chat_messages` en base de datos
- [ ] Crear endpoint `GET /api/rfx/{rfx_id}/chat/history`
- [ ] Modificar endpoint `POST /api/rfx/{rfx_id}/chat` para guardar mensajes
- [ ] Asegurar que cambios incluyan tipo específico (`add_product`, `update_product`, etc.)

### Frontend
- [ ] Verificar que `loadChatHistory()` funciona (ya está implementado)
- [ ] Mejorar `handleChatUpdate()` para actualizar estado local
- [ ] Agregar persistencia en backend para cada cambio
- [ ] Refrescar solo cuando sea necesario (cambios en productos)

### Testing
- [ ] Abrir chat y verificar que carga historial
- [ ] Enviar mensaje que agregue producto → verificar actualización inmediata
- [ ] Enviar mensaje que modifique cantidad → verificar actualización sin refresh completo
- [ ] Enviar mensaje que cambie fecha → verificar actualización sin refresh de productos
- [ ] Cerrar y abrir chat → verificar que historial persiste

---

## 🚀 Implementación Rápida (30 minutos)

1. **Backend (15 min):**
   - Crear tabla `chat_messages`
   - Crear endpoint de historial
   - Guardar mensajes al enviar

2. **Frontend (15 min):**
   - Mejorar `handleChatUpdate()`
   - Agregar persistencia
   - Testing básico

**¡Listo!** Sistema simple y funcional sin complicaciones.
