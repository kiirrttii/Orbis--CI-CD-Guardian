'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { mockIntegrations } from '@/lib/mock-data'
import { ExternalLink, CheckCircle, AlertCircle, Zap } from 'lucide-react'

export default function MonitoringPage() {
  const getHealthColor = (health?: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400'
      case 'degraded':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-muted-foreground'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      case 'disconnected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      case 'error':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
      default:
        return 'bg-card'
    }
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Monitoring & Dev Tools</h1>
          <p className="text-muted-foreground">
            Manage integrations with monitoring and development platforms
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Connected Tools</p>
            <p className="text-3xl font-bold text-foreground">
              {mockIntegrations.filter((i) => i.status === 'connected').length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Healthy Status</p>
            <p className="text-3xl font-bold text-status-low">
              {mockIntegrations.filter((i) => i.health === 'healthy').length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Sync Status</p>
            <p className="text-3xl font-bold text-status-medium">
              {mockIntegrations.filter((i) => i.last_sync).length}
            </p>
          </Card>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockIntegrations.map((integration) => (
            <Card key={integration.name} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBg(integration.status)}`}>
                  {integration.status}
                </span>
              </div>

              <h3 className="font-semibold text-foreground mb-2">{integration.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>

              {integration.health && (
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <div className={`flex items-center gap-1 ${getHealthColor(integration.health)}`}>
                    {integration.health === 'healthy' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="capitalize">{integration.health}</span>
                  </div>
                </div>
              )}

              {integration.last_sync && (
                <p className="text-xs text-muted-foreground mb-4">
                  Last sync: {new Date(integration.last_sync).toLocaleString()}
                </p>
              )}

              <Button variant="outline" className="w-full gap-2 justify-center">
                <ExternalLink className="w-4 h-4" />
                {integration.status === 'connected' ? 'View' : 'Connect'}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
