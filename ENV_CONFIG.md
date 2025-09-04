# 🔧 Configuración de Variables de Entorno

Este documento describe cómo configurar las variables de entorno para el proyecto AI-RFX Frontend, especialmente para los deploy hooks de Vercel.

## 📋 Variables Requeridas

### Para desarrollo local (.env.local)

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001

# Vercel Deploy Hooks (opcional para desarrollo local)
VERCEL_DEPLOY_HOOK_PROD=https://api.vercel.com/v1/integrations/deploy/prj_xxx/xxx
VERCEL_DEPLOY_HOOK_PREVIEW=https://api.vercel.com/v1/integrations/deploy/prj_xxx/xxx
VERCEL_TOKEN=your_vercel_token_here
VERCEL_PROJECT_NAME=my-v0-project
```

### Para GitHub Actions (GitHub Secrets)

Configurar los siguientes secrets en GitHub:

| Secret Name                  | Descripción                   | Requerido   |
| ---------------------------- | ----------------------------- | ----------- |
| `NEXT_PUBLIC_API_URL`        | URL de la API backend         | ✅          |
| `VERCEL_DEPLOY_HOOK_PROD`    | Hook de deploy de producción  | ✅          |
| `VERCEL_DEPLOY_HOOK_PREVIEW` | Hook de deploy de preview     | ✅          |
| `VERCEL_TOKEN`               | Token API de Vercel           | ⚠️ Opcional |
| `VERCEL_PROJECT_NAME`        | Nombre del proyecto en Vercel | ⚠️ Opcional |

### Para Vercel Dashboard

En el dashboard de Vercel, configurar las siguientes variables de entorno:

| Variable              | Valor                       | Entornos            |
| --------------------- | --------------------------- | ------------------- |
| `NEXT_PUBLIC_API_URL` | URL de tu API de producción | Production, Preview |
| `NODE_ENV`            | `production`                | Production          |

## 🚀 Cómo Obtener los Deploy Hooks

### Paso 1: Crear Deploy Hooks en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Navega a **Settings** → **Git** → **Deploy Hooks**
3. Crea dos hooks:
   - **Production Hook**: Para deploys de producción (rama `main`)
   - **Preview Hook**: Para deploys de preview (otras ramas)
4. Copia las URLs generadas

### Paso 2: Configurar GitHub Secrets

1. Ve a tu repositorio en GitHub
2. Navega a **Settings** → **Secrets and variables** → **Actions**
3. Agrega los secrets con las URLs de los hooks:
   ```
   VERCEL_DEPLOY_HOOK_PROD=https://api.vercel.com/v1/integrations/deploy/prj_xxx/xxx
   VERCEL_DEPLOY_HOOK_PREVIEW=https://api.vercel.com/v1/integrations/deploy/prj_xxx/xxx
   ```

### Paso 3: Obtener Token de Vercel (Opcional)

Para verificar el estado de los deploys:

1. Ve a [Vercel Account Tokens](https://vercel.com/account/tokens)
2. Crea un nuevo token
3. Agrégalo como secret: `VERCEL_TOKEN`

## 🔧 Scripts Disponibles

Una vez configurado, tendrás acceso a estos comandos:

```bash
# Deploy manual a producción
npm run deploy

# Deploy manual de preview
npm run deploy:preview

# Disparar deploy hook manualmente
npm run hook:trigger

# Verificar estado de deploys
VERCEL_TOKEN=xxx node scripts/check-deploy-status.js

# Deploy completo con limpieza
./scripts/deploy-complete.sh --prod
```

## ⚡ Flujo Automático

Con la configuración completa, el flujo será:

1. **Push a `main`** → Deploy automático a **producción**
2. **Push a otras ramas** → Deploy automático a **preview**
3. **Pull Request** → Deploy de **preview** + comentario automático
4. **Manual trigger** → Deploy según elección

## 🔍 Verificación

Para verificar que todo esté configurado correctamente:

1. Haz un commit y push a una rama que no sea `main`
2. Verifica que se active el workflow en GitHub Actions
3. Comprueba que aparezca un nuevo deploy en Vercel Dashboard
4. Si tienes `VERCEL_TOKEN` configurado, ejecuta:
   ```bash
   npm run check:status
   ```

## ⚠️ Notas de Seguridad

- **Nunca** commits archivos `.env.local` con valores reales
- Los deploy hooks son URLs públicas, pero solo pueden ser usados para deploys
- El `VERCEL_TOKEN` da acceso a tu cuenta de Vercel, manéjalo con cuidado
- Usa secrets de GitHub para valores sensibles, no variables de entorno públicas

## 🆘 Troubleshooting

### Deploy hook no funciona

- Verifica que la URL del hook esté correcta
- Comprueba que el secret esté configurado en GitHub
- Revisa los logs del workflow en GitHub Actions

### Build falla en Vercel

- Verifica que `NEXT_PUBLIC_API_URL` esté configurado en Vercel
- Comprueba que todas las dependencias estén en `package.json`
- Revisa los logs de build en Vercel Dashboard

### Token de Vercel inválido

- Regenera el token en Vercel Account Settings
- Actualiza el secret `VERCEL_TOKEN` en GitHub

## 📞 Soporte

Si tienes problemas con la configuración:

1. Revisa los logs en GitHub Actions
2. Verifica la configuración en Vercel Dashboard
3. Consulta la [documentación de Vercel Deploy Hooks](https://vercel.com/docs/concepts/git#deploy-hooks)
