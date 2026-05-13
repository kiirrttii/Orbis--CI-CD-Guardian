'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'
import { OrchestrationEvent } from '@/lib/api-types'
import { 
  Activity, 
  Terminal, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCcw, 
  Eye, 
  Play,
  Wrench,
  Package,
  Server,
  ShieldCheck,
  Zap
} from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { JenkinsConfig } from './jenkins-config'

export function EventsFeed() {
  const [events, setEvents] = useState<OrchestrationEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<OrchestrationEvent | null>(null)
  const [simulating, setSimulating] = useState(false)

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const data = await apiClient.getRecentEvents(10)
      setEvents(data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const simulate = async (type: string) => {
    setSimulating(true)
    try {
      await apiClient.simulateEvent(type)
      await fetchEvents()
    } catch (error) {
      console.error('Simulation failed:', error)
    } finally {
      setSimulating(false)
    }
  }

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, 10000)
    return () => clearInterval(interval)
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'ERROR': return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'WARNING': return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      case 'SUCCESS': return 'text-green-500 bg-green-500/10 border-green-500/20'
      case 'INFO': return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      default: return 'text-muted-foreground bg-muted border-border'
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Jenkins': return <Settings className="w-4 h-4" />
      case 'Ansible': return <Activity className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Live Operational Events</h2>
          <p className="text-sm text-muted-foreground">Real-time telemetry from integrated DevOps tools</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchEvents} 
            disabled={loading}
            className="gap-2"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {events.length === 0 && !loading ? (
          <Card className="p-12 text-center bg-muted/10 border-dashed flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center">
              <Activity className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">No operational events received yet</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                Connect Jenkins or Ansible and trigger real activity to begin ingesting telemetry.
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-[10px] uppercase font-bold">Waiting for Webhooks</Badge>
            </div>
          </Card>
        ) : (
          events.map((event) => (
            <Card 
              key={event.id} 
              className="p-4 hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => setSelectedEvent(event)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getSeverityColor(event.severity)}`}>
                    {getSourceIcon(event.source)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-tight opacity-70">{event.source}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getSeverityColor(event.severity)} font-medium`}>
                        {event.event_type}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {event.source === 'Jenkins' 
                        ? `Build #${event.normalized_data.build_id} for ${event.normalized_data.pipeline_name}`
                        : `Playbook ${event.normalized_data.playbook_name} - ${event.normalized_data.task_name}`}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(event.created_at).toLocaleTimeString()}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Zap className="w-3 h-3" />
                        Impact: {event.operational_impact}
                      </div>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-4 h-4 mr-2" />
                  Inspect
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Event Inspector Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="uppercase text-xs font-bold opacity-50">{selectedEvent?.source}</span>
              <span>Event Details</span>
            </DialogTitle>
            <DialogDescription>
              Technical inspection of normalized operational telemetry
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Event Type</p>
                <p className="text-sm font-mono bg-muted p-2 rounded border">{selectedEvent?.event_type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Severity</p>
                <p className={`text-sm font-mono p-2 rounded border ${selectedEvent ? getSeverityColor(selectedEvent.severity) : ''}`}>
                  {selectedEvent?.severity}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Tabs defaultValue="normalized" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="normalized">Normalized Data</TabsTrigger>
                  <TabsTrigger value="raw">Raw Payload</TabsTrigger>
                </TabsList>
                <TabsContent value="normalized" className="mt-2">
                  <pre className="text-xs bg-muted/50 p-4 rounded-lg border overflow-x-auto font-mono max-h-[300px]">
                    {JSON.stringify(selectedEvent?.normalized_data, null, 2)}
                  </pre>
                </TabsContent>
                <TabsContent value="raw" className="mt-2">
                  <pre className="text-xs bg-muted/50 p-4 rounded-lg border overflow-x-auto font-mono max-h-[300px]">
                    {JSON.stringify((selectedEvent as any)?.raw_payload || { message: "No raw payload stored for this event" }, null, 2)}
                  </pre>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Operational Metadata</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                <div className="flex justify-between border-b py-1">
                  <span className="text-muted-foreground">Event ID</span>
                  <span className="font-mono">{selectedEvent?.id}</span>
                </div>
                <div className="flex justify-between border-b py-1">
                  <span className="text-muted-foreground">Timestamp</span>
                  <span>{selectedEvent && new Date(selectedEvent.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b py-1">
                  <span className="text-muted-foreground">Impact Score</span>
                  <span>{selectedEvent?.operational_impact}</span>
                </div>
                <div className="flex justify-between border-b py-1">
                  <span className="text-muted-foreground">Status</span>
                  <span className="capitalize">{selectedEvent?.status}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
