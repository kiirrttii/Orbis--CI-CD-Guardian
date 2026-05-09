'use client'

import { ArrowRight } from 'lucide-react'

const steps = [
  {
    name: 'Telemetry Ingestion',
    description: 'Connect GitHub Actions, Jenkins, or other CI/CD sources',
  },
  {
    name: 'Feature Extraction',
    description: 'Extract code metrics and complexity measurements',
  },
  {
    name: 'Risk Prediction',
    description: 'ML model predicts risk score (0-100)',
  },
  {
    name: 'SHAP Explainability',
    description: 'Get detailed feature importance breakdown',
  },
  {
    name: 'Recommendations',
    description: 'Actionable insights for risk reduction',
  },
  {
    name: 'Reports & Exports',
    description: 'Generate compliance-ready documentation',
  },
]

import { APP_NAME } from '@/lib/config'

export function WorkflowPipeline() {
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-foreground mb-12 text-center">The {APP_NAME} Pipeline</h2>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-6 gap-2">
          {steps.map((step, index) => (
            <div key={step.name} className="flex flex-col items-center">
              {/* Step Card */}
              <div className="bg-card border border-border rounded-lg p-4 w-full h-40 flex flex-col justify-between mb-4 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-foreground text-sm text-center">{step.name}</h3>
                <p className="text-xs text-muted-foreground text-center">{step.description}</p>
              </div>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <ArrowRight className="w-6 h-6 text-primary mb-8 -rotate-90" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-4">
        {steps.map((step, index) => (
          <div key={step.name}>
            <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{step.name}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex justify-center py-2">
                <ArrowRight className="w-5 h-5 text-primary -rotate-90" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
