import { Upload, Sparkles, FileText, Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: 'Sube tu Solicitud',
      description: 'Carga tu documento RFX en cualquier formato. Procesamiento automático en segundos.',
    },
    {
      icon: Sparkles,
      title: 'IA Analiza',
      description: 'Identificación automática de productos, cantidades y especificaciones técnicas.',
    },
    {
      icon: FileText,
      title: 'Revisa y Ajusta',
      description: 'Edita precios, cantidades o especificaciones en una interfaz intuitiva.',
    },
    {
      icon: Download,
      title: 'Exporta Propuesta',
      description: 'Genera PDF profesional listo para enviar a tu cliente.',
    },
  ]

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Cómo Funciona
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            De solicitud a propuesta profesional en 4 pasos simples
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <Card 
                key={index} 
                variant="elevated"
                className="hover:shadow-lg transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary p-3 rounded-xl flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {index + 1}. {step.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
