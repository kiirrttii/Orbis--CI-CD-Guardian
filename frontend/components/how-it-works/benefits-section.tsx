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
      <div className="mb-16">
        <h2 className="text-3xl md:text-4xl font-black mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-foreground to-primary tracking-tight">
          Why {APP_NAME}
        </h2>
        <p className="text-center text-muted-foreground text-lg md:text-xl">
          Transform your CI/CD pipeline with intelligent risk management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {benefits.map((benefit) => (
          <Card key={benefit.title} className="p-6 bg-card/40 backdrop-blur-md border border-border/50 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
            {/* Subtle Top Gradient Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-accent/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

    </div>
  )
}
