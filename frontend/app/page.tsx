'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { AlertTriangle, BarChart3, TrendingUp, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { RiskDistribution } from '@/components/dashboard/risk-distribution'
import { DeploymentTrend } from '@/components/dashboard/deployment-trend'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'

export default function Dashboard() {
  const { authReady, isAuthenticated } = useAuth()
  
  const { data: history = [], isLoading: queryLoading } = useQuery({
    queryKey: ['history'],
    queryFn: () => apiClient.getHistory(50, 0),
    enabled: authReady && isAuthenticated
  })

  const isLoading = !authReady || queryLoading

  const stats = useMemo(() => {
    const criticalCount = history.filter(h => h.inference.severity === 'CRITICAL').length
    const avgScore = history.length > 0 
      ? Math.round(history.reduce((acc, h) => acc + (h.inference.risk_score || 0), 0) / history.length * 100)
      : 0
    
    return {
      total_runs: history.length,
      critical_deployments: criticalCount,
      average_risk_score: avgScore,
      active_alerts: criticalCount
    }
  }, [history])

  const activityFeed = useMemo(() => {
    return history.slice(0, 5).map(h => ({
      id: h.prediction_id,
      type: 'analysis' as const,
      title: 'Risk Analysis Completed',
      description: `Analysis for run ${h.workflow_run_id.slice(0, 8)}...`,
      severity: h.inference.severity,
      timestamp: h.inference.timestamp
    }))
  }, [history])

  const chartData = useMemo(() => {
    // Map backend history to the format expected by charts
    return history.map(h => ({
      id: h.prediction_id,
      repository: 'Pipeline Run',
      run_id: h.workflow_run_id,
      timestamp: h.inference.timestamp,
      severity: h.inference.severity,
      risk_score: Math.round(h.inference.risk_score * 100)
    }))
  }, [history])

  if (authReady && !isAuthenticated) {
    return null
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Real-time AI risk intelligence for your deployments</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-card rounded-xl border border-border" />
            ))}
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <SummaryCards stats={stats} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Risk Distribution */}
              <RiskDistribution data={chartData as any} />

              {/* Deployment Trend */}
              <DeploymentTrend data={chartData as any} />
            </div>

            {/* Activity Feed */}
            <ActivityFeed items={activityFeed} />
          </>
        )}
      </div>
    </AppLayout>
  )
}
