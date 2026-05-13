'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Download, 
  FileText, 
  Sheet, 
  FileJson, 
  Search, 
  Calendar, 
  History, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ExternalLink,
  Trash2
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { exportToPDF, exportToCSV, exportToJSON } from '@/lib/export-utils'
import { cn } from '@/lib/utils'
import type { AnalysisResponse } from '@/lib/api-types'

const formatRepoLabel = (name: string) => {
  if (!name) return 'Unknown Repository'
  return name
    .replace('https://github.com/', '')
    .replace('http://github.com/', '')
    .replace('https://www.github.com/', '')
    .replace('http://www.github.com/', '')
    .replace('upload://', '')
}

// Type for session-based download tracking
interface SessionDownload {
  id: string
  name: string
  type: 'PDF' | 'CSV' | 'JSON'
  date: string
  predictionId: string
}

export default function ReportsPage() {
  const { authReady, isAuthenticated } = useAuth()
  const [selectedPredictionId, setSelectedPredictionId] = useState<string>('')
  const [sessionDownloads, setSessionDownloads] = useState<SessionDownload[]>([])
  const [isGenerating, setIsGenerating] = useState<string | null>(null) // Tracks which type is generating

  // 1. Fetch History
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['history-reports'],
    queryFn: () => apiClient.getHistory(50, 0),
    enabled: authReady && isAuthenticated
  })

  // 2. Set default selection to latest analysis
  useEffect(() => {
    if (history.length > 0 && !selectedPredictionId) {
      setSelectedPredictionId(history[0].prediction_id)
    }
  }, [history, selectedPredictionId])

  // 3. Derived current selection
  const selectedAnalysis = useMemo(() => {
    return history.find(a => a.prediction_id === selectedPredictionId) || null
  }, [history, selectedPredictionId])

  // 4. Handlers
  const handleGenerate = async (type: 'PDF' | 'CSV' | 'JSON') => {
    if (!selectedAnalysis) return
    
    setIsGenerating(type)
    
    // Simulate generation delay for UX "weight"
    await new Promise(resolve => setTimeout(resolve, 800))
    
    let success = false
    if (type === 'PDF') success = exportToPDF(selectedAnalysis)
    else if (type === 'CSV') success = exportToCSV(selectedAnalysis)
    else if (type === 'JSON') success = exportToJSON(selectedAnalysis)
    
    if (success) {
      const newDownload: SessionDownload = {
        id: Math.random().toString(36).substring(7),
        name: `${selectedAnalysis.target_name}_analysis_${selectedAnalysis.prediction_id.substring(0, 8)}.${type.toLowerCase()}`,
        type,
        date: new Date().toLocaleTimeString(),
        predictionId: selectedAnalysis.prediction_id
      }
      setSessionDownloads(prev => [newDownload, ...prev])
    }
    
    setIsGenerating(null)
  }

  const clearSessionDownloads = () => setSessionDownloads([])

  return (
    <AppLayout>
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              Reports & Exports
            </h1>
            <p className="text-muted-foreground">
              Generate structured risk reports and operational data exports from historical analyses.
            </p>
          </div>
        </div>

        {/* Analysis Selector */}
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Analysis Target</label>
              <div className="relative">
                {historyLoading ? (
                  <div className="h-11 bg-background/50 animate-pulse rounded-xl border border-border" />
                ) : history.length > 0 ? (
                  <select
                    value={selectedPredictionId}
                    onChange={(e) => setSelectedPredictionId(e.target.value)}
                    className="w-full h-11 bg-background border border-border rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                  >
                    {history.map((a) => (
                      <option key={a.prediction_id} value={a.prediction_id}>
                        {formatRepoLabel(a.target_name)} — {a.inference.severity} ({Math.round(a.inference.risk_score)}/100) — {new Date(a.inference.timestamp).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="h-11 flex items-center px-4 bg-muted/50 rounded-xl border border-dashed border-border text-sm text-muted-foreground italic">
                    No analysis history available. Run an analysis first.
                  </div>
                )}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <History className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {selectedAnalysis && (
              <div className="flex flex-col justify-end pt-5">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-background border border-border rounded-xl">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    selectedAnalysis.inference.severity === 'CRITICAL' || selectedAnalysis.inference.severity === 'HIGH' ? 'bg-red-500' : 'bg-green-500'
                  )} />
                  <span className="text-sm font-semibold">{selectedAnalysis.inference.severity} Risk</span>
                  <span className="text-xs text-muted-foreground font-mono">ID: {selectedAnalysis.prediction_id.substring(0, 8)}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Export Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PDF Report */}
          <Card className="p-6 flex flex-col hover:border-primary/40 transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter bg-red-500/10 text-red-500 border border-red-500/20">
                Rich Media
              </span>
            </div>
            <h3 className="font-bold text-lg mb-2">Executive PDF Report</h3>
            <p className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed">
              Formatted document including risk gauges, multidimensional analysis, and full mitigation recommendations. Best for human review.
            </p>
            <Button 
              className="w-full gap-2" 
              disabled={!selectedAnalysis || isGenerating !== null}
              onClick={() => handleGenerate('PDF')}
            >
              {isGenerating === 'PDF' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isGenerating === 'PDF' ? 'Generating...' : 'Generate PDF'}
            </Button>
          </Card>

          {/* CSV Export */}
          <Card className="p-6 flex flex-col hover:border-primary/40 transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                <Sheet className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter bg-green-500/10 text-green-500 border border-green-500/20">
                Data Ready
              </span>
            </div>
            <h3 className="font-bold text-lg mb-2">Operational CSV</h3>
            <p className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed">
              Flat data export including all feature impacts and priority-sorted recommendations. Perfect for Excel or external data tools.
            </p>
            <Button 
              variant="outline"
              className="w-full gap-2" 
              disabled={!selectedAnalysis || isGenerating !== null}
              onClick={() => handleGenerate('CSV')}
            >
              {isGenerating === 'CSV' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isGenerating === 'CSV' ? 'Generating...' : 'Export CSV'}
            </Button>
          </Card>

          {/* JSON Export */}
          <Card className="p-6 flex flex-col hover:border-primary/40 transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <FileJson className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter bg-blue-500/10 text-blue-500 border border-blue-500/20">
                API Format
              </span>
            </div>
            <h3 className="font-bold text-lg mb-2">Technical JSON</h3>
            <p className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed">
              Complete raw machine-readable payload. Useful for system integration, custom parsing, or archival purposes.
            </p>
            <Button 
              variant="outline"
              className="w-full gap-2" 
              disabled={!selectedAnalysis || isGenerating !== null}
              onClick={() => handleGenerate('JSON')}
            >
              {isGenerating === 'JSON' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isGenerating === 'JSON' ? 'Generating...' : 'Export JSON'}
            </Button>
          </Card>
        </div>

        {/* Recent Session Downloads */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Recent Downloads</h2>
            {sessionDownloads.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearSessionDownloads} className="text-muted-foreground hover:text-red-500 gap-2">
                <Trash2 className="w-4 h-4" />
                Clear Local History
              </Button>
            )}
          </div>
          
          <Card className="overflow-hidden border-border bg-card/30">
            {sessionDownloads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Filename</th>
                      <th className="text-left py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Type</th>
                      <th className="text-left py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Timestamp</th>
                      <th className="text-center py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {sessionDownloads.map((report) => (
                      <tr
                        key={report.id}
                        className="group hover:bg-muted/20 transition-all"
                      >
                        <td className="py-4 px-6 font-medium text-foreground max-w-md truncate">
                          <div className="flex items-center gap-3">
                            {report.type === 'PDF' ? <FileText className="w-4 h-4 text-red-500" /> : 
                             report.type === 'CSV' ? <Sheet className="w-4 h-4 text-green-500" /> : 
                             <FileJson className="w-4 h-4 text-blue-500" />}
                            {report.name}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-bold">{report.type}</span>
                        </td>
                        <td className="py-4 px-6 text-muted-foreground text-xs">{report.date}</td>
                        <td className="py-4 px-6 text-center">
                          <Button variant="ghost" size="sm" className="h-8 text-primary gap-2" onClick={() => {
                            // Re-trigger the specific export if possible
                            const analysis = history.find(a => a.prediction_id === report.predictionId)
                            if (analysis) {
                              if (report.type === 'PDF') exportToPDF(analysis)
                              else if (report.type === 'CSV') exportToCSV(analysis)
                              else if (report.type === 'JSON') exportToJSON(analysis)
                            }
                          }}>
                            <Download className="w-3.5 h-3.5" />
                            Re-download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                  <Download className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <p className="text-foreground font-bold italic">No exports generated yet.</p>
                  <p className="text-xs text-muted-foreground">Select an analysis target above to generate your first report.</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Enterprise Context Banner */}
        <Card className="p-8 bg-gradient-to-r from-primary/5 to-transparent border-l-4 border-l-primary flex items-center justify-between gap-8">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Operational Intelligence Archival</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              All generated reports are cryptographically linked to the specific prediction ID and commit SHA of the target repository. This ensures end-to-end traceability for compliance auditing and change management workflows.
            </p>
          </div>
          <Zap className="w-12 h-12 text-primary/20 flex-shrink-0" />
        </Card>
      </div>
    </AppLayout>
  )
}
