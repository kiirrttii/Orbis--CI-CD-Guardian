'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import type { AnalysisRequest, AnalysisResponse } from '@/lib/api-types'

interface AdvancedMetricsModeProps {
  onAnalysisStart: (config: any) => void
  onAnalysisComplete: (result: AnalysisResponse) => void
  isLoading: boolean
}

const features = [
  { key: 'LOC', label: 'Lines of Code', min: 10, max: 2000, step: 10 },
  { key: 'CYCLO', label: 'Cyclomatic Complexity', min: 1, max: 50, step: 1 },
  { key: 'LENGTH', label: 'Function Length', min: 5, max: 1000, step: 5 },
  { key: 'VOLUME', label: 'Code Volume', min: 100, max: 5000, step: 50 },
  { key: 'DIFFICULTY', label: 'Difficulty', min: 1, max: 50, step: 1 },
  { key: 'INT_FAN_IN', label: 'Internal Fan-In', min: 1, max: 20, step: 1 },
  { key: 'INT_FAN_OUT', label: 'Internal Fan-Out', min: 1, max: 20, step: 1 },
  { key: 'NUM_OPERATORS', label: 'Number of Operators', min: 5, max: 200, step: 5 },
  { key: 'NUM_OPERANDS', label: 'Number of Operands', min: 5, max: 200, step: 5 },
  { key: 'BRANCH_COUNT', label: 'Branch Count', min: 1, max: 30, step: 1 },
]

export function AdvancedMetricsMode({
  onAnalysisStart,
  onAnalysisComplete,
  isLoading,
}: AdvancedMetricsModeProps) {
  const [expanded, setExpanded] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)
  const [values, setValues] = useState<Record<string, number>>({
    LOC: 150,
    CYCLO: 8,
    LENGTH: 200,
    VOLUME: 1000,
    DIFFICULTY: 10,
    INT_FAN_IN: 3,
    INT_FAN_OUT: 5,
    NUM_OPERATORS: 30,
    NUM_OPERANDS: 40,
    BRANCH_COUNT: 5,
  })

  const handleSliderChange = (key: string, value: number[]) => {
    setValues((prev) => ({ ...prev, [key]: value[0] }))
  }

  const handleAnalyze = async () => {
    setLocalLoading(true)
    onAnalysisStart({ type: 'advanced', metrics: values })

    try {
      // Normalize values before sending to API (backend expects [0.0, 1.0])
      const normalizedValues: any = {}
      features.forEach(f => {
        const raw = values[f.key]
        normalizedValues[f.key] = Math.min(1.0, raw / f.max)
      })

      const response = await apiClient.analyzeCode(normalizedValues as AnalysisRequest)
      onAnalysisComplete(response)
      toast.success('Analysis completed successfully!')
    } catch (error) {
      toast.error('Analysis failed. Please try again.')
      console.error(error)
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Warning Card */}
      <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <span className="font-semibold">Advanced mode for developers:</span> Manually configure
          ML metrics for testing and research. Use Telemetry or Repository mode for production
          analysis.
        </p>
      </Card>

      {/* Collapsible Metrics Section */}
      <Card className={`border transition-all ${expanded ? 'border-primary/50' : 'border-border'}`}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-6 flex items-center justify-between hover:bg-card/50 transition-colors"
        >
          <div className="text-left">
            <h3 className="text-lg font-semibold text-foreground">ML Feature Metrics</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {Object.values(values).reduce((a, b) => a + b) > 0 ? 'Custom values configured' : 'Use defaults'}
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {expanded && (
          <div className="border-t border-border p-6 space-y-6">
            {features.map((feature) => (
              <div key={feature.key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">{feature.label}</label>
                  <span className="text-sm font-bold text-primary">{values[feature.key]}</span>
                </div>
                <Slider
                  min={feature.min}
                  max={feature.max}
                  step={feature.step}
                  value={[values[feature.key]]}
                  onValueChange={(value) => handleSliderChange(feature.key, value)}
                  className="w-full"
                  disabled={localLoading || isLoading}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{feature.min}</span>
                  <span>{feature.max}</span>
                </div>
              </div>
            ))}

            {/* Metrics Info */}
            <div className="pt-4 border-t border-border">
              <h4 className="font-medium text-sm text-foreground mb-3">Metric Descriptions</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">LOC:</span> Total lines of code
                </li>
                <li>
                  <span className="font-medium text-foreground">CYCLO:</span> Cyclomatic
                  complexity (decision branches)
                </li>
                <li>
                  <span className="font-medium text-foreground">LENGTH:</span> Average function
                  length
                </li>
                <li>
                  <span className="font-medium text-foreground">VOLUME:</span> Code volume
                  (space/entropy)
                </li>
                <li>
                  <span className="font-medium text-foreground">DIFFICULTY:</span> Halstead
                  difficulty metric
                </li>
              </ul>
            </div>
          </div>
        )}
      </Card>

      {/* Action Button */}
      <Button
        onClick={handleAnalyze}
        disabled={localLoading || isLoading}
        className="w-full"
        size="lg"
      >
        {localLoading || isLoading ? 'Analyzing Metrics...' : 'Analyze Metrics'}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )
}
