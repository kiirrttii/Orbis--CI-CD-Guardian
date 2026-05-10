'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { mockIntegrations } from '@/lib/mock-data'
import { ExternalLink, CheckCircle, AlertCircle, Zap, ArrowRight, Terminal, Settings, Package, Server, ShieldCheck, Activity, ChevronRight } from 'lucide-react'

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

        {/* Workflow Explanation */}
        {/* Workflow Explanation */}
        <div className="mb-8 w-full relative rounded-2xl overflow-hidden border border-border/50 shadow-sm">
          {/* Adaptive Premium Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-orange-50/40 to-amber-100/50 dark:from-[#3e1f0e]/80 dark:via-[#261005]/80 dark:to-background z-0" />
          
          {/* Subtle Ambient Glows */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-400/20 dark:bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 z-0 mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-400/20 dark:bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 z-0 mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
          
          <div className="relative z-10 p-6">
            <h3 className="text-sm font-semibold text-foreground/80 mb-6 uppercase tracking-wider pl-1">How Orbis Connects Your Tools</h3>
            <div className="flex items-center gap-3 overflow-x-auto pb-4 px-1 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {[
                { id: 1, title: 'Code Changes', subtitle: 'Push to repository', icon: Terminal },
                { id: 2, title: 'Jenkins Builds', subtitle: 'CI/CD pipeline', icon: Settings },
                { id: 3, title: 'Docker Packages', subtitle: 'Containerization', icon: Package },
                { id: 4, title: 'Kubernetes Deploys', subtitle: 'Orchestration', icon: Server },
                { id: 5, title: 'Sonar & ZAP', subtitle: 'Security & quality', icon: ShieldCheck },
                { id: 6, title: 'Prometheus & Grafana', subtitle: 'Monitoring', icon: Activity },
              ].map((step, i) => (
                <div key={step.id} className="flex items-center gap-3 shrink-0 snap-start">
                  <div className="group relative bg-white/60 dark:bg-black/40 backdrop-blur-md border border-border/50 rounded-xl p-3 flex items-center gap-3 hover:border-primary/40 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-default">
                    <div className="bg-background/80 rounded-lg p-2 group-hover:bg-primary/10 transition-colors">
                      <step.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                    </div>
                  </div>
                  {i < 5 && <ChevronRight className="w-5 h-5 text-muted-foreground/30 shrink-0" />}
                </div>
              ))}
              
              <div className="flex items-center gap-3 shrink-0 snap-start">
                <ChevronRight className="w-5 h-5 text-primary/40 shrink-0" />
                <div className="group relative bg-white/80 dark:bg-black/60 backdrop-blur-md border border-primary/30 rounded-xl p-3 flex items-center gap-3 hover:border-primary/60 hover:shadow-[0_4px_20px_rgba(var(--primary),0.15)] hover:-translate-y-1 transition-all duration-300 cursor-default overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="bg-primary/20 rounded-lg p-2 relative z-10 shadow-[0_0_10px_rgba(var(--primary),0.2)]">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div className="relative z-10 pr-2">
                    <p className="text-sm font-bold text-primary">Orbis Analyzes Risk</p>
                    <p className="text-xs text-primary/80">Deployment insights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 shadow-sm">
            <p className="text-sm text-muted-foreground mb-2">Connected Tools</p>
            <p className="text-3xl font-bold text-foreground">
              {mockIntegrations.filter((i) => i.status === 'connected').length}
            </p>
          </Card>
          <Card className="p-6 shadow-sm">
            <p className="text-sm text-muted-foreground mb-2">Healthy Status</p>
            <p className="text-3xl font-bold text-status-low">
              {mockIntegrations.filter((i) => i.health === 'healthy').length}
            </p>
          </Card>
          <Card className="p-6 shadow-sm">
            <p className="text-sm text-muted-foreground mb-2">Sync Status</p>
            <p className="text-3xl font-bold text-status-medium">
              {mockIntegrations.filter((i) => i.last_sync).length}
            </p>
          </Card>
        </div>

        {/* Integration Categories */}
        <div className="space-y-12">
          {[
            {
              title: 'CI/CD & Automation',
              description: 'Tools that help teams build, test, and deploy applications automatically.',
            },
            {
              title: 'Containerization & Orchestration',
              description: 'Tools used to package applications and keep them running reliably at scale.',
            },
            {
              title: 'Security & Code Quality',
              description: 'Tools that scan applications for bugs, security issues, and risky code changes.',
            },
            {
              title: 'Monitoring & Observability',
              description: 'Tools that track system health, performance, and operational activity in real time.',
            },
          ].map((category) => (
            <div key={category.title} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2 mb-2">{category.title}</h2>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 items-stretch">
                {mockIntegrations
                  .filter((integration) => (integration as any).category === category.title)
                  .map((integration) => (
                    <Card key={integration.name} className="p-6 hover:shadow-md transition-shadow flex flex-col h-full shadow-sm">
                      <div className="flex-1">
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
                      </div>

                      <div className="mt-4 pt-4 border-t border-border/50">
                        {integration.last_sync && (
                          <p className="text-xs text-muted-foreground mb-4">
                            Last sync: {new Date(integration.last_sync).toLocaleString()}
                          </p>
                        )}

                        <Button variant="outline" className="w-full gap-2 justify-center">
                          <ExternalLink className="w-4 h-4" />
                          {integration.status === 'connected' ? 'View' : 'Connect'}
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
