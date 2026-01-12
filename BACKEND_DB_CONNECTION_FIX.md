# 🔧 Backend Database Connection Issue - DIAGNÓSTICO

## ❌ Problema Identificado

```
❌ Error in query_one: [Errno 8] nodename nor servname provided, or not known
127.0.0.1 - - [05/Jan/2026 21:45:28] "POST /api/auth/login HTTP/1.1" 401 -
```

**Causa Raíz**: El backend no puede conectarse a la base de datos PostgreSQL.

**Error**: `[Errno 8] nodename nor servname provided, or not known`
- Este error indica que el hostname de la base de datos no se puede resolver
- Típicamente ocurre cuando la variable de entorno `DATABASE_URL` está mal configurada o vacía

---

## 🔍 Verificación Necesaria en Backend

### 1. Verificar Variables de Entorno

El backend necesita tener configurada la variable `DATABASE_URL` correctamente:

```bash
# .env del backend
DATABASE_URL=postgresql://usuario:password@host:puerto/nombre_db

# Ejemplo local:
DATABASE_URL=postgresql://postgres:password@localhost:5432/rfx_db

# Ejemplo Supabase:
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 2. Verificar Conexión a PostgreSQL

```bash
# Verificar que PostgreSQL esté corriendo
psql -U postgres -h localhost -p 5432

# O si es Supabase, verificar que la URL sea correcta
```

### 3. Verificar Código de Conexión en Backend

El backend debe tener algo como:

```python
import os
from sqlalchemy import create_engine

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL)
```

---

## ✅ Soluciones

### Opción 1: PostgreSQL Local

```bash
# 1. Instalar PostgreSQL (si no está instalado)
brew install postgresql@14

# 2. Iniciar servicio
brew services start postgresql@14

# 3. Crear base de datos
createdb rfx_db

# 4. Configurar .env del backend
DATABASE_URL=postgresql://postgres:@localhost:5432/rfx_db
```

### Opción 2: Supabase (Recomendado)

```bash
# 1. Obtener URL de conexión desde Supabase Dashboard
# Settings > Database > Connection string > URI

# 2. Configurar .env del backend
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Opción 3: Verificar Configuración Actual

```bash
# En el directorio del backend
cd ../backend  # O donde esté el backend

# Verificar que existe .env
ls -la .env

# Ver contenido (sin mostrar passwords)
grep DATABASE_URL .env
```

---

## 🚨 Checklist de Verificación

- [ ] Variable `DATABASE_URL` existe en `.env` del backend
- [ ] PostgreSQL está corriendo (local o remoto)
- [ ] El hostname es correcto (`localhost` o URL de Supabase)
- [ ] El puerto es correcto (5432 para local, 6543 para Supabase pooler)
- [ ] Las credenciales son correctas
- [ ] El nombre de la base de datos existe
- [ ] El backend puede hacer ping al host de la DB

---

## 🔧 Testing de Conexión

```python
# test_db_connection.py
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL')
print(f"DATABASE_URL: {DATABASE_URL[:50]}...")  # Solo primeros 50 chars

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("✅ Database connection successful!")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
```

---

## 📋 Próximos Pasos

1. **Verificar backend**: Ir al directorio del backend y revisar `.env`
2. **Verificar PostgreSQL**: Asegurarse que está corriendo
3. **Probar conexión**: Ejecutar script de prueba
4. **Reiniciar backend**: Después de corregir la configuración
5. **Probar login**: Intentar login nuevamente desde el frontend

---

## 🎯 Estado Actual del Frontend

✅ **Frontend está LISTO** con:
- Logging detallado en todos los niveles
- Manejo correcto de tokens (localStorage + cookies)
- Cookies configuradas automáticamente en API route
- Error handling robusto

**El problema está 100% en el backend** - no puede conectarse a la base de datos para validar credenciales.
