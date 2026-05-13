'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Download, FileJson, Sheet, CheckCircle, Loader, ThumbsUp } from 'lucide-react'
import { RiskGauge } from './risk-gauge'
import { SHAPMini } from './shap-mini'
import { RiskDimensionsPanel } from './risk-dimensions-panel'
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

  // ── JSON export (Task 7) — includes risk_dimensions when present ──────────
  const handleExportJSON = () => {
    if (!result) return
    try {
      // Build export payload: preserve all existing fields, append risk_dimensions if available
      const exportPayload = {
        prediction_id: result.prediction_id,
        workflow_run_id: result.workflow_run_id,
        target_name: result.target_name,
        inference: result.inference,
        explainability: result.explainability,
        recommendations: result.recommendations,
        // Append risk_dimensions only when present — graceful omission otherwise
        ...(result.risk_dimensions ? { risk_dimensions: result.risk_dimensions } : {}),
      }
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analysis_${result.prediction_id}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      // Fallback: export raw result without dimensions
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analysis_${result.prediction_id}.json`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  // ── PDF/Print export (Task 8) — rich print page with Multidimensional section ──
  const handlePrintPDF = () => {
    if (!result) { window.print(); return }
    try {
      const dims = result.risk_dimensions
      const ts = isMounted ? new Date(result.inference.timestamp).toLocaleString() : result.inference.timestamp

      const dimSection = dims ? `
        <div class="section">
          <h2>Multidimensional Risk Analysis</h2>
          <p class="note">Heuristic interpretation based on code metrics. Not predictive of production outcomes. No vulnerability scanning performed.</p>

          <div class="interp-box">
            <strong>Overall Interpretation</strong><br/>
            ${dims.interpretation_summary}
          </div>

          ${dims.confidence ? `<p><strong>Heuristic Confidence:</strong> ${dims.confidence}</p>` : ''}

          <table>
            <thead>
              <tr><th>Dimension</th><th>Grade</th><th>Score</th><th>Summary</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Maintainability</strong><br/><small>Code quality &amp; complexity</small></td>
                <td class="grade">${dims.maintainability.grade}</td>
                <td>${dims.maintainability.score.toFixed(0)}/100</td>
                <td>${dims.maintainability.summary}</td>
              </tr>
              <tr>
                <td><strong>Deployment Stability</strong><br/><small>Coupling &amp; integration</small></td>
                <td class="grade">${dims.deployment_stability.grade}</td>
                <td>${dims.deployment_stability.score.toFixed(0)}/100</td>
                <td>${dims.deployment_stability.summary}</td>
              </tr>
              <tr>
                <td><strong>Review Complexity</strong><br/><small>Structural heuristic only</small></td>
                <td class="grade">${dims.security_exposure.grade}</td>
                <td>${dims.security_exposure.score.toFixed(0)}/100</td>
                <td>${dims.security_exposure.summary}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ` : ''

      const printHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Orbis Risk Analysis Report — ${result.prediction_id}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a2e; background: #fff; padding: 32px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; color: #0f172a; }
    h2 { font-size: 15px; font-weight: 600; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; color: #0f172a; }
    .meta { font-size: 11px; color: #64748b; margin-bottom: 24px; }
    .section { margin-bottom: 24px; }
    .kv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
    .kv { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; }
    .kv label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; display: block; margin-bottom: 2px; }
    .kv span { font-size: 16px; font-weight: 700; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 7px 10px; background: #f1f5f9; color: #475569; font-size: 11px; border-bottom: 1px solid #e2e8f0; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; line-height: 1.5; }
    tr:last-child td { border-bottom: none; }
    .grade { font-weight: 800; font-size: 15px; text-align: center; }
    .interp-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 12px 14px; margin-bottom: 14px; font-size: 13px; line-height: 1.6; color: #0369a1; }
    .note { font-size: 10.5px; color: #94a3b8; margin-bottom: 10px; font-style: italic; }
    .footer { font-size: 10px; color: #94a3b8; margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>Orbis CI/CD Guardian — Risk Analysis Report</h1>
  <p class="meta">Prediction ID: ${result.prediction_id} &nbsp;·&nbsp; Generated: ${ts}</p>

  <div class="section">
    <h2>Overall Deployment Risk</h2>
    <div class="kv-grid">
      <div class="kv"><label>Risk Score</label><span>${Math.round(result.inference.risk_score)}/100</span></div>
      <div class="kv"><label>Severity</label><span>${result.inference.severity}</span></div>
      <div class="kv"><label>Model Confidence</label><span>${result.inference.confidence_level}</span></div>
      <div class="kv"><label>Model Version</label><span>${result.inference.model_version}</span></div>
    </div>
  </div>

  ${dimSection}

  <div class="section">
    <h2>Feature Importance (SHAP)</h2>
    <table>
      <thead><tr><th>Feature</th><th>Impact (%)</th><th>Direction</th></tr></thead>
      <tbody>
        ${result.explainability.map(e => `<tr><td>${e.feature}</td><td>${Math.round(e.impact_percent)}%</td><td>${e.direction === 'increase_risk' ? 'Increases Risk' : 'Decreases Risk'}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Recommendations</h2>
    <table>
      <thead><tr><th>Recommendation</th><th>Priority</th><th>Type</th></tr></thead>
      <tbody>
        ${result.recommendations.map(r => `<tr><td>${r.title}</td><td>${r.priority}</td><td>${r.action_type}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>

  <p class="footer">This report is generated by the Orbis CI/CD Guardian heuristic analysis system. Scores are heuristic estimates and do not constitute production monitoring, vulnerability assessments, or real-time deployment predictions.</p>
</body>
</html>`

      const printWindow = window.open('', '_blank', 'width=900,height=700')
      if (printWindow) {
        printWindow.document.write(printHTML)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => { printWindow.print() }, 400)
      } else {
        window.print()
      }
    } catch {
      // Fallback: browser native print
      window.print()
    }
  }

  const handleExportCSV = () => {
    if (!result) return

    const escapeCSV = (val: any) => {
      const str = String(val).replace(/"/g, '""')
      return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str
    }

    const rows = [
      ['Metric', 'Value'],
      ['Prediction ID', result.prediction_id],
      ['Workflow Run ID', result.workflow_run_id],
      ['Risk Score', riskScore],
      ['Severity', severity],
      ['Model Version', result.inference.model_version],
      ['Confidence Level', result.inference.confidence_level],
      ['Timestamp', result.inference.timestamp],
      [],
      ['Feature', 'Impact (%)', 'Direction'],
      ...result.explainability.map(e => [
        escapeCSV(e.feature),
        Math.round(e.impact_percent),
        e.direction === 'increase_risk' ? 'Increase Risk' : 'Decrease Risk'
      ]),
      [],
      ['Recommendation', 'Priority', 'Action Type'],
      ...result.recommendations.map(r => [
        escapeCSV(r.title),
        r.priority,
        escapeCSV(r.action_type)
      ])
    ]

    const csvContent = 'data:text/csv;charset=utf-8,'
      + rows.map(e => e.join(',')).join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `analysis_${result.prediction_id}.csv`)
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
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Analysis Timestamp</p>
              <p className="text-sm text-foreground">
                {result ? (isMounted ? new Date(result.inference.timestamp).toLocaleString() : 'Loading...') : 'Analyzing...'}
              </p>
            </div>

            {/* Export Buttons (Task 3: relative z-10 for responsiveness) */}
            <div className="flex gap-2 pt-4 relative z-10">
              <Button variant="outline" size="sm" className="flex-1" disabled={!result} onClick={handlePrintPDF}>
                <Download className="w-4 h-4 mr-2" />
                Print/PDF
              </Button>
              <Button variant="outline" size="sm" className="flex-1" disabled={!result} onClick={handleExportCSV}>
                <Sheet className="w-4 h-4 mr-2" />
                CSV/Excel
              </Button>
              <Button variant="outline" size="sm" className="flex-1" disabled={!result} onClick={handleExportJSON}>
                <FileJson className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Risk Dimensions Panel — additive, renders only when data is present */}
      {result?.risk_dimensions && (
        <RiskDimensionsPanel riskDimensions={result.risk_dimensions} />
      )}

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
          <Card className="p-5 bg-primary/5 border border-primary/20 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-full text-primary mt-1">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground mb-1.5">Intelligent Operational Advisor</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The insights below translate complex risk signals into practical engineering advice. Our hybrid intelligence engine specifically identified these actionable steps to help you mitigate deployment risks, improve code maintainability, and ensure stable builds.
                </p>
              </div>
            </div>
          </Card>

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
                    <div className="space-y-4 mb-5">
                      <div className="bg-card border border-border/50 p-3.5 rounded-lg shadow-sm">
                        <p className="text-[13px] font-bold text-foreground mb-1">What this means</p>
                        <p className="text-[13px] text-muted-foreground leading-relaxed">{rec.explanation}</p>
                      </div>
                      
                      <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 p-3.5 rounded-lg shadow-sm">
                        <p className="text-[13px] font-bold text-orange-800 dark:text-orange-400 mb-1">Why it matters</p>
                        <p className="text-[13px] text-orange-900/80 dark:text-orange-200/80 leading-relaxed">{rec.impact}</p>
                      </div>
                      
                      <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-lg shadow-sm">
                        <p className="text-[13px] font-bold text-primary mb-1">Suggested Action</p>
                        <p className="text-[13px] text-foreground leading-relaxed">{rec.suggested_action}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary/20 rounded-md border border-border/50">
                        <Loader className="w-3.5 h-3.5 text-secondary-foreground" />
                        <span className="text-[11px] font-semibold text-secondary-foreground capitalize">
                          Type: {rec.action_type}
                        </span>
                      </div>
                      
                      {rec.triggered_by && rec.triggered_by.length > 0 && (
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-muted/50 rounded-md border border-border/50">
                          <span className="text-[11px] font-semibold text-muted-foreground">Triggered By:</span>
                          <div className="flex gap-1.5">
                            {rec.triggered_by.map((trigger, i) => (
                              <span key={i} className="text-[11px] bg-background px-1.5 py-0.5 rounded shadow-sm border border-border text-foreground">
                                {trigger}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
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
