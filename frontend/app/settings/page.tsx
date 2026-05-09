'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { Moon, Sun, Mail, Key, CheckCircle, AlertCircle, Monitor, Settings, Zap, Download, Bell, Cog } from 'lucide-react'
import { useState, useEffect } from 'react'
import { mockIntegrations } from '@/lib/mock-data'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'appearance' | 'profile' | 'backend' | 'integrations' | 'preferences'>('appearance')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <AppLayout>
      <div className="p-8 space-y-8 max-w-6xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your workspace, integrations, and preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border overflow-x-auto">
          {[
            { id: 'appearance' as const, label: 'Appearance', icon: Monitor },
            { id: 'profile' as const, label: 'Profile', icon: Settings },
            { id: 'backend' as const, label: 'Backend', icon: Zap },
            { id: 'integrations' as const, label: 'Integrations', icon: Cog },
            { id: 'preferences' as const, label: 'Preferences', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            {/* Theme Settings */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Theme</h2>
                  <p className="text-sm text-muted-foreground mt-1">Choose your preferred color theme</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor },
                ].map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value as any)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        theme === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2 text-foreground" />
                      <p className="font-medium text-foreground">{option.label}</p>
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Accent Color Preview */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Accent Colors</h2>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { name: 'Primary Orange', color: '#ff7a00' },
                  { name: 'Secondary Pink', color: '#ff4fa3' },
                  { name: 'Accent Cyan', color: '#38bdf8' },
                  { name: 'Success Green', color: '#22c55e' },
                ].map((accent) => (
                  <div key={accent.name} className="text-center">
                    <div
                      className="w-full h-24 rounded-lg mb-2 border-2 border-border hover:border-primary/50 transition-all cursor-pointer"
                      style={{ backgroundColor: accent.color }}
                    />
                    <p className="text-xs font-medium text-foreground">{accent.name}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">User Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                  <input
                    type="text"
                    defaultValue="Alex Johnson"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    defaultValue="alex@company.com"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                  <select className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>DevOps Engineer</option>
                    <option>Security Officer</option>
                    <option>Engineering Manager</option>
                    <option>Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Workspace</label>
                  <input
                    type="text"
                    defaultValue="Acme Corporation"
                    disabled
                    className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>

                <Button className="w-full">Save Changes</Button>
              </div>
            </Card>

            {/* Account Security */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Account Security</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Change Password</p>
                    <p className="text-xs text-muted-foreground">Update your account password</p>
                  </div>
                  <Button variant="outline" size="sm">Change</Button>
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Backend Tab */}
        {activeTab === 'backend' && (
          <div className="space-y-6">
            {/* Backend Status */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Backend Services</h2>
              <div className="space-y-3">
                {[
                  { name: 'ML Prediction Engine', status: 'healthy', latency: '120ms' },
                  { name: 'Telemetry Processor', status: 'healthy', latency: '85ms' },
                  { name: 'SHAP Generator', status: 'healthy', latency: '230ms' },
                  { name: 'Cache Layer', status: 'degraded', latency: '450ms' },
                ].map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{service.name}</p>
                      <p className="text-xs text-muted-foreground">API Latency: {service.latency}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {service.status === 'healthy' ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-status-low" />
                          <span className="text-sm font-medium text-status-low">Healthy</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-status-high" />
                          <span className="text-sm font-medium text-status-high">Degraded</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* API Configuration */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">API Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Base URL
                  </label>
                  <input
                    type="text"
                    defaultValue="http://localhost:8000/api/v1"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">Test Connection</Button>
                  <Button variant="outline">View Documentation</Button>
                </div>
              </div>
            </Card>

            {/* Environment Info */}
            <Card className="p-6 bg-card/50">
              <h2 className="text-lg font-semibold text-foreground mb-4">System Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Environment</p>
                  <p className="font-medium text-foreground">Production</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Uptime</p>
                  <p className="font-medium text-foreground">24 days, 6h</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Model Version</p>
                  <p className="font-medium text-foreground">1.0.5</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium text-foreground">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <Card className="p-6 bg-primary/5 border-primary/20">
              <p className="text-sm text-primary">
                Manage your connected CI/CD platforms, monitoring tools, and external services.
              </p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockIntegrations.map((integration) => (
                <Card key={integration.name} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{integration.name}</p>
                      <p className="text-xs text-muted-foreground">{integration.description}</p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        integration.status === 'connected'
                          ? 'bg-green-100 dark:bg-green-900/30 text-status-low'
                          : 'bg-red-100 dark:bg-red-900/30 text-status-critical'
                      }`}
                    >
                      {integration.status === 'connected' ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>

                  {integration.status === 'connected' && integration.last_sync && (
                    <div className="text-xs text-muted-foreground mb-3">
                      <p>Last sync: {new Date(integration.last_sync).toLocaleTimeString()}</p>
                      {integration.health && (
                        <p className="mt-1">
                          Health:{' '}
                          <span
                            className={
                              integration.health === 'healthy'
                                ? 'text-status-low'
                                : 'text-status-high'
                            }
                          >
                            {integration.health}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {integration.status === 'connected' ? 'Reconfigure' : 'Connect'}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Export & Data</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Default Export Format</p>
                    <p className="text-xs text-muted-foreground">Choose your preferred report format</p>
                  </div>
                  <select className="px-3 py-1 border border-border rounded bg-background text-foreground text-sm">
                    <option>PDF</option>
                    <option>Excel</option>
                    <option>JSON</option>
                    <option>CSV</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Telemetry Refresh Interval</p>
                    <p className="text-xs text-muted-foreground">How often to sync new workflow data</p>
                  </div>
                  <select className="px-3 py-1 border border-border rounded bg-background text-foreground text-sm">
                    <option>Every 5 minutes</option>
                    <option>Every 15 minutes</option>
                    <option>Every 30 minutes</option>
                    <option>Every hour</option>
                  </select>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Notifications</h2>
              <div className="space-y-3">
                {[
                  { label: 'Critical Alerts', description: 'Deployment risk above 75%' },
                  { label: 'Analysis Complete', description: 'When reports are ready' },
                  { label: 'Telemetry Updates', description: 'New workflow runs detected' },
                  { label: 'System Status', description: 'Backend health changes' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Display Options</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Compact Mode</p>
                    <p className="text-xs text-muted-foreground">Condensed UI elements</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 rounded" />
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Show Onboarding Tips</p>
                    <p className="text-xs text-muted-foreground">Display helpful hints</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                </div>
              </div>
            </Card>

            {/* Data Management */}
            <Card className="p-6 border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20">
              <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-4">Data Management</h2>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export All Data
              </Button>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
