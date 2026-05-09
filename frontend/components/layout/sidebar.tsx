'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  BookOpen,
  Zap,
  BarChart3,
  ThumbsUp,
  History,
  Radio,
  MonitorDot,
  FileText,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'How It Works', href: '/how-it-works', icon: BookOpen },
  { name: 'Analyze Pipeline', href: '/analyze', icon: Zap },
  { name: 'SHAP Explainability', href: '/shap', icon: BarChart3 },
  { name: 'Recommendations', href: '/recommendations', icon: ThumbsUp },
  { name: 'Deployment History', href: '/history', icon: History },
  { name: 'Telemetry Explorer', href: '/telemetry', icon: Radio },
  { name: 'Monitoring & Dev Tools', href: '/monitoring', icon: MonitorDot },
  { name: 'Reports & Exports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold">RiskOps AI</h1>
            <p className="text-xs text-sidebar-foreground/60">DevOps Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto py-4 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4 bg-sidebar-accent/50">
        <p className="text-xs text-sidebar-foreground/60 text-center">
          RiskOps AI v1.0
        </p>
      </div>
    </aside>
  )
}
