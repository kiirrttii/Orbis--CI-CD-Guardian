'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { mockTelemetryData } from '@/lib/mock-data'
import { GitBranch, Settings2 } from 'lucide-react'

export default function TelemetryPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      case 'running':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      case 'cancelled':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
      default:
        return 'bg-card'
    }
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Telemetry Explorer</h1>
            <p className="text-muted-foreground">
              Connected CI/CD pipelines and workflow telemetry
            </p>
          </div>
          <Button className="gap-2">
            <Settings2 className="w-4 h-4" />
            Sync Telemetry
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Workflows</p>
            <p className="text-3xl font-bold text-foreground">{mockTelemetryData.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Success Rate</p>
            <p className="text-3xl font-bold text-foreground">92%</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Avg Duration</p>
            <p className="text-3xl font-bold text-foreground">4m 32s</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Runs</p>
            <p className="text-3xl font-bold text-foreground">2,495</p>
          </Card>
        </div>

        {/* GitHub Actions */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <GitBranch className="w-6 h-6" />
            GitHub Actions
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockTelemetryData
              .filter((t) => t.source === 'github')
              .map((telemetry) => (
                <Card key={telemetry.workflow_name} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{telemetry.workflow_name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {telemetry.runs_count.toLocaleString()} total runs
                      </p>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full font-medium text-xs ${getStatusColor(telemetry.status)}`}
                    >
                      {telemetry.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium text-foreground">{telemetry.duration}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Run</span>
                      <span className="font-medium text-foreground">
                        {new Date(telemetry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>

        {/* Jenkins */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Settings2 className="w-6 h-6" />
            Jenkins
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockTelemetryData
              .filter((t) => t.source === 'jenkins')
              .map((telemetry) => (
                <Card key={telemetry.workflow_name} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{telemetry.workflow_name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {telemetry.runs_count.toLocaleString()} total runs
                      </p>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full font-medium text-xs ${getStatusColor(telemetry.status)}`}
                    >
                      {telemetry.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium text-foreground">{telemetry.duration}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Run</span>
                      <span className="font-medium text-foreground">
                        {new Date(telemetry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
