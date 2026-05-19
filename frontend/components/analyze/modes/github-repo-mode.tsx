'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Github, ArrowRight } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import type { AnalysisResponse } from '@/lib/api-types'

interface GitHubRepoModeProps {
  onAnalysisStart: (config: any) => void
  onAnalysisComplete: (result: AnalysisResponse) => void
  isLoading: boolean
}

export function GitHubRepoMode({
  onAnalysisStart,
  onAnalysisComplete,
  isLoading,
}: GitHubRepoModeProps) {
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [pipelineType, setPipelineType] = useState('github-actions')
  const [localLoading, setLocalLoading] = useState(false)

  const pipelineTypes = [
    { value: 'github-actions', label: 'GitHub Actions' },
    { value: 'jenkins', label: 'Jenkins' },
    { value: 'gitlab-ci', label: 'GitLab CI' },
    { value: 'circleci', label: 'CircleCI' },
  ]

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      toast.error('Please enter a repository URL')
      return
    }

    setLocalLoading(true)
    onAnalysisStart({ type: 'github', repoUrl, branch, pipelineType })

    try {
      const response = await apiClient.analyzeRepository({
        repository_url: repoUrl,
        branch,
        pipeline_type: pipelineType
      })
      onAnalysisComplete(response)
      toast.success('Repository analysis completed!')
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Analysis failed. Please try again.'
      toast.error(errorMsg)
      console.error('[GitHubRepoMode] Analysis failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Input Fields */}
      <div className="space-y-4">
        <div>
          <label htmlFor="repo-url" className="block text-sm font-medium text-foreground mb-2">
            GitHub Repository URL
          </label>
          <input
            id="repo-url"
            type="text"
            placeholder="https://github.com/company/repo-name"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={localLoading || isLoading}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="repo-branch" className="block text-sm font-medium text-foreground mb-2">Branch</label>
            <input
              id="repo-branch"
              type="text"
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              disabled={localLoading || isLoading}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="pipeline-type" className="block text-sm font-medium text-foreground mb-2">Pipeline Type</label>
            <select
              id="pipeline-type"
              value={pipelineType}
              onChange={(e) => setPipelineType(e.target.value)}
              disabled={localLoading || isLoading}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {pipelineTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-card/50 border-border">
        <div className="flex gap-3">
          <Github className="w-5 h-5 text-primary mt-1" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">
              Automated Repository Analysis
            </p>
            <p className="text-muted-foreground">
              We&apos;ll extract telemetry from your CI/CD workflows and analyze code metrics
              automatically.
            </p>
          </div>
        </div>
      </Card>

      {/* Action Button */}
      <Button
        onClick={handleAnalyze}
        disabled={localLoading || isLoading || !repoUrl.trim()}
        className="w-full"
        size="lg"
      >
        {localLoading || isLoading ? 'Analyzing Repository...' : 'Analyze Repository'}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )
}
