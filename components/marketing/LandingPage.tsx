'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Zap, Target, FileText } from 'lucide-react'

export function LandingPage() {
  const router = useRouter()

  // Redirect to dashboard if authenticated
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full border-2 border px-4 py-1.5 text-sm">
            <span className="font-semibold">✨ Nuevo:</span>
            <span className="ml-2 text-muted-foreground">Generación de propuestas con IA en minutos</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            Genera propuestas profesionales en minutos desde cualquier solicitud
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl">
            Automatiza la creación de propuestas y presupuestos. De 4 horas a 20 minutos. 
            Exporta a Excel/PDF listo para enviar.
          </p>

          {/* Value Props */}
          <div className="grid md:grid-cols-3 gap-6 w-full mt-12">
            <Card variant="bordered" className="flex flex-col items-center text-center">
              <CardContent className="pt-6">
                <Zap className="h-12 w-12 text-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">⚡ De 4 horas a 20 minutos</h3>
                <p className="text-sm text-muted-foreground">Reduce 92% el tiempo por propuesta</p>
              </CardContent>
            </Card>
            
            <Card variant="bordered" className="flex flex-col items-center text-center">
              <CardContent className="pt-6">
                <Target className="h-12 w-12 text-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">🎯 Presupuestos consistentes</h3>
                <p className="text-sm text-muted-foreground">Sin errores ni omisiones</p>
              </CardContent>
            </Card>
            
            <Card variant="bordered" className="flex flex-col items-center text-center">
              <CardContent className="pt-6">
                <FileText className="h-12 w-12 text-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">📊 Exporta y envía</h3>
                <p className="text-sm text-muted-foreground">Excel/PDF listo para cliente</p>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button 
              variant="brand"
              size="lg" 
              className="text-lg px-8"
              onClick={() => router.push('/signup')}
            >
              Sube tu primera solicitud gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="brand-outline"
              size="lg" 
              className="text-lg px-8"
              onClick={() => router.push('/casos-de-estudio')}
            >
              Ver casos de éxito
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Sin tarjeta de crédito • 14 días gratis • Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t">
        <div className="text-center">
          <p className="text-muted-foreground">
            Más de <strong className="text-foreground">500 empresas</strong> generan <strong className="text-foreground">2,000+ propuestas/mes</strong>
          </p>
        </div>
      </section>

      {/* How it Works Component */}
      <HowItWorks />

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Empieza a generar propuestas en minutos
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Únete a cientos de empresas que ya automatizan sus propuestas
          </p>
          <Button 
            variant="brand"
            size="lg" 
            className="text-lg px-8"
            onClick={() => router.push('/signup')}
          >
            Prueba gratis 14 días
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Sin tarjeta de crédito • Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} AI-RFX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
