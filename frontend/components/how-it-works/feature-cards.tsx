'use client'

import { Card } from '@/components/ui/card'
import {
  Zap,
  Brain,
  Lightbulb,
  Database,
  Eye,
  FileText,
} from 'lucide-react'

const features = [
  {
    name: 'AI Risk Prediction',
    description: 'Advanced ML models trained on thousands of deployments predict risk with 94% accuracy',
    icon: Brain,
  },
  {
    name: 'SHAP Explainability',
    description: 'Understand exactly which code metrics contribute most to risk predictions',
    icon: Eye,
  },
  {
    name: 'Context-Aware Recommendations',
    description: 'Get personalized refactoring suggestions based on your specific codebase patterns',
    icon: Lightbulb,
  },
  {
    name: 'Telemetry Ingestion',
    description: 'Connect to GitHub Actions, Jenkins, GitLab, or any CI/CD platform',
    icon: Database,
  },
  {
    name: 'Deployment Monitoring',
    description: 'Track deployment history and monitor risk trends over time',
    icon: Zap,
  },
  {
    name: 'Historical Analytics',
    description: 'Build insights from historical data and identify patterns',
    icon: FileText,
  },
]

export function FeatureCards() {
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-black mb-16 text-center text-transparent bg-clip-text bg-gradient-to-r from-foreground to-primary tracking-tight">
        Core Features
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Card key={feature.name} className="p-6 bg-card/40 backdrop-blur-md border border-border/50 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
