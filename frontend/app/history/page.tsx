'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Download, ExternalLink, Calendar, Clock, History, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import Link from 'next/link'
import type { SeverityLevel, AnalysisResponse } from '@/lib/api-types'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const severityLevels: SeverityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const formatRepoLabel = (name: string) => {
  if (!name) return 'Unknown Repository'
  return name
    .replace('https://github.com/', '')
    .replace('http://github.com/', '')
    .replace('https://www.github.com/', '')
    .replace('http://www.github.com/', '')
    .replace('upload://', '')
}

function getRelativeTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return 'Unknown time'
  
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatFullDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return 'Invalid Date'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function HistoryPage() {
  const [search, setSearch] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel[]>(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  const [page, setPage] = useState(1)
  const pageSize = 10
  const { authReady, isAuthenticated } = useAuth()

  const { data: history = [], isLoading: queryLoading } = useQuery({
    queryKey: ['history', page],
    queryFn: () => apiClient.getHistory(pageSize, (page - 1) * pageSize),
    enabled: authReady && isAuthenticated
  })

  const isLoading = !authReady || queryLoading

  const filtered = useMemo(() => {
    return history.filter(
      (item) =>
        (search === '' ||
          item.workflow_run_id.toLowerCase().includes(search.toLowerCase()) ||
          item.prediction_id.toLowerCase().includes(search.toLowerCase())) &&
        selectedSeverity.includes(item.inference.severity)
    )
  }, [history, search, selectedSeverity])

  const paginated = filtered
  const totalPages = Math.ceil(filtered.length / pageSize) || 1

  const getSeverityStyles = (severity: SeverityLevel) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-status-critical/10 text-status-critical border-status-critical/20'
      case 'HIGH':
        return 'bg-status-high/10 text-status-high border-status-high/20'
      case 'MEDIUM':
        return 'bg-status-medium/10 text-status-medium border-status-medium/20'
      case 'LOW':
        return 'bg-status-low/10 text-status-low border-status-low/20'
      default:
        return 'bg-secondary text-secondary-foreground border-border'
    }
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <History className="w-8 h-8 text-primary" />
              Prediction History
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Audit and trace all historical risk analyses and AI-driven deployment decisions.
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export History
          </Button>
        </div>

        {/* Filters Card */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by Run ID or Repository..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Severity Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-2">Severity</span>
              {severityLevels.map((level) => (
                <button
                  key={level}
                  onClick={() =>
                    setSelectedSeverity((prev) =>
                      prev.includes(level) ? prev.filter((s) => s !== level) : [...prev, level]
                    )
                  }
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all uppercase tracking-tight",
                    selectedSeverity.includes(level)
                      ? getSeverityStyles(level)
                      : "bg-transparent border-border text-muted-foreground hover:border-muted-foreground"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Table Content */}
        <Card className="overflow-hidden border-border bg-card/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Type</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target Context</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Execution Date</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Risk Rating</th>
                  <th className="py-4 px-6 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="py-8 px-6">
                        <div className="h-10 bg-muted/50 rounded-lg w-full" />
                      </td>
                    </tr>
                  ))
                ) : paginated.length > 0 ? (
                  paginated.map((item) => (
                    <tr
                      key={item.prediction_id}
                      className="group hover:bg-muted/20 transition-all duration-200"
                    >
                      {/* Analysis Type */}
                      <td className="py-5 px-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-primary/70 uppercase tracking-widest mb-1">
                            {item.inference.analysis_type}
                          </span>
                          <span className="font-bold text-foreground text-sm flex items-center gap-2">
                            {item.inference.prediction === 1 ? (
                              <AlertCircle className="w-4 h-4 text-status-critical" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-status-low" />
                            )}
                            {formatRepoLabel(item.target_name)}
                          </span>
                        </div>
                      </td>

                      {/* Context / Time */}
                      <td className="py-5 px-6">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {formatFullDate(item.inference.timestamp)}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {getRelativeTime(item.inference.timestamp)}
                          </div>
                        </div>
                      </td>

                      {/* Details (Context replaced with ID for space) */}
                      <td className="py-5 px-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ID: {item.workflow_run_id.slice(0, 13)}...
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-muted-foreground">Confidence:</span>
                            <span className={cn(
                              "text-[9px] font-black px-1.5 py-0.5 rounded-full border",
                              item.inference.confidence_level === 'HIGH' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                              item.inference.confidence_level === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                              'bg-red-500/10 text-red-500 border-red-500/20'
                            )}>
                              {item.inference.confidence_level}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter border",
                            getSeverityStyles(item.inference.severity)
                          )}>
                            {item.inference.severity}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-foreground">
                              {Math.round(item.inference.risk_score)}
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase font-bold">Score</span>
                          </div>
                        </div>
                      </td>

                      {/* Link */}
                      <td className="py-5 px-6 text-center">
                        <Link 
                          href={`/history/${item.prediction_id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all duration-200"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                        <History className="w-12 h-12" />
                        <p className="text-sm font-medium">No historical predictions found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > pageSize && (
            <div className="flex items-center justify-between p-6 border-t border-border bg-muted/10">
              <p className="text-xs text-muted-foreground font-medium">
                Showing {Math.min((page - 1) * pageSize + 1, filtered.length)} to{' '}
                {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="text-xs"
                >
                  Previous
                </Button>
                <div className="flex items-center px-4 text-xs font-bold text-foreground">
                  {page} / {totalPages}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
