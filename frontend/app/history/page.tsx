'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Download } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import Link from 'next/link'
import type { SeverityLevel } from '@/lib/api-types'
import { useAuth } from '@/hooks/use-auth'

const severityLevels: SeverityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

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

  const filtered = history.filter(
    (item) =>
      (search === '' ||
        item.workflow_run_id.toLowerCase().includes(search.toLowerCase()) ||
        item.prediction_id.toLowerCase().includes(search.toLowerCase())) &&
      selectedSeverity.includes(item.inference.severity)
  )

  const paginated = filtered
  const totalPages = Math.ceil(filtered.length / pageSize) || 1

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-600 dark:text-red-400'
      case 'HIGH':
        return 'text-orange-600 dark:text-orange-400'
      case 'MEDIUM':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'LOW':
        return 'text-green-600 dark:text-green-400'
      default:
        return 'text-foreground'
    }
  }

  const getSeverityBg = (severity: SeverityLevel) => {
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

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Deployment History</h1>
          <p className="text-muted-foreground">
            View and analyze all historical deployments and their risk scores
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by repository or run ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Download Button */}
              <Button className="gap-2">
                <Download className="w-4 h-4" />
                Download Report
              </Button>
            </div>

            {/* Severity Filter */}
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
                      ? `${getSeverityBg(level)} ${getSeverityColor(level)}`
                      : 'border-border text-muted-foreground hover:border-foreground'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Repository</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Run ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Timestamp</th>
                  <th className="text-center py-4 px-6 font-semibold text-foreground">Severity</th>
                  <th className="text-right py-4 px-6 font-semibold text-foreground">Risk Score</th>
                  <th className="text-center py-4 px-6 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-muted-foreground animate-pulse">
                      Loading deployment history...
                    </td>
                  </tr>
                ) : paginated.length > 0 ? (
                  paginated.map((item) => (
                    <tr
                      key={item.prediction_id}
                      className="border-b border-border hover:bg-card/50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-foreground">Pipeline Run</p>
                          <p className="text-xs text-muted-foreground">v{item.inference.model_version}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-muted-foreground">
                        {item.workflow_run_id}
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {new Date(item.inference.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full font-medium text-xs ${getSeverityBg(item.inference.severity)} ${getSeverityColor(item.inference.severity)}`}
                        >
                          {item.inference.severity}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-bold text-foreground">
                          {Math.round(item.inference.risk_score * 100)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Link 
                          href={`/history/${item.prediction_id}`}
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-muted-foreground">
                      No historical records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min((page - 1) * pageSize + 1, filtered.length)} to{' '}
              {Math.min(page * pageSize, filtered.length)} of {filtered.length} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                {page} / {totalPages}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
