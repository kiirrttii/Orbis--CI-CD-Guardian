'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { apiClient } from '@/lib/api'
import type { UserResponse, LoginRequest, SignupRequest } from '@/lib/api-types'

interface AuthContextType {
  user: UserResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  authReady: boolean
  login: (credentials: LoginRequest) => Promise<any>
  signup: (data: SignupRequest) => Promise<any>
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    const isPublicRoute = pathname === '/login' || pathname === '/signup'
    
    console.log('[AuthProvider] checkAuth init, token present:', !!token, '| Path:', pathname)
    
    if (!token) {
      setUser(null)
      setIsLoading(false)
      setAuthReady(true)
      
      if (!isPublicRoute) {
        console.log('[AuthProvider] No token on protected route, redirecting to /login')
        router.push('/login')
      }
      return
    }

    try {
      console.log('[AuthProvider] Verifying token with backend...')
      const response = await apiClient.verifyToken()
      console.log('[AuthProvider] Verification response:', response.valid)
      
      if (response.valid) {
        setUser(response.user)
      } else {
        console.warn('[AuthProvider] Token invalid, clearing session')
        handleAuthFailure()
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        console.warn('[AuthProvider] Token expired or invalid, clearing session.')
      } else {
        console.error('[AuthProvider] Verification failed:', error)
      }
      handleAuthFailure()
    } finally {
      setIsLoading(false)
      setAuthReady(true)
    }
  }, [pathname, router])

  const handleAuthFailure = useCallback(() => {
    localStorage.removeItem('access_token')
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax'
    setUser(null)
    
    const isPublicRoute = pathname === '/login' || pathname === '/signup'
    if (!isPublicRoute) {
      router.push('/login')
    }
  }, [pathname, router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (credentials: LoginRequest) => {
    console.log('[AuthProvider] Login attempt for:', credentials.email)
    try {
      const response = await apiClient.login(credentials)
      console.log('[AuthProvider] Login raw response:', response)
      
      if (!response.access_token) {
        console.error('[AuthProvider] No access_token in response!')
      }

      setUser(response.user)
      localStorage.setItem('access_token', response.access_token)
      
      const cookieString = `access_token=${response.access_token}; path=/;`
      document.cookie = cookieString
      
      console.log('[AuthProvider] COOKIE ATTEMPT:', cookieString)
      console.log('[AuthProvider] DOCUMENT.COOKIE AFTER SET:', document.cookie)
      
      if (!document.cookie.includes('access_token')) {
        console.error('[AuthProvider] FATAL: Browser rejected the cookie set via JS!')
      } else {
        console.log('[AuthProvider] Cookie verified in document.cookie')
      }

      console.log('[AuthProvider] Navigation starting...')
      router.push('/how-it-works')
      return response
    } catch (error) {
      throw error
    }
  }

  const signup = async (data: SignupRequest) => {
    try {
      const userResponse = await apiClient.signup(data)
      await login({ email: data.email, password: data.password })
      return userResponse
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    apiClient.logout()
    setUser(null)
    localStorage.removeItem('access_token')
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax'
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated: !!user,
      authReady,
      login, 
      signup, 
      logout, 
      checkAuth 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
