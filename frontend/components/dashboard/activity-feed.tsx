'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import type { ActivityFeedItem } from '@/lib/api-types'

interface ActivityFeedProps {
  items: ActivityFeedItem[]
}

function getSeverityColor(severity: string): string {
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
      return 'text-blue-600 dark:text-blue-400'
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'analysis':
      return AlertTriangle
    case 'deployment':
      return CheckCircle
    case 'alert':
      return AlertCircle
    default:
      return AlertCircle
  }
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Recent Activity</h3>
      <div className="space-y-4">
        {items.map((item) => {
          const Icon = getTypeIcon(item.type)
          const severityColor = getSeverityColor(item.severity)
          const timeAgo = isMounted ? getTimeAgo(item.timestamp) : '...'

          return (
            <div key={item.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
              <div className={`p-2 rounded-lg ${severityColor} bg-${item.severity.toLowerCase()}/10`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function getTimeAgo(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
