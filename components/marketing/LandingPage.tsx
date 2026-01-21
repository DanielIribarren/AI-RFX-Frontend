'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Zap, Target, FileText, Sparkles, Layers, MessageSquare, Palette, FileCheck, CheckCircle, Circle, Clock } from 'lucide-react'

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
            <span className="font-semibold">Agente IA que piensa como tu equipo comercial</span>
          </div>
          
          {/* Título en negro #0B0B0F */}
          <h1 className="text-4xl md:text-6xl font-bold text-[#0B0B0F] leading-tight tracking-tight">
            Tu asistente inteligente para propuestas ganadoras
          </h1>
          
          {/* Descripción con highlight índigo */}
          <p className="text-xl text-[#475569] max-w-2xl leading-relaxed">
            Sube cualquier RFX y obtén una propuesta profesional completa. <span className="text-[#4F46E5] font-semibold">Reduce 92% el tiempo de preparación.</span> 
            {' '}Desde análisis hasta exportación con tu branding.
          </p>

          {/* Value Props - Cards con glass-morphism */}
          <div className="grid md:grid-cols-3 gap-6 w-full mt-12">
            <div className="landing-card-glass rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="landing-icon-wrapper mb-4">
                <Zap className="h-8 w-8 text-white stroke-[2]" />
              </div>
              <h3 className="font-bold text-lg text-[#0B0B0F] mb-2">Velocidad empresarial</h3>
              <p className="text-sm text-[#475569]">De 4 horas a 20 minutos por propuesta con IA avanzada</p>
            </div>
            
            <div className="landing-card-glass rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="landing-icon-wrapper mb-4">
                <Target className="h-8 w-8 text-white stroke-[2]" />
              </div>
              <h3 className="font-bold text-lg text-[#0B0B0F] mb-2">Precisión garantizada</h3>
              <p className="text-sm text-[#475569]">Validación automática de partidas, cantidades y totales</p>
            </div>
            
            <div className="landing-card-glass rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="landing-icon-wrapper mb-4">
                <FileText className="h-8 w-8 text-white stroke-[2]" />
              </div>
              <h3 className="font-bold text-lg text-[#0B0B0F] mb-2">Listo para enviar</h3>
              <p className="text-sm text-[#475569]">Excel y PDF con tu logo, colores y formato corporativo</p>
            </div>
          </div>

          {/* CTA - Botones negro primary + outline secondary */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-[#0B0B0F] text-white hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
              onClick={() => router.push('/signup')}
            >
              Comenzar prueba gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              className="text-lg px-8 py-6 border-2 border-[#0B0B0F]/20 text-[#0B0B0F] hover:bg-[#0B0B0F]/5 transition-all duration-200 rounded-xl"
              onClick={() => router.push('/casos-de-estudio')}
            >
              Ver casos reales
            </Button>
          </div>

          <p className="text-sm text-[#475569] mt-4">
            Sin tarjeta de crédito • 14 días gratis • Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* Social Proof - Con borde superior */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-[#0B0B0F]/10">
        <div className="text-center">
          <p className="text-[#475569] text-base">
            Más de <strong className="text-[#4F46E5] font-semibold">500 empresas</strong> generan <strong className="text-[#4F46E5] font-semibold">2,000+ propuestas/mes</strong> con AI-RFX
          </p>
        </div>
      </section>

      {/* How it Works Component - Con borde superior */}
      <div className="border-t border-[#0B0B0F]/10">
        <HowItWorks />
      </div>

      {/* Por dentro del agente - Sección técnica detallada */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-[#0B0B0F]/10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-[#0B0B0F] mb-4 tracking-tight">
            Por dentro del agente
          </h2>
          <p className="text-xl text-[#475569] max-w-2xl mx-auto">
            Así trabaja la IA para generar propuestas perfectas en cada paso
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Flow 1: Process Flow */}
          <div className="flow-card">
            <div className="flow-header">
              <div className="flow-icon">
                <Layers className="h-7 w-7 text-white stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B0B0F]">Process Flow</h3>
                <p className="text-sm text-[#475569]">Análisis inteligente del documento</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Input</div>
                  <div className="flow-step-title">Recibe solicitud RFX</div>
                  <div className="flow-step-desc">PDF/Word con requisitos del cliente</div>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">AI Thinking</div>
                  <div className="flow-step-title">Extrae entidades clave</div>
                  <div className="flow-step-desc">Identifica partidas, cantidades, alcance, restricciones</div>
                  <span className="status-badge status-processing">
                    <Circle className="h-3 w-3" />
                    Procesando
                  </span>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Structure</div>
                  <div className="flow-step-title">Arma estructura lógica</div>
                  <div className="flow-step-desc">Organiza en capítulos, secciones, líneas presupuestarias</div>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Output</div>
                  <div className="flow-step-title">Propuesta estructurada</div>
                  <div className="flow-step-desc">JSON con alcance + presupuesto + metadatos</div>
                  <span className="status-badge status-success">
                    <CheckCircle className="h-3 w-3" />
                    Completo
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Flow 2: Chat Iteration */}
          <div className="flow-card">
            <div className="flow-header">
              <div className="flow-icon">
                <MessageSquare className="h-7 w-7 text-white stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B0B0F]">Iterate ChatAgent</h3>
                <p className="text-sm text-[#475569]">Refina con chat inteligente</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">User Intent</div>
                  <div className="flow-step-title">Detecta intención</div>
                  <div className="flow-step-desc">"Agrega partida de diseño web"</div>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Search</div>
                  <div className="flow-step-title">Busca info de RFX</div>
                  <div className="flow-step-desc">Consulta partidas existentes y contexto</div>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Execute Tool</div>
                  <div className="flow-step-title">Ejecuta modificación</div>
                  <div className="flow-step-desc">add_budget_line(item, quantity, price)</div>
                  <span className="status-badge status-processing">
                    <Circle className="h-3 w-3" />
                    Ejecutando
                  </span>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Result</div>
                  <div className="flow-step-title">RFX actualizado</div>
                  <div className="flow-step-desc">Nueva partida agregada, presupuesto recalculado</div>
                  <span className="status-badge status-success">
                    <CheckCircle className="h-3 w-3" />
                    Actualizado
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Flow 3: Branding Configuration */}
          <div className="flow-card">
            <div className="flow-header">
              <div className="flow-icon">
                <Palette className="h-7 w-7 text-white stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B0B0F]">Configura branding</h3>
                <p className="text-sm text-[#475569]">Tu identidad en cada propuesta</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Upload</div>
                  <div className="flow-step-title">Adjuntas assets</div>
                  <div className="flow-step-desc">Template Excel + Logo PNG/SVG</div>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Process</div>
                  <div className="flow-step-title">Extrae configuración</div>
                  <div className="flow-step-desc">Colores, fuentes, estructura de celdas, fórmulas</div>
                  <span className="status-badge status-processing">
                    <Circle className="h-3 w-3" />
                    Procesando
                  </span>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Store</div>
                  <div className="flow-step-title">Guarda en perfil</div>
                  <div className="flow-step-desc">Branding disponible para todas las propuestas</div>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Ready</div>
                  <div className="flow-step-title">Configuración activa</div>
                  <div className="flow-step-desc">Próximas exportaciones usan tu branding</div>
                  <span className="status-badge status-success">
                    <CheckCircle className="h-3 w-3" />
                    Configurado
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Flow 4: Budget Generation */}
          <div className="flow-card">
            <div className="flow-header">
              <div className="flow-icon">
                <FileCheck className="h-7 w-7 text-white stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B0B0F]">Generate Budget</h3>
                <p className="text-sm text-[#475569]">Exportación profesional</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Generate</div>
                  <div className="flow-step-title">Genera first budget</div>
                  <div className="flow-step-desc">Aplica template con datos de la propuesta</div>
                  <span className="status-badge status-processing">
                    <Circle className="h-3 w-3" />
                    Generando
                  </span>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Validate</div>
                  <div className="flow-step-title">Valida branding</div>
                  <div className="flow-step-desc">Verifica logo, colores, fórmulas, totales</div>
                  <span className="status-badge status-validating">
                    <Clock className="h-3 w-3" />
                    Validando
                  </span>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Format</div>
                  <div className="flow-step-title">Asegura formato PDF</div>
                  <div className="flow-step-desc">Convierte Excel → PDF con layout perfecto</div>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Download</div>
                  <div className="flow-step-title">Listo para enviar</div>
                  <div className="flow-step-desc">Excel + PDF descargables, con tu branding</div>
                  <span className="status-badge status-success">
                    <CheckCircle className="h-3 w-3" />
                    Listo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Card con glass effect */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-[#0B0B0F]/10">
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
