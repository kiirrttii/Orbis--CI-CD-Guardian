'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { WorkflowPipeline } from '@/components/how-it-works/workflow-pipeline'
import { FeatureCards } from '@/components/how-it-works/feature-cards'
import { BenefitsSection } from '@/components/how-it-works/benefits-section'

import { APP_NAME } from '@/lib/config'

export default function HowItWorksPage() {
  return (
    <AppLayout>
      <div className="space-y-12">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 py-16 px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-foreground mb-4">How {APP_NAME} Works</h1>
            <p className="text-lg text-muted-foreground">
              Understand how our risk engine analyzes your CI/CD pipelines to deliver accurate predictions
              with explainable insights.
            </p>
          </div>
        </div>

        {/* Workflow Pipeline */}
        <div className="px-8">
          <WorkflowPipeline />
        </div>

        {/* Feature Cards */}
        <div className="px-8">
          <FeatureCards />
        </div>

        {/* Benefits Section */}
        <div className="px-8 pb-16">
          <BenefitsSection />
        </div>
      </div>
    </AppLayout>
  )
}
