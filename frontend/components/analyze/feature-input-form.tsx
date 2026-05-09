'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import type { AnalysisRequest, AnalysisResponse } from '@/lib/api-types'

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

interface FeatureInputFormProps {
  onAnalysisComplete: (result: AnalysisResponse) => void
}

export function FeatureInputForm({ onAnalysisComplete }: FeatureInputFormProps) {
  const [isLoading, setIsLoading] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await apiClient.analyzeCode(values as AnalysisRequest)
      onAnalysisComplete(response)
      toast.success('Analysis completed successfully!')
    } catch (error) {
      toast.error('Analysis failed. Please try again.')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6 sticky top-8">
      <h3 className="text-lg font-semibold text-foreground mb-6">Code Metrics</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{feature.min}</span>
              <span>{feature.max}</span>
            </div>
          </div>
        ))}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Analyzing...' : 'Analyze Code'}
        </Button>
      </form>

      {/* Info section */}
      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="font-medium text-sm text-foreground mb-3">About Metrics</h4>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">LOC:</span> Total lines of code
          </li>
          <li>
            <span className="font-medium text-foreground">CYCLO:</span> Code decision paths
          </li>
          <li>
            <span className="font-medium text-foreground">LENGTH:</span> Average function size
          </li>
        </ul>
      </div>
    </Card>
  )
}
