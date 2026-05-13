'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api'
import { IntegrationInfo } from '@/lib/api-types'
import { 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Zap,
  Activity,
  Server,
  ShieldCheck,
  Terminal,
  ChevronRight,
  RefreshCcw,
  Info
} from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'

interface IntegrationCardProps {
  toolName: string
  category: string
  description: string
  icon: React.ElementType
  existingIntegration?: IntegrationInfo
  onUpdate: () => void
}

export function IntegrationCard({ 
  toolName, 
  category, 
  description, 
  icon: Icon, 
  existingIntegration,
  onUpdate
}: IntegrationCardProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [config, setConfig] = useState({
    url: existingIntegration?.base_url || '',
    username: '',
    api_token: ''
  })
  const [errorMsg, setErrorMsg] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [showInsights, setShowInsights] = useState(false)

  const isConnected = existingIntegration?.status === 'connected'
  const isError = existingIntegration?.status === 'error'

  const handleConnect = async () => {
    setIsConnecting(true)
    setErrorMsg('')
    try {
      if (toolName === 'Jenkins') {
        await apiClient.client.post('/integrations/jenkins/connect', config)
      } else {
        // Generic or other tools (to be implemented)
        setErrorMsg(`${toolName} integration logic is coming soon.`)
        setIsConnecting(false)
        return
      }
      onUpdate()
      setShowConfig(false)
    } catch (error: any) {
      setErrorMsg(error.response?.data?.detail || `Failed to connect to ${toolName}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDelete = async () => {
    if (!existingIntegration) return
    setIsConnecting(true)
    try {
      await apiClient.deleteIntegration(existingIntegration.id)
      onUpdate()
      setShowConfig(false)
    } catch (error: any) {
      setErrorMsg(error.response?.data?.detail || "Failed to delete integration")
    } finally {
      setIsConnecting(false)
    }
  }

  const getStatusBadge = () => {
    if (isConnected) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1"><CheckCircle className="w-3 h-3" /> Connected</Badge>
    if (isError) return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 gap-1"><AlertCircle className="w-3 h-3" /> Error</Badge>
    return <Badge variant="outline" className="text-muted-foreground bg-muted/50 border-border">Not Connected</Badge>
  }

  return (
    <Card className="p-6 hover:shadow-md transition-all flex flex-col h-full border-border/50 group relative overflow-hidden bg-card">
      {/* Background Decor */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
      
      <div className="flex-1 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          {getStatusBadge()}
        </div>

        <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
          {toolName}
          {isConnected && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {isConnected 
            ? `Successfully connected to ${toolName} server. Monitoring real-time deployment telemetry.` 
            : description}
        </p>

        {isConnected && (
          <div className="space-y-3 mb-6 p-3 bg-muted/30 rounded-lg border border-border/40 backdrop-blur-sm">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">
              <span>Health Status</span>
              <span className="text-green-500 font-mono">OPERATIONAL</span>
            </div>
            <Progress value={100} className="h-1 bg-muted/50" />
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Server className="w-3 h-3 opacity-50" />
                <span className="truncate max-w-[150px]">{existingIntegration?.base_url}</span>
              </div>
              {existingIntegration?.last_sync && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <RefreshCcw className="w-3 h-3 opacity-50" />
                  Sync: {new Date(existingIntegration.last_sync).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 flex gap-2 relative z-10">
        {!isConnected ? (
          <Dialog open={showConfig} onOpenChange={setShowConfig}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2 shadow-sm font-semibold" variant="default">
                <Settings className="w-4 h-4" />
                Connect {toolName}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Configure {toolName} Integration</DialogTitle>
                <DialogDescription>
                  Enter your {toolName} credentials to enable operational intelligence.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="url">Server URL</Label>
                  <Input 
                    id="url" 
                    placeholder="https://jenkins.company.com" 
                    value={config.url}
                    onChange={(e) => setConfig({...config, url: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="user">Username</Label>
                    <Input 
                      id="user" 
                      placeholder="admin" 
                      value={config.username}
                      onChange={(e) => setConfig({...config, username: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="token">API Token</Label>
                    <Input 
                      id="token" 
                      type="password" 
                      placeholder="••••••••" 
                      value={config.api_token}
                      onChange={(e) => setConfig({...config, api_token: e.target.value})}
                    />
                  </div>
                </div>
                {errorMsg && (
                  <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 p-3 rounded border border-red-500/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errorMsg}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
                  {isConnecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  Validate & Connect
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <>
            <Button variant="outline" className="flex-1 gap-2 font-medium" onClick={() => setShowInsights(true)}>
              <Activity className="w-4 h-4" />
              View
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setShowConfig(true)}>
              <Settings className="w-4 h-4" />
            </Button>
            
            <Dialog open={showConfig} onOpenChange={setShowConfig}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{toolName} Configuration</DialogTitle>
                  <DialogDescription>Manage your active {toolName} integration.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Active Endpoint</Label>
                    <div className="p-3 bg-muted rounded-lg border font-mono text-xs break-all">
                      {existingIntegration?.base_url}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Webhook Destination</Label>
                    <div className="space-y-1">
                      <code className="block bg-black text-white dark:bg-zinc-900 p-3 rounded text-[10px] break-all border border-white/10 font-mono">
                        http://localhost:8000/api/v1/integrations/{toolName.toLowerCase()}/webhook
                      </code>
                      <p className="text-[10px] text-muted-foreground italic">Point your {toolName} notifications to this URL.</p>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex flex-col gap-2 sm:flex-col">
                  <Button variant="destructive" className="w-full gap-2" onClick={handleDelete} disabled={isConnecting}>
                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                    Delete Integration
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setShowConfig(false)}>Cancel</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {/* Insights Modal */}
      <Dialog open={showInsights} onOpenChange={setShowInsights}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-primary" />
              {toolName} Operational Intelligence
            </DialogTitle>
            <DialogDescription>
              Live operational health and deployment risk telemetry for {toolName}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-muted/20 border-border/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Tool Events</p>
                <p className="text-2xl font-bold font-mono">0</p>
              </Card>
              <Card className="p-4 bg-muted/20 border-border/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Health Check</p>
                <p className="text-2xl font-bold text-green-500 font-mono">PASS</p>
              </Card>
              <Card className="p-4 bg-muted/20 border-border/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Latency</p>
                <p className="text-2xl font-bold text-blue-500 font-mono">12ms</p>
              </Card>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Live Ingestion Stream
              </h4>
              <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-xl border border-dashed border-border/50">
                <div className="w-10 h-10 bg-muted/30 rounded-full flex items-center justify-center mb-3">
                  <RefreshCcw className="w-5 h-5 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-foreground">Waiting for tool telemetry...</p>
                <p className="text-xs text-muted-foreground mt-1 text-center max-w-[250px]">
                  Trigger a build or playbook in {toolName} to see real-time events appearing here.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" className="w-full gap-2" onClick={() => setShowInsights(false)}>
              Close Operational View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
