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
      <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Core Features</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Card key={feature.name} className="p-6 hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.name}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
