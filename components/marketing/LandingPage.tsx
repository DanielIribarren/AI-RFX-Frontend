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
            <span className="font-semibold">AI agent that thinks like your sales team</span>
          </div>
          
          {/* Título en negro #0B0B0F */}
          <h1 className="text-4xl md:text-6xl font-bold text-[#0B0B0F] leading-tight tracking-tight">
            Your smart assistant for winning proposals
          </h1>
          
          {/* Descripción con highlight índigo */}
          <p className="text-xl text-[#475569] max-w-2xl leading-relaxed">
            Upload any RFX and get a complete professional proposal. <span className="text-[#4F46E5] font-semibold">Cut preparation time by 92%.</span>
            {' '}From analysis to export with your branding.
          </p>

          {/* Value Props - Cards con glass-morphism */}
          <div className="grid md:grid-cols-3 gap-6 w-full mt-12">
            <div className="landing-card-glass rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="landing-icon-wrapper mb-4">
                <Zap className="h-8 w-8 text-white stroke-[2]" />
              </div>
              <h3 className="font-bold text-lg text-[#0B0B0F] mb-2">Enterprise speed</h3>
              <p className="text-sm text-[#475569]">From 4 hours to 20 minutes per proposal with advanced AI</p>
            </div>
            
            <div className="landing-card-glass rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="landing-icon-wrapper mb-4">
                <Target className="h-8 w-8 text-white stroke-[2]" />
              </div>
              <h3 className="font-bold text-lg text-[#0B0B0F] mb-2">Guaranteed accuracy</h3>
              <p className="text-sm text-[#475569]">Automatic validation of line items, quantities, and totals</p>
            </div>
            
            <div className="landing-card-glass rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="landing-icon-wrapper mb-4">
                <FileText className="h-8 w-8 text-white stroke-[2]" />
              </div>
              <h3 className="font-bold text-lg text-[#0B0B0F] mb-2">Ready to send</h3>
              <p className="text-sm text-[#475569]">Excel and PDF with your logo, colors, and corporate format</p>
            </div>
          </div>

          {/* CTA - Botones negro primary + outline secondary */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-[#0B0B0F] text-white hover:bg-[#1A1A20] hover:text-white shadow-md hover:shadow-lg rounded-xl"
              onClick={() => router.push('/signup')}
            >
              Start free trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              className="text-lg px-8 py-6 border-2 border-[#0B0B0F]/20 text-[#0B0B0F] hover:bg-[#0B0B0F]/5 transition-all duration-200 rounded-xl"
              onClick={() => router.push('/casos-de-estudio')}
            >
              View real case studies
            </Button>
          </div>

          <p className="text-sm text-[#475569] mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Social Proof - Con borde superior */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-[#0B0B0F]/10">
        <div className="text-center">
          <p className="text-[#475569] text-base">
            More than <strong className="text-[#4F46E5] font-semibold">500 companies</strong> generate <strong className="text-[#4F46E5] font-semibold">2,000+ proposals/month</strong> with AI-RFX
          </p>
        </div>
      </section>

      {/* How it Works Component - Con borde superior */}
      <div className="border-t border-[#0B0B0F]/10">
        <HowItWorks />
      </div>

      {/* Inside the Agent - Sección técnica detallada */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-[#0B0B0F]/10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-[#0B0B0F] mb-4 tracking-tight">
            Inside the Agent
          </h2>
          <p className="text-xl text-[#475569] max-w-2xl mx-auto">
            This is how AI works to create high-quality proposals at every step
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
                <p className="text-sm text-[#475569]">Smart document analysis</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Input</div>
                  <div className="flow-step-title">Receive RFX request</div>
                  <div className="flow-step-desc">PDF/Word file with client requirements</div>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">AI Thinking</div>
                  <div className="flow-step-title">Extract key entities</div>
                  <div className="flow-step-desc">Identify line items, quantities, scope, and constraints</div>
                  <span className="status-badge status-processing">
                    <Circle className="h-3 w-3" />
                    Processing
                  </span>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Structure</div>
                  <div className="flow-step-title">Build logical structure</div>
                  <div className="flow-step-desc">Organize chapters, sections, and budget lines</div>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Output</div>
                  <div className="flow-step-title">Structured proposal</div>
                  <div className="flow-step-desc">JSON output with scope, budget, and metadata</div>
                  <span className="status-badge status-success">
                    <CheckCircle className="h-3 w-3" />
                    Complete
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
                <p className="text-sm text-[#475569]">Refine with smart chat</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">User Intent</div>
                  <div className="flow-step-title">Detect user intent</div>
                  <div className="flow-step-desc">"Add a web design line item"</div>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Search</div>
                  <div className="flow-step-title">Search RFX data</div>
                  <div className="flow-step-desc">Look up existing line items and context</div>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Execute Tool</div>
                  <div className="flow-step-title">Execute modification</div>
                  <div className="flow-step-desc">add_budget_line(item, quantity, price)</div>
                  <span className="status-badge status-processing">
                    <Circle className="h-3 w-3" />
                    Running
                  </span>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Result</div>
                  <div className="flow-step-title">RFX updated</div>
                  <div className="flow-step-desc">New line item added, budget recalculated</div>
                  <span className="status-badge status-success">
                    <CheckCircle className="h-3 w-3" />
                    Updated
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
                <h3 className="text-xl font-bold text-[#0B0B0F]">Configure branding</h3>
                <p className="text-sm text-[#475569]">Your identity on every proposal</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Upload</div>
                  <div className="flow-step-title">Upload assets</div>
                  <div className="flow-step-desc">Template Excel + Logo PNG/SVG</div>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Process</div>
                  <div className="flow-step-title">Extract configuration</div>
                  <div className="flow-step-desc">Colors, fonts, cell structure, and formulas</div>
                  <span className="status-badge status-processing">
                    <Circle className="h-3 w-3" />
                    Processing
                  </span>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Store</div>
                  <div className="flow-step-title">Save to profile</div>
                  <div className="flow-step-desc">Branding available for all proposals</div>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Ready</div>
                  <div className="flow-step-title">Configuration active</div>
                  <div className="flow-step-desc">Future exports use your branding</div>
                  <span className="status-badge status-success">
                    <CheckCircle className="h-3 w-3" />
                    Configured
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
                <p className="text-sm text-[#475569]">Professional export</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Generate</div>
                  <div className="flow-step-title">Generate first budget</div>
                  <div className="flow-step-desc">Apply template with proposal data</div>
                  <span className="status-badge status-processing">
                    <Circle className="h-3 w-3" />
                    Generating
                  </span>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Validate</div>
                  <div className="flow-step-title">Validate branding</div>
                  <div className="flow-step-desc">Verify logo, colors, formulas, and totals</div>
                  <span className="status-badge status-validating">
                    <Clock className="h-3 w-3" />
                    Validating
                  </span>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Format</div>
                  <div className="flow-step-title">Ensure PDF formatting</div>
                  <div className="flow-step-desc">Convert Excel to PDF with perfect layout</div>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-step-bullet">
                  <div className="flow-step-bullet-inner"></div>
                </div>
                <div className="flow-step-content">
                  <div className="flow-step-label">Download</div>
                  <div className="flow-step-title">Ready to send</div>
                  <div className="flow-step-desc">Downloadable Excel and PDF with your branding</div>
                  <span className="status-badge status-success">
                    <CheckCircle className="h-3 w-3" />
                    Ready
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
              Start generating proposals in minutes
            </h2>
            <p className="text-xl text-[#475569] mb-8">
              Join hundreds of companies already automating their proposals
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-[#4F46E5] text-white hover:bg-[#4338CA] hover:text-white shadow-md hover:shadow-lg rounded-xl"
              onClick={() => router.push('/signup')}
            >
              Try it free for 14 days
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-[#475569] mt-4">
              No credit card required • Cancel anytime
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
