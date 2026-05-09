'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { AppLayout } from '@/components/layout/app-layout'
import { AnalysisResults } from '@/components/analyze/analysis-results-improved'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Info } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'

export default function HistoryDetailPage() {
  const { id } = useParams()
  const predictionId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''

  const { authReady, isAuthenticated } = useAuth()
  const { data: analysis, isLoading: queryLoading, error } = useQuery({
    queryKey: ['history', predictionId],
    queryFn: () => apiClient.getHistoryDetail(predictionId),
    enabled: !!predictionId && authReady && isAuthenticated
  })

  const isLoading = !authReady || queryLoading

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        {/* Breadcrumbs / Back */}
        <div className="flex items-center gap-4">
          <Link href="/history">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to History
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Pipeline Intelligence</h1>
            <p className="text-muted-foreground font-mono text-sm">
              Prediction ID: {predictionId}
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
            <Info className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Enterprise Deployment Intelligence</span>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl">
          {isLoading ? (
            <Card className="p-20 text-center text-muted-foreground animate-pulse">
              Retrieving historical intelligence report...
            </Card>
          ) : error ? (
            <Card className="p-12 text-center text-red-500 border-red-200 bg-red-50 dark:bg-red-950/20">
              <p className="font-bold text-lg mb-2">Error Loading Report</p>
              <p className="text-sm">We could not find the analysis for this prediction ID.</p>
              <Link href="/history" className="mt-4 inline-block">
                <Button variant="outline" size="sm">Return to History</Button>
              </Link>
            </Card>
          ) : analysis ? (
            <AnalysisResults result={analysis} isAnalyzing={false} />
          ) : null}
        </div>
      </div>
    </AppLayout>
  )
}
