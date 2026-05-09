'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { mockRecommendations } from '@/lib/mock-data'
import { useState, useMemo } from 'react'
import type { SeverityLevel } from '@/lib/api-types'

const severityLevels: SeverityLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export default function RecommendationsPage() {
  const [search, setSearch] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel[]>(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])

  const filtered = useMemo(() => {
    return mockRecommendations.filter(
      (rec) =>
        (search === '' ||
          rec.title.toLowerCase().includes(search.toLowerCase()) ||
          rec.explanation.toLowerCase().includes(search.toLowerCase()) ||
          rec.impact.toLowerCase().includes(search.toLowerCase())) &&
        selectedSeverity.includes(rec.severity)
    )
  }, [search, selectedSeverity])

  const grouped = severityLevels.reduce(
    (acc, severity) => {
      acc[severity] = filtered.filter((rec) => rec.severity === severity)
      return acc
    },
    {} as Record<SeverityLevel, typeof mockRecommendations>
  )

  const getSeverityStyles = (severity: SeverityLevel) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700'
      case 'HIGH':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700'
      case 'MEDIUM':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700'
      case 'LOW':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
      default:
        return ''
    }
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-start gap-4 mb-4">
            <div className="p-2 bg-primary/10 rounded-full text-primary mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Intelligent Operational Advisor</h1>
              <p className="text-muted-foreground max-w-3xl">
                The insights below translate complex risk signals into practical engineering advice. Our hybrid intelligence engine specifically identified these actionable steps to help you mitigate deployment risks, improve code maintainability, and ensure stable builds.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search recommendations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Priority Filter */}
            <div className="flex flex-wrap gap-2">
              {severityLevels.map((level) => (
                <button
                  key={level}
                  onClick={() =>
                    setSelectedSeverity((prev) =>
                      prev.includes(level) ? prev.filter((s) => s !== level) : [...prev, level]
                    )
                  }
                  className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                    selectedSeverity.includes(level)
                      ? getSeverityStyles(level)
                      : 'border-border text-muted-foreground hover:border-foreground'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Recommendations by Severity */}
        <div className="space-y-8">
          {severityLevels.map((severity) => {
            const recs = grouped[severity]
            if (recs.length === 0) return null

            return (
              <div key={severity}>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${getSeverityStyles(severity).split(' ')[0]}`} />
                  {severity} Priority ({recs.length})
                </h2>

                <div className="space-y-3">
                  {recs.map((rec) => (
                    <Card key={rec.id} className="p-5 hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-foreground text-lg">{rec.title}</h3>
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
                              <span className="text-[11px] font-semibold text-secondary-foreground capitalize">
                                Type: {rec.action_type.replace('_', ' ')}
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
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground mb-1">Priority</p>
                          <p className="text-2xl font-bold text-primary">{rec.priority}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">No recommendations found</p>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
