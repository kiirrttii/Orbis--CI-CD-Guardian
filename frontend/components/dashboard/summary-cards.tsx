'use client'

import { Card } from '@/components/ui/card'
import { AlertTriangle, BarChart3, TrendingUp, Zap } from 'lucide-react'
import type { SummaryStats } from '@/lib/api-types'

interface SummaryCardsProps {
  stats: SummaryStats
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total Runs',
      value: stats.total_runs.toLocaleString(),
      change: '+12%',
      icon: Zap,
      color: 'primary',
      description: 'Pipeline executions',
    },
    {
      title: 'Critical Issues',
      value: stats.critical_deployments,
      change: '2 new',
      icon: AlertTriangle,
      color: 'status-critical',
      description: 'Requiring attention',
    },
    {
      title: 'Average Risk Score',
      value: stats.average_risk_score.toFixed(1),
      change: '-2.1%',
      icon: BarChart3,
      color: 'status-medium',
      description: 'Compared to last week',
    },
    {
      title: 'Active Alerts',
      value: stats.active_alerts,
      change: '+1',
      icon: TrendingUp,
      color: 'status-high',
      description: 'Pending review',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg bg-${card.color}/10`}>
                <Icon className={`w-6 h-6 text-${card.color}`} />
              </div>
              <span className="text-sm font-medium text-status-low">{card.change}</span>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-foreground mb-2">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </Card>
        )
      })}
    </div>
  )
}
