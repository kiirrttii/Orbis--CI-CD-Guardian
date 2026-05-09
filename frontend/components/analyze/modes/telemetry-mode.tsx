'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, ArrowRight, Clock } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { mockTelemetryData } from '@/lib/mock-data'
import { toast } from 'sonner'
import type { AnalysisResponse, TelemetryData } from '@/lib/api-types'

interface TelemetryModeProps {
  onAnalysisStart: (config: any) => void
  onAnalysisComplete: (result: AnalysisResponse) => void
  isLoading: boolean
}

export function TelemetryMode({
  onAnalysisStart,
  onAnalysisComplete,
  isLoading,
}: TelemetryModeProps) {
  const [selectedRun, setSelectedRun] = useState<TelemetryData | null>(null)
  const [localLoading, setLocalLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleAnalyze = async () => {
    if (!selectedRun) {
      toast.error('Please select a workflow run')
      return
    }

    setLocalLoading(true)
    onAnalysisStart({ type: 'telemetry', run: selectedRun })

    try {
      console.log('[TelemetryMode] Analyzing workflow run:', selectedRun.workflow_run_id)
      const response = await apiClient.analyzeTelemetry({
        workflow_run_id: selectedRun.workflow_run_id
      })
      console.log('[TelemetryMode] Analysis response:', response)
      onAnalysisComplete(response)
      toast.success('Telemetry analysis completed!')
    } catch (error: any) {
      const errorData = error.response?.data?.detail
      const errorMsg = typeof errorData === 'object' ? errorData.message : errorData || error.message || 'Analysis failed. Please try again.'
      toast.error(errorMsg)
      console.error('[TelemetryMode] Analysis failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Recent Runs */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Recent Workflow Runs
        </label>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {mockTelemetryData.map((run) => (
            <div
              key={`${run.source}-${run.workflow_name}`}
              onClick={() => setSelectedRun(run)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedRun === run
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-card/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{run.workflow_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {run.source} • {run.runs_count} total runs
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded capitalize ${
                    run.status === 'success'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : run.status === 'running'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}
                >
                  {run.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{run.duration}s</span>
                </div>
                <span>
                  {isMounted ? new Date(run.timestamp).toLocaleTimeString() : '...'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Run Preview */}
      {selectedRun && (
        <Card className="p-4 bg-card/50 border-primary/20">
          <div className="flex gap-3">
            <Database className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm mb-1">
                Selected: {selectedRun.workflow_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedRun.runs_count} total workflow runs available for analysis
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Action Button */}
      <Button
        onClick={handleAnalyze}
        disabled={localLoading || isLoading || !selectedRun}
        className="w-full"
        size="lg"
      >
        {localLoading || isLoading ? 'Analyzing Telemetry...' : 'Analyze Selected Run'}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

      {/* Recommended Badge */}
      <div className="text-center text-xs text-muted-foreground pt-2">
        <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded">
          ⭐ Recommended workflow
        </span>
      </div>
    </div>
  )
}
