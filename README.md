# 🎨 AI-RFX Frontend

Aplicación frontend desarrollada con Next.js para la interfaz de usuario del sistema AI-RFX.

## 🛠️ Tecnologías

- **Framework**: Next.js 15.2.4
- **UI**: React 19 + TypeScript
- **Estilos**: Tailwind CSS + Radix UI
- **Estado**: React Hooks
- **Deploy**: Vercel

## 📁 Estructura del Proyecto

```
AI-RFX-Frontend/
├── app/                 # App Router Next.js
├── components/          # Componentes React
│   ├── ui/             # Componentes base UI
│   └── ...             # Componentes específicos
├── hooks/              # Custom hooks
├── lib/                # Utilidades
├── public/             # Assets estáticos
├── types/              # Definiciones TypeScript
└── __tests__/          # Tests
```

## 🚀 Quick Start

### 1. Instalación

```bash
npm install
# o
yarn install
```

### 2. Configuración

```bash
cp .env.template .env.local
# Configurar variables en .env.local
```

### 3. Desarrollo

```bash
npm run dev
# o
yarn dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📦 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run start` - Servidor de producción
- `npm run lint` - Linter
- `npm test` - Tests

## 🌐 Variables de Entorno

```bash
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_APP_NAME=AI-RFX
```

## 🚢 Deploy

### Vercel (Recomendado)

```bash
vercel deploy
```

### Netlify

```bash
npm run build
# Subir carpeta .next/
```

## 🎨 Componentes UI

- Basados en Radix UI + Tailwind
- Completamente tipados con TypeScript
- Tema claro/oscuro incluido
- Responsive design

## 🔧 Configuración del Backend

Asegúrate de configurar la URL del backend en las variables de entorno:

```bash
NEXT_PUBLIC_API_URL=https://tu-backend-url.com
```

## 📱 Características

- ✅ Responsive design
- ✅ Tema claro/oscuro
- ✅ Componentes reutilizables
- ✅ TypeScript completo
- ✅ Optimizado para producción
# AI-RFX-Backend
