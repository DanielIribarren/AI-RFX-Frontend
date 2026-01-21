'use client'

import { PublicHeader } from '@/components/layout/PublicHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, TrendingDown, Clock, ArrowRight, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CasosDeEstudioPage() {
  const router = useRouter()

  const cases = [
    {
      company: 'TechCorp Solutions',
      industry: 'Technology',
      challenge: 'Procesaban 50+ RFX mensuales manualmente, tomando 6 horas por propuesta',
      results: [
        'Reducción del 85% en tiempo de procesamiento',
        'De 6 horas a 50 minutos por propuesta',
        'Incremento del 40% en tasa de respuesta a RFX',
        'ROI positivo en el primer mes'
      ],
      metrics: {
        timeSaved: '85%',
        responseRate: '+40%',
        roi: '1 mes'
      }
    },
    {
      company: 'Global Distributors Inc',
      industry: 'Distribution',
      challenge: 'Errores frecuentes en presupuestos y pérdida de oportunidades por respuestas tardías',
      results: [
        'Eliminación del 95% de errores en presupuestos',
        'Tiempo de respuesta reducido de 3 días a 4 horas',
        'Incremento del 60% en propuestas ganadas',
        'Mejor satisfacción del cliente'
      ],
      metrics: {
        timeSaved: '92%',
        responseRate: '+60%',
        roi: '2 meses'
      }
    },
    {
      company: 'Enterprise Services Ltd',
      industry: 'Professional Services',
      challenge: 'Equipo pequeño sin capacidad para responder a todos los RFX recibidos',
      results: [
        'Capacidad de procesar 3x más RFX con el mismo equipo',
        'Reducción de costos operativos del 45%',
        'Mejora en calidad y consistencia de propuestas',
        'Expansión a nuevos mercados'
      ],
      metrics: {
        timeSaved: '70%',
        responseRate: '+200%',
        roi: '6 semanas'
      }
    }
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden">
      {/* Fondo con blobs índigo */}
      <div className="landing-background">
        <div className="landing-blob-1"></div>
        <div className="landing-blob-2"></div>
        <div className="landing-blob-3"></div>
        <div className="landing-noise"></div>
      </div>

      <PublicHeader />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0B0B0F] mb-6">
            Casos de Éxito
          </h1>
          <p className="text-xl text-[#475569] max-w-2xl mx-auto">
            Empresas que transformaron su proceso de RFX con IA
          </p>
        </div>

        <div className="space-y-8">
          {cases.map((caseStudy, index) => (
            <div key={index} className="landing-card-glass rounded-xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-[#0B0B0F] mb-2">{caseStudy.company}</h3>
                  <p className="text-sm text-[#475569] flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {caseStudy.industry}
                  </p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-green-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-2xl font-bold">{caseStudy.metrics.timeSaved}</span>
                    </div>
                    <p className="text-xs text-[#475569]">Tiempo ahorrado</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-[#4F46E5]">
                      <TrendingDown className="h-4 w-4" />
                      <span className="text-2xl font-bold">{caseStudy.metrics.responseRate}</span>
                    </div>
                    <p className="text-xs text-[#475569]">Más propuestas</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-[#0B0B0F] mb-2">Desafío</h4>
                  <p className="text-[#475569]">{caseStudy.challenge}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-[#0B0B0F] mb-2">Resultados</h4>
                  <ul className="space-y-2">
                    {caseStudy.results.map((result, i) => (
                      <li key={i} className="flex items-start gap-2 text-[#475569]">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{result}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-[#0B0B0F]/10">
                  <p className="text-sm text-[#475569]">
                    <span className="font-semibold text-[#0B0B0F]">ROI alcanzado en:</span> {caseStudy.metrics.roi}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="landing-cta-card mt-16 text-center rounded-2xl p-16">
          <h2 className="text-3xl font-bold text-[#0B0B0F] mb-4">
            ¿Listo para transformar tu proceso de RFX?
          </h2>
          <p className="text-xl text-[#475569] mb-8 max-w-2xl mx-auto">
            Únete a estas empresas y empieza a generar propuestas en minutos
          </p>
          <Button 
            size="lg"
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-lg px-8 shadow-lg transition-all duration-200"
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

      <footer className="relative z-10 border-t border-[#0B0B0F]/10 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[#475569]">
          <p>© {new Date().getFullYear()} AI-RFX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
