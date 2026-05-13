'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api'
import { 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  Link as LinkIcon
} from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog'

export function JenkinsConfig() {
  const [config, setConfig] = useState({
    url: '',
    username: '',
    api_token: ''
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [jenkinsVersion, setJenkinsVersion] = useState('')
  const [showWebhookInstructions, setShowWebhookInstructions] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    setStatus('idle')
    setErrorMsg('')
    try {
      const response = await apiClient.client.post('/integrations/jenkins/connect', config)
      setStatus('success')
      setJenkinsVersion(response.data.jenkins_version)
      setShowWebhookInstructions(true)
    } catch (error: any) {
      setStatus('error')
      setErrorMsg(error.response?.data?.detail || 'Failed to connect to Jenkins')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          Connect Jenkins
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect Jenkins Pipeline</DialogTitle>
          <DialogDescription>
            Configure Orbis to ingest real-time telemetry from your Jenkins server.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="url">Jenkins Server URL</Label>
            <Input 
              id="url" 
              placeholder="https://jenkins.yourdomain.com" 
              value={config.url}
              onChange={(e) => setConfig({...config, url: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="admin" 
                value={config.username}
                onChange={(e) => setConfig({...config, username: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">API Token</Label>
              <Input 
                id="token" 
                type="password" 
                placeholder="••••••••••••••••" 
                value={config.api_token}
                onChange={(e) => setConfig({...config, api_token: e.target.value})}
              />
            </div>
          </div>

          {status === 'error' && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">Successfully Connected!</p>
                <p className="text-xs text-green-600 dark:text-green-400">Jenkins Version: {jenkinsVersion}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleConnect} 
            disabled={loading || !config.url || !config.username || !config.api_token}
            className="w-full"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LinkIcon className="w-4 h-4 mr-2" />}
            {status === 'success' ? 'Re-validate Connection' : 'Validate & Connect'}
          </Button>

          {status === 'success' && (
            <Button variant="secondary" className="w-full" onClick={() => setShowWebhookInstructions(true)}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View Webhook Setup Instructions
            </Button>
          )}
        </div>

        {/* Webhook Instructions Modal (Nested or separate) */}
        <Dialog open={showWebhookInstructions} onOpenChange={setShowWebhookInstructions}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Webhook Configuration</DialogTitle>
              <DialogDescription>
                Follow these steps to send real pipeline telemetry to Orbis.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <p className="font-semibold">1. Webhook URL</p>
                <code className="block bg-muted p-2 rounded border break-all text-xs">
                  http://localhost:8000/api/v1/integrations/jenkins/webhook
                </code>
              </div>
              <div className="space-y-2">
                <p className="font-semibold">2. Jenkins Plugin</p>
                <p className="text-muted-foreground">Use the <span className="font-mono text-primary">HTTP Request Plugin</span> or <span className="font-mono text-primary">Generic Webhook Trigger</span> in your Jenkinsfile.</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold">3. Payload Structure (JSON)</p>
                <pre className="bg-muted p-2 rounded border text-[10px] overflow-x-auto">
{`{
  "job_name": "\${JOB_NAME}",
  "build_number": \${BUILD_NUMBER},
  "status": "\${currentBuild.result}",
  "duration": \${currentBuild.duration},
  "url": "\${BUILD_URL}"
}`}
                </pre>
              </div>
            </div>
            <Button onClick={() => setShowWebhookInstructions(false)}>Got it!</Button>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
