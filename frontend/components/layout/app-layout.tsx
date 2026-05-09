'use client'

import React from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'

import { useAuth } from '@/hooks/use-auth'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { authReady, isAuthenticated } = useAuth()

  if (authReady && !isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
