'use client'

import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Download, FileJson, Sheet } from 'lucide-react'
import { RiskGauge } from './risk-gauge'
import { SHAPMini } from './shap-mini'
import type { AnalysisResponse } from '@/lib/api-types'

interface AnalysisResultsProps {
  result: AnalysisResponse
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

export function AnalysisResults({ result }: AnalysisResultsProps) {
  const severityColor = getSeverityColor(result.severity)
  const severityBg = getSeverityBg(result.severity)

  return (
    <div className="space-y-6">
      {/* Risk Overview Card */}
      <Card className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gauge */}
          <div className="flex items-center justify-center">
            <RiskGauge score={result.risk_score} severity={result.severity} />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Severity Level</p>
              <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${severityBg} ${severityColor}`}>
                {result.severity}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Model Confidence</p>
              <p className="text-2xl font-bold text-foreground">
                {(result.confidence * 100).toFixed(1)}%
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Analysis Time</p>
              <p className="text-sm text-foreground">{new Date(result.timestamp).toLocaleString()}</p>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Sheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <FileJson className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs for detailed analysis */}
      <Tabs defaultValue="shap" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shap">SHAP Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* SHAP Tab */}
        <TabsContent value="shap" className="space-y-4">
          <SHAPMini shapValues={result.shap_values} />
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {result.recommendations.length > 0 ? (
            result.recommendations.map((rec) => (
              <Card key={rec.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                    <div className="flex gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {rec.action_type}
                      </span>
                      <span className={`text-xs ${getSeverityColor(rec.severity)} ${getSeverityBg(rec.severity)} px-2 py-1 rounded`}>
                        {rec.severity}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Priority</p>
                    <p className="text-lg font-bold text-foreground">{rec.priority}</p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No recommendations at this time</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
