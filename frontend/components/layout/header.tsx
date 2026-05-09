'use client'

import React from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor, User, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export function Header() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const [mounted, setMounted] = React.useState(false)
  const [themeDropdownOpen, setThemeDropdownOpen] = React.useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-16 bg-card border-b border-border" />
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Workspace</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Theme Dropdown */}
        <div className="relative">
          <button
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="p-2 hover:bg-primary/20 rounded-lg transition-all flex items-center gap-1"
            aria-label="Theme selector"
            title={`Current theme: ${theme || 'system'}`}
          >
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-primary" />
            ) : theme === 'light' ? (
              <Sun className="w-5 h-5 text-primary" />
            ) : (
              <Monitor className="w-5 h-5 text-primary" />
            )}
          </button>

          {/* Dropdown Menu */}
          {themeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="p-2 space-y-1">
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  const isActive = theme === option.value

                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTheme(option.value as any)
                        setThemeDropdownOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-left ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{option.label}</span>
                      {isActive && <span className="ml-auto text-primary text-lg">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button 
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="p-2 hover:bg-primary/20 rounded-lg transition-all flex items-center gap-2"
            aria-label="User menu"
          >
            <User className="w-5 h-5 text-primary" />
            {user && (
              <span className="text-sm font-medium text-foreground hidden sm:inline-block">
                {user.full_name || user.email}
              </span>
            )}
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="p-2 space-y-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close dropdowns on outside click */}
      {(themeDropdownOpen || userDropdownOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setThemeDropdownOpen(false)
            setUserDropdownOpen(false)
          }}
        />
      )}
    </header>
  )
}



