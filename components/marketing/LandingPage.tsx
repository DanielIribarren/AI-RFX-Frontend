'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Zap, Target, FileText, Sparkles } from 'lucide-react'

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
    <div className="min-h-screen">
      {/* Fondo con blobs índigo */}
      <div className="landing-background">
        <div className="landing-background-grid" />
        <div className="landing-blob landing-blob-1" />
        <div className="landing-blob landing-blob-2" />
        <div className="landing-blob landing-blob-3" />
        <div className="landing-noise" />
      </div>

      <PublicHeader />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge índigo con glow */}
          <div className="landing-badge-indigo">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-semibold">Nuevo: Generación de propuestas con IA</span>
          </div>
          
          {/* Título en negro #0B0B0F */}
          <h1 className="text-4xl md:text-6xl font-bold text-[#0B0B0F] leading-tight tracking-tight">
            Genera propuestas profesionales en minutos desde cualquier solicitud
          </h1>
          
          {/* Descripción con highlight índigo */}
          <p className="text-xl text-[#475569] max-w-2xl leading-relaxed">
            Automatiza la creación de propuestas y presupuestos. <span className="text-[#4F46E5] font-semibold">De 4 horas a 20 minutos.</span> 
            {' '}Exporta a Excel/PDF listo para enviar.
          </p>

          {/* Value Props - Cards con glass-morphism */}
          <div className="grid md:grid-cols-3 gap-6 w-full mt-12">
            <div className="landing-card-glass rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="landing-icon-wrapper mb-4">
                <Zap className="h-8 w-8 text-white stroke-[2]" />
              </div>
              <h3 className="font-bold text-lg text-[#0B0B0F] mb-2">De 4 horas a 20 minutos</h3>
              <p className="text-sm text-[#475569]">Reduce 92% el tiempo por propuesta</p>
            </div>
            
            <div className="landing-card-glass rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="landing-icon-wrapper mb-4">
                <Target className="h-8 w-8 text-white stroke-[2]" />
              </div>
              <h3 className="font-bold text-lg text-[#0B0B0F] mb-2">Presupuestos consistentes</h3>
              <p className="text-sm text-[#475569]">Sin errores ni omisiones</p>
            </div>
            
            <div className="landing-card-glass rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="landing-icon-wrapper mb-4">
                <FileText className="h-8 w-8 text-white stroke-[2]" />
              </div>
              <h3 className="font-bold text-lg text-[#0B0B0F] mb-2">Exporta y envía</h3>
              <p className="text-sm text-[#475569]">Excel/PDF listo para cliente</p>
            </div>
          </div>

          {/* CTA - Botones negro primary + outline secondary */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-[#0B0B0F] text-white hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
              onClick={() => router.push('/signup')}
            >
              Sube tu primera solicitud gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              className="text-lg px-8 py-6 border-2 border-[#0B0B0F]/20 text-[#0B0B0F] hover:bg-[#0B0B0F]/5 transition-all duration-200 rounded-xl"
              onClick={() => router.push('/casos-de-estudio')}
            >
              Ver casos de éxito
            </Button>
          </div>

          <p className="text-sm text-[#475569] mt-4">
            Sin tarjeta de crédito • 14 días gratis • Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-[#0B0B0F]/10">
        <div className="text-center">
          <p className="text-[#475569] text-base">
            Más de <strong className="text-[#4F46E5] font-semibold">500 empresas</strong> generan <strong className="text-[#4F46E5] font-semibold">2,000+ propuestas/mes</strong>
          </p>
        </div>
      </section>

      {/* How it Works Component */}
      <HowItWorks />

      {/* Final CTA - Card con glass effect */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="landing-cta-card text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B0B0F] mb-4 tracking-tight">
              Empieza a generar propuestas en minutos
            </h2>
            <p className="text-xl text-[#475569] mb-8">
              Únete a cientos de empresas que ya automatizan sus propuestas
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-[#4F46E5] text-white hover:bg-[#4338CA] shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
              onClick={() => router.push('/signup')}
            >
              Prueba gratis 14 días
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-[#475569] mt-4">
              Sin tarjeta de crédito • Cancela cuando quieras
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#0B0B0F]/10 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[#475569]">
          <p>© {new Date().getFullYear()} AI-RFX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
