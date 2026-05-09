'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { mockRecommendations } from '@/lib/mock-data'
import { useState, useMemo } from 'react'
import type { SeverityLevel } from '@/lib/api-types'

const severityLevels: SeverityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function RecommendationsPage() {
  const [search, setSearch] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel[]>(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

  const filtered = useMemo(() => {
    return mockRecommendations.filter(
      (rec) =>
        (search === '' ||
          rec.title.toLowerCase().includes(search.toLowerCase()) ||
          rec.reason.toLowerCase().includes(search.toLowerCase())) &&
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Recommendations</h1>
          <p className="text-muted-foreground">
            Actionable insights to reduce risk and improve code quality
          </p>
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
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {rec.action_type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-3">{rec.reason}</p>
                          <div className="flex gap-2">
                            <span className="text-xs bg-accent/20 text-foreground px-2 py-1 rounded">
                              {rec.related_feature}
                            </span>
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
