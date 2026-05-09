'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { AnalyzeSource } from '@/components/analyze/analyze-source'
import { AnalysisResults } from '@/components/analyze/analysis-results-improved'
import { Card } from '@/components/ui/card'
import { useState } from 'react'
import type { AnalysisResponse } from '@/lib/api-types'

export default function AnalyzePage() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalysisStart = (config: any) => {
    setIsAnalyzing(true)
  }

  const handleAnalysisComplete = (result: AnalysisResponse) => {
    setAnalysisResult(result)
    setIsAnalyzing(false)
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Analyze Pipeline</h1>
          <p className="text-muted-foreground">
            Select a source and analyze code for real-time risk assessment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Analyze Source */}
          <div className="lg:col-span-2">
            <AnalyzeSource
              onAnalysisStart={handleAnalysisStart}
              onAnalysisComplete={handleAnalysisComplete}
              isLoading={isAnalyzing}
            />
          </div>

          <div className="lg:col-span-3">
            {(analysisResult || isAnalyzing) ? (
              <AnalysisResults result={analysisResult} isAnalyzing={isAnalyzing} />
            ) : (
              <Card className="p-8 h-full flex flex-col items-center justify-center text-center sticky top-8">
                <div className="text-muted-foreground max-w-sm">
                  <p className="text-lg font-medium mb-2">Ready for Analysis</p>
                  <p className="text-sm mb-4">
                    Select a source on the left to start analyzing your deployment pipeline
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    💡 Tip: Use Telemetry mode to analyze existing workflow runs
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
