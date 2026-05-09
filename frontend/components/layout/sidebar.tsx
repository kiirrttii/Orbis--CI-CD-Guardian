'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  Zap,
  ThumbsUp,
  History,
  MonitorDot,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigationGroups = [
  {
    group: 'Platform',
    items: [
      { 
        name: 'How It Works', 
        href: '/how-it-works', 
        icon: BookOpen,
        subItems: [
          { name: 'The Orbis Pipeline', href: '/how-it-works#pipeline' },
          { name: 'Core Features', href: '/how-it-works#features' },
          { name: 'Engineering Approach', href: '/how-it-works#benefits' },
        ]
      },
    ]
  },
  {
    group: 'Operational Workflow',
    items: [
      { name: 'Analyze Pipeline', href: '/analyze', icon: Zap, primary: true },
      { name: 'Deployment History', href: '/history', icon: History },
      { name: 'Monitoring & Dev Tools', href: '/monitoring', icon: MonitorDot },
      { name: 'Recommendations', href: '/recommendations', icon: ThumbsUp },
    ]
  },
  {
    group: 'Workspace & Configuration',
    items: [
      { name: 'Reports & Exports', href: '/reports', icon: FileText },
      { name: 'Settings', href: '/settings', icon: Settings },
    ]
  }
]

import { APP_NAME } from '@/lib/config'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  
  // Track open state for items with subItems
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    '/how-it-works': pathname === '/how-it-works' || pathname.startsWith('/how-it-works/')
  })

  // Automatically open dropdown if active route matches
  useEffect(() => {
    navigationGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.subItems && (pathname === item.href || pathname.startsWith(item.href + '/'))) {
          setOpenDropdowns(prev => ({ ...prev, [item.href]: true }))
        }
      })
    })
  }, [pathname])

  const toggleDropdown = (href: string, e: React.MouseEvent) => {
    e.preventDefault()
    setOpenDropdowns(prev => ({ ...prev, [href]: !prev[href] }))
  }

  const handleSubItemClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const [path, hash] = href.split('#')
    
    if (pathname === path && hash) {
      e.preventDefault()
      // We are already on the page, smooth scroll to the element
      const element = document.getElementById(hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Optional: update URL hash without jump
        window.history.pushState(null, '', href)
      }
    }
  }

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-xl">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">{APP_NAME}</h1>
            <p className="text-xs text-sidebar-foreground/60">Risk-Aware CI/CD</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto py-4 px-3 space-y-6">
        {navigationGroups.map((group, groupIdx) => (
          <div key={group.group} className="space-y-1">
            {groupIdx > 0 && (
              <h4 className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 mt-4">
                {group.group}
              </h4>
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              const hasSubItems = !!item.subItems
              const isOpen = openDropdowns[item.href]
              const isPrimary = (item as any).primary

              return (
                <div key={item.href} className="space-y-1">
                  {hasSubItems ? (
                    <div 
                      onClick={(e) => toggleDropdown(item.href, e)}
                      className={cn(
                        'flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm font-medium cursor-pointer',
                        isActive && !isOpen
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn("w-4 h-4 flex-shrink-0", isPrimary && !isActive ? "text-primary" : "")} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {isOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                          : isPrimary 
                            ? 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground bg-primary/5 border border-primary/10' 
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <Icon className={cn("w-4 h-4 flex-shrink-0", isPrimary && !isActive ? "text-primary" : "")} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  )}

                  {/* SubItems Dropdown */}
                  {hasSubItems && isOpen && (
                    <div className="pl-9 pr-3 py-1 space-y-1 relative">
                      {/* Subtle left connector line */}
                      <div className="absolute left-6 top-1 bottom-1 w-[1px] bg-sidebar-border/50"></div>
                      
                      {item.subItems!.map((subItem) => {
                        const [path, hash] = subItem.href.split('#')
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={(e) => handleSubItemClick(e, subItem.href)}
                            className="block px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:text-foreground hover:bg-sidebar-accent/50 transition-all duration-200 relative group"
                          >
                            {/* Hover indicator line */}
                            <div className="absolute left-[-13px] top-1/2 -translate-y-1/2 w-[2px] h-0 bg-primary/50 group-hover:h-full transition-all duration-200 rounded-r-full"></div>
                            {subItem.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4 bg-sidebar-accent/50">
        <p className="text-xs text-sidebar-foreground/60 text-center">
          {APP_NAME} v1.0.0
        </p>
      </div>
    </aside>
  )
}
