'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Bell, AlertCircle, CheckCircle, Info, X } from 'lucide-react'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'error',
      title: 'Critical Deployment Risk Detected',
      message: 'payment-service shows 78% risk score',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: '2',
      type: 'success',
      title: 'Analysis Report Exported',
      message: 'Risk assessment report exported as PDF',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      id: '3',
      type: 'warning',
      title: 'Telemetry Sync Completed',
      message: '342 new workflow runs ingested',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: '4',
      type: 'info',
      title: 'System Status Update',
      message: 'ML model updated to v1.0.5',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  ])

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-status-critical" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-status-low" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-status-high" />
      case 'info':
        return <Info className="w-5 h-5 text-accent" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative">
      {/* Notification Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-primary/20 rounded-lg transition-all relative group"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-primary" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-status-critical rounded-full" />
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <Card className="absolute right-0 mt-2 w-96 shadow-xl z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-card/50">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Notifications List */}
          {notifications.length > 0 ? (
            <div className="overflow-y-auto flex-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-b border-border hover:bg-secondary/30 transition-colors flex gap-3"
                >
                  <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">{formatTime(notification.timestamp)}</p>
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border text-center">
              <button className="text-xs text-primary hover:underline">Clear all notifications</button>
            </div>
          )}
        </Card>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
