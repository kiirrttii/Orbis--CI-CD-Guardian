'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { WorkflowPipeline } from '@/components/how-it-works/workflow-pipeline'
import { FeatureCards } from '@/components/how-it-works/feature-cards'
import { BenefitsSection } from '@/components/how-it-works/benefits-section'

import { APP_NAME } from '@/lib/config'

export default function HowItWorksPage() {
  return (
    <AppLayout>
      <div className="relative min-h-screen pb-24 overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none opacity-50"></div>
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px] -z-10 pointer-events-none opacity-50"></div>
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] -z-10 opacity-10 dark:opacity-[0.03] pointer-events-none"></div>

        <div className="space-y-24">
          {/* Header */}
          <div className="relative pt-24 pb-20 px-8 mx-4 md:mx-8 mt-6 rounded-3xl overflow-hidden border border-primary/10 shadow-lg bg-card/30 backdrop-blur-xl">
            {/* Aesthetic Background Elements */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0.2))] -z-10 opacity-30 dark:opacity-10 pointer-events-none"></div>
            <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-orange-400/30 dark:bg-primary/20 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] bg-pink-400/30 dark:bg-accent/20 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
            
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70 mb-6 tracking-tight">
                How <span className="text-primary">{APP_NAME}</span> Works
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Discover the architecture behind our hybrid intelligence engine, designed to analyze CI/CD pipelines and deliver accurate, actionable risk insights.
              </p>
            </div>
          </div>

          {/* Workflow Pipeline */}
          <div id="pipeline" className="px-4 md:px-8 scroll-mt-32">
            <WorkflowPipeline />
          </div>

          {/* Feature Cards */}
          <div id="features" className="px-4 md:px-8 scroll-mt-32">
            <FeatureCards />
          </div>

          {/* Benefits Section */}
          <div id="benefits" className="px-4 md:px-8 scroll-mt-32">
            <BenefitsSection />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
