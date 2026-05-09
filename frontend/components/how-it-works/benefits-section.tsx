'use client'

import { Card } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

const benefits = [
  {
    title: 'Reduce Risk',
    description: 'Identify potential issues before they reach production',
  },
  {
    title: 'Save Time',
    description: 'Automated analysis eliminates manual code reviews',
  },
  {
    title: 'Improve Quality',
    description: 'Data-driven recommendations enhance code quality',
  },
  {
    title: 'Ensure Compliance',
    description: 'Generate audit-ready reports for compliance requirements',
  },
  {
    title: 'Scale Safely',
    description: 'Maintain security and quality as your team grows',
  },
  {
    title: 'Enable Collaboration',
    description: 'Share insights with your entire DevOps team',
  },
]

import { APP_NAME } from '@/lib/config'

export function BenefitsSection() {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-foreground mb-4 text-center">Why {APP_NAME}</h2>
      <p className="text-center text-muted-foreground mb-12 text-lg">
        Transform your CI/CD pipeline with intelligent risk management
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit) => (
          <div key={benefit.title} className="flex gap-4">
            <div className="flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-status-low mt-1" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Call to action */}
      <div className="mt-12 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold text-foreground mb-2">Ready to get started?</h3>
        <p className="text-muted-foreground mb-6">
          Start analyzing your deployments with AI-powered risk intelligence today.
        </p>
        <button className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Start Free Trial
        </button>
      </div>
    </div>
  )
}
