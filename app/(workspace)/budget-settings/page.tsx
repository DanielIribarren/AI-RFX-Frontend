"use client"

import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Upload, Eye, AlertCircle, Loader2 } from "lucide-react"
import BrandingUpload from "@/components/branding-upload"
import BrandingPreview from "@/components/branding-preview"
import { useAuth } from "@/contexts/AuthContext"

export default function BudgetSettingsPage() {
  const { user, loading } = useAuth()

  // El middleware ya maneja la protección de rutas
  // Mostramos loading mientras se carga el usuario
  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col space-y-6 p-6">
      {/* Page Header */}
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Configuración de Presupuesto</h2>
        <p className="text-muted-foreground">
          Configure el branding y formato de sus propuestas comerciales para generar presupuestos personalizados.
        </p>
        {user.company_name && (
          <p className="text-sm text-gray-500 mt-1">
            Empresa: <span className="font-medium">{user.company_name}</span>
          </p>
        )}
      </div>
      
      <Separator className="my-6" />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Subir Branding
              </CardTitle>
              <CardDescription>
                Suba su logo y template para personalizar sus presupuestos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandingUpload companyId={user.id} />
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Vista Previa
              </CardTitle>
              <CardDescription>
                Vea cómo se verá su branding en los presupuestos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandingPreview companyId={user.id} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-blue-900">¿Cómo funciona?</h4>
              <p className="text-sm text-blue-800">
                Una vez que suba su logo y template, nuestro sistema de IA analizará los colores, tipografías y estilos 
                para generar propuestas comerciales que coincidan perfectamente con la identidad visual de su empresa.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
