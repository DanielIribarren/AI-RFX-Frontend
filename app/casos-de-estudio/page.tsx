'use client'

import { PublicHeader } from '@/components/public-header'
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
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Casos de Éxito
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Empresas que transformaron su proceso de RFX con IA
          </p>
        </div>

        <div className="space-y-8">
          {cases.map((caseStudy, index) => (
            <Card key={index} className="border-2 hover:border-gray-300 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{caseStudy.company}</CardTitle>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {caseStudy.industry}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-green-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-2xl font-bold">{caseStudy.metrics.timeSaved}</span>
                      </div>
                      <p className="text-xs text-gray-600">Tiempo ahorrado</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-blue-600">
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-2xl font-bold">{caseStudy.metrics.responseRate}</span>
                      </div>
                      <p className="text-xs text-gray-600">Más propuestas</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Desafío</h3>
                  <p className="text-gray-700">{caseStudy.challenge}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Resultados</h3>
                  <ul className="space-y-2">
                    {caseStudy.results.map((result, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{result}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">ROI alcanzado en:</span> {caseStudy.metrics.roi}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center bg-gray-50 border-2 border-gray-200 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Listo para transformar tu proceso de RFX?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Únete a estas empresas y empieza a generar propuestas en minutos
          </p>
          <Button 
            size="lg"
            className="bg-black hover:bg-gray-800 text-white text-lg px-8"
            onClick={() => router.push('/signup')}
          >
            Prueba gratis 14 días
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-gray-600 mt-4">
            Sin tarjeta de crédito • Cancela cuando quieras
          </p>
        </div>
      </div>

      <footer className="border-t border-gray-200 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} AI-RFX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
