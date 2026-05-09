'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Github, Database, Upload, Settings2, ArrowRight } from 'lucide-react'
import { GitHubRepoMode } from './modes/github-repo-mode'
import { TelemetryMode } from './modes/telemetry-mode'
import { UploadMode } from './modes/upload-mode'
import { AdvancedMetricsMode } from './modes/advanced-metrics-mode'
import type { AnalysisResponse } from '@/lib/api-types'

interface AnalyzeSourceProps {
  onAnalysisStart: (config: any) => void
  onAnalysisComplete: (result: AnalysisResponse) => void
  isLoading: boolean
}

const MODES = [
  {
    id: 'telemetry' as const,
    label: 'Telemetry',
    icon: Database,
    description: 'Select from previously ingested telemetry runs (Recommended)',
    badge: '⭐ Recommended',
  },
  {
    id: 'github' as const,
    label: 'Repository',
    icon: Github,
    description: 'Connect a GitHub repository for automated analysis',
  },
  {
    id: 'upload' as const,
    label: 'Upload',
    icon: Upload,
    description: 'Upload CI/CD workflow files or telemetry logs',
  },
  {
    id: 'advanced' as const,
    label: 'Advanced',
    icon: Settings2,
    description: 'Manually enter ML metrics for testing and debugging',
    badge: 'Developer Mode',
  },
]

export function AnalyzeSource({
  onAnalysisStart,
  onAnalysisComplete,
  isLoading,
}: AnalyzeSourceProps) {
  const [activeMode, setActiveMode] = useState<'github' | 'telemetry' | 'upload' | 'advanced'>(
    'telemetry'
  )

  const currentMode = MODES.find((m) => m.id === activeMode)

  const renderContent = () => {
    switch (activeMode) {
      case 'telemetry':
        return (
          <TelemetryMode
            onAnalysisStart={onAnalysisStart}
            onAnalysisComplete={onAnalysisComplete}
            isLoading={isLoading}
          />
        )
      case 'github':
        return (
          <GitHubRepoMode
            onAnalysisStart={onAnalysisStart}
            onAnalysisComplete={onAnalysisComplete}
            isLoading={isLoading}
          />
        )
      case 'upload':
        return (
          <UploadMode
            onAnalysisStart={onAnalysisStart}
            onAnalysisComplete={onAnalysisComplete}
            isLoading={isLoading}
          />
        )
      case 'advanced':
        return (
          <AdvancedMetricsMode
            onAnalysisStart={onAnalysisStart}
            onAnalysisComplete={onAnalysisComplete}
            isLoading={isLoading}
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode Selector Card */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Analyze Source</h3>
          <p className="text-sm text-muted-foreground">
            Select how you want to analyze your code and infrastructure
          </p>
        </div>

        {/* Tab Buttons - Improved Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {MODES.map((mode) => {
            const Icon = mode.icon
            const isActive = activeMode === mode.id

            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-card/50'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className={`text-sm font-semibold ${isActive ? 'text-foreground' : 'text-foreground'}`}>
                  {mode.label}
                </p>
                {mode.badge && (
                  <p className={`text-xs mt-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {mode.badge}
                  </p>
                )}
              </button>
            )
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-border mb-8" />

        {/* Mode Content */}
        <div className="space-y-6">{renderContent()}</div>
      </Card>

      {/* Help Text */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="text-primary mt-1 flex-shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{currentMode?.description}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
