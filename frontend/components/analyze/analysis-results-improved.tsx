'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Download, FileJson, Sheet, CheckCircle, Loader } from 'lucide-react'
import { RiskGauge } from './risk-gauge'
import { SHAPMini } from './shap-mini'
import type { AnalysisResponse } from '@/lib/api-types'
import { cn } from '@/lib/utils'

interface AnalysisResultsProps {
  result: AnalysisResponse | null
  isAnalyzing?: boolean
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return 'text-status-critical'
    case 'HIGH':
      return 'text-status-high'
    case 'MEDIUM':
      return 'text-status-medium'
    case 'LOW':
      return 'text-status-low'
    default:
      return 'text-foreground'
  }
}

function getSeverityBg(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-100 dark:bg-red-900/30'
    case 'HIGH':
      return 'bg-orange-100 dark:bg-orange-900/30'
    case 'MEDIUM':
      return 'bg-yellow-100 dark:bg-yellow-900/30'
    case 'LOW':
      return 'bg-green-100 dark:bg-green-900/30'
    default:
      return 'bg-card'
  }
}

type AnalysisStep = 'telemetry' | 'metrics' | 'prediction' | 'shap' | 'recommendations' | 'complete'

const STEPS: { id: AnalysisStep; label: string; description: string }[] = [
  { id: 'telemetry', label: 'Telemetry', description: 'Extracting CI/CD metrics' },
  { id: 'metrics', label: 'Metrics', description: 'Calculating code metrics' },
  { id: 'prediction', label: 'Prediction', description: 'Running risk prediction' },
  { id: 'shap', label: 'SHAP', description: 'Generating feature importance' },
  { id: 'recommendations', label: 'Recommendations', description: 'Generating recommendations' },
  { id: 'complete', label: 'Complete', description: 'Analysis finished' },
]

export function AnalysisResults({ result, isAnalyzing }: AnalysisResultsProps) {
  const [completedSteps, setCompletedSteps] = useState<AnalysisStep[]>([])
  const [isMounted, setIsMounted] = useState(false)

  const handleExportCSV = () => {
    if (!result) return

    const rows = [
      ['Metric', 'Value'],
      ['Prediction ID', result.prediction_id],
      ['Workflow Run ID', result.workflow_run_id],
      ['Risk Score', riskScore],
      ['Severity', severity],
      ['Model Version', result.inference.model_version],
      ['Timestamp', result.inference.timestamp],
      [],
      ['Feature', 'Impact (%)', 'Direction'],
      ...result.explainability.map(e => [e.feature, Math.round(e.impact_percent), e.direction === 'increase_risk' ? 'Increase Risk' : 'Decrease Risk']),
      [],
      ['Recommendation', 'Priority', 'Action Type'],
      ...result.recommendations.map(r => [r.title, r.priority, r.action_type])
    ]

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `analysis_${result.prediction_id}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isAnalyzing) {
      setCompletedSteps([])
      let currentIdx = 0
      const interval = setInterval(() => {
        if (currentIdx < STEPS.length) {
          const step = STEPS[currentIdx]
          if (step) {
            setCompletedSteps(prev => [...prev, step.id])
          }
          currentIdx++
        } else {
          clearInterval(interval)
        }
      }, 800)
      return () => clearInterval(interval)
    } else if (result) {
      setCompletedSteps(STEPS.map(s => s.id))
    }
  }, [isAnalyzing, result])

  if (!result && !isAnalyzing) return null

  const severity = result?.inference.severity || 'LOW'
  const riskScore = result?.inference.risk_score ? Math.round(result.inference.risk_score) : 0
  const severityColor = getSeverityColor(severity)
  const severityBg = getSeverityBg(severity)

  return (
    <div className="space-y-6">
      {/* Analysis Progress Timeline */}
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <h3 className="text-lg font-semibold text-foreground mb-6">Analysis Progress</h3>
        <div className="space-y-3">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-fit">
                {completedSteps.includes(step.id) ? (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary-foreground" />
                  </div>
                ) : idx <= completedSteps.length ? (
                  <div className="w-8 h-8 bg-primary/30 rounded-full flex items-center justify-center animate-pulse">
                    <Loader className="w-4 h-4 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-muted rounded-full" />
                )}
                <span className="text-sm font-medium text-foreground w-20">{step.label}</span>
              </div>
              <div className="flex-1 text-sm text-muted-foreground">{step.description}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Risk Overview Card */}
      <Card className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex items-center justify-center">
            <RiskGauge score={riskScore} severity={severity} />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Severity Level</p>
              <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${severityBg} ${severityColor}`}>
                {severity}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Model Version</p>
              <p className="text-2xl font-bold text-foreground">
                {result?.inference.model_version || 'v1.0.0'}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Analysis Confidence</p>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-black border shadow-sm",
                  result?.inference.confidence_level === 'HIGH' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                  result?.inference.confidence_level === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                  'bg-red-500/10 text-red-500 border-red-500/20'
                )}>
                  {result?.inference.confidence_level || 'LOW'}
                </span>
                <span className="text-xs text-muted-foreground">
                  (Based on {result ? (result.inference.confidence * 100).toFixed(1) : 0}% metric signal)
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Analysis Timestamp</p>
              <p className="text-sm text-foreground">
                {result ? (isMounted ? new Date(result.inference.timestamp).toLocaleString() : 'Loading...') : 'Analyzing...'}
              </p>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" size="sm" className="flex-1" disabled={!result} onClick={() => window.print()}>
                <Download className="w-4 h-4 mr-2" />
                Print/PDF
              </Button>
              <Button variant="outline" size="sm" className="flex-1" disabled={!result} onClick={handleExportCSV}>
                <Sheet className="w-4 h-4 mr-2" />
                CSV/Excel
              </Button>
              <Button variant="outline" size="sm" className="flex-1" disabled={!result} onClick={() => {
                const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `analysis_${result?.prediction_id}.json`
                link.click()
              }}>
                <FileJson className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="shap" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shap">SHAP Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        {/* SHAP Tab */}
        <TabsContent value="shap" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Feature Importance</h3>
            {result ? (
              <SHAPMini explainability={result.explainability} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Calculating importance...
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {result && result.recommendations.length > 0 ? (
            result.recommendations.map((rec, index) => (
              <Card key={index} className="p-4 border-l-4 border-l-primary/50 bg-card hover:bg-muted/10 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm",
                        rec.priority === 'CRITICAL' || rec.priority === 'HIGH' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-blue-500 text-white'
                      )}>
                        {rec.priority}
                      </span>
                      <h4 className="font-bold text-foreground leading-tight">{rec.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{rec.reason}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded-md border border-border">
                        <Loader className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[11px] font-semibold text-foreground capitalize">
                          Action: {rec.action_type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : result ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No recommendations at this time</p>
            </Card>
          ) : (
            <Card className="p-6 text-center animate-pulse">
              <p className="text-muted-foreground">Generating recommendations...</p>
            </Card>
          )}
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Analysis Summary</h4>
                <p className="text-sm text-muted-foreground">
                  This analysis evaluated code quality, complexity, and potential deployment risks.
                  The risk score is calculated based on multiple code metrics and historical patterns.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">Risk Score</p>
                  <p className="text-2xl font-bold text-foreground">{riskScore}%</p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">Confidence Level</p>
                  <p className="text-xl font-bold text-foreground">
                    {result ? result.inference.confidence_level : 'LOW'}
                  </p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">Severity</p>
                  <p className={`text-lg font-bold ${severityColor}`}>{severity}</p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">Recommendations</p>
                  <p className="text-2xl font-bold text-foreground">{result?.recommendations.length || 0}</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
