'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload as UploadIcon, ArrowRight, FileJson, AlertCircle } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import type { AnalysisResponse } from '@/lib/api-types'

interface UploadModeProps {
  onAnalysisStart: (config: any) => void
  onAnalysisComplete: (result: AnalysisResponse) => void
  isLoading: boolean
}

export function UploadMode({
  onAnalysisStart,
  onAnalysisComplete,
  isLoading,
}: UploadModeProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      validateAndSetFile(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      'application/json',
      'application/x-yaml',
      'text/yaml',
      'text/plain',
    ]
    const validExtensions = ['json', 'yaml', 'yml', 'txt', 'log']

    const ext = file.name.split('.').pop()?.toLowerCase()
    const isValidType = validTypes.includes(file.type) || (ext && validExtensions.includes(ext))

    if (!isValidType) {
      setParseError('Please upload a JSON, YAML, or TXT file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setParseError('File size must be less than 10MB')
      return
    }

    setUploadedFile(file)
    setParseError(null)
  }

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a file')
      return
    }

    setLocalLoading(true)
    onAnalysisStart({ type: 'upload', file: uploadedFile.name })

    try {
      const response = await apiClient.analyzeUpload(uploadedFile)
      onAnalysisComplete(response)
      toast.success('File analysis completed!')
    } catch (error) {
      toast.error('Analysis failed. Please try again.')
      console.error(error)
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-card/50'
        }`}
      >
        <UploadIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">Drag files here or click to browse</p>
        <p className="text-sm text-muted-foreground mb-4">
          Supports JSON, YAML, and TXT files (max 10MB)
        </p>
        <label>
          <input
            type="file"
            onChange={handleFileInput}
            disabled={localLoading || isLoading}
            className="hidden"
            accept=".json,.yaml,.yml,.txt,.log"
          />
          <Button variant="outline" asChild className="cursor-pointer">
            <span>Browse Files</span>
          </Button>
        </label>
      </div>

      {/* File Preview */}
      {uploadedFile && (
        <Card className="p-4 bg-card/50 border-primary/20">
          <div className="flex items-center gap-3">
            <FileJson className="w-5 h-5 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{uploadedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => {
                setUploadedFile(null)
                setParseError(null)
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {parseError && (
        <Card className="p-3 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-600 dark:text-red-400">{parseError}</p>
          </div>
        </Card>
      )}

      {/* Supported Formats */}
      <Card className="p-4 bg-card/50 border-border">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Supported Formats:</p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-4">
            <li>• GitHub Actions workflow JSON</li>
            <li>• Jenkins pipeline configuration</li>
            <li>• Telemetry logs and metrics</li>
            <li>• Custom workflow metadata</li>
          </ul>
        </div>
      </Card>

      {/* Action Button */}
      <Button
        onClick={handleAnalyze}
        disabled={localLoading || isLoading || !uploadedFile}
        className="w-full"
        size="lg"
      >
        {localLoading || isLoading ? 'Parsing File...' : 'Analyze Upload'}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )
}
