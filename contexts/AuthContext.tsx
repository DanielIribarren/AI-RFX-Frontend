"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService, User, AuthResponse } from '@/lib/authService'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, fullName: string, companyName?: string) => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<User>) => Promise<void>
  isAuthenticated: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = async () => {
    console.log('🔄 AuthContext: Loading user...')
    
    // Check if we have a token first
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('access_token')
    
    if (!hasToken) {
      console.log('❌ AuthContext: No access token found, skipping user load')
      setUser(null)
      setLoading(false)
      return
    }
    
    // First, try to refresh token if needed
    const tokenRefreshed = await authService.refreshTokenIfNeeded()
    console.log('🔄 AuthContext: Token refresh result:', tokenRefreshed)
    
    if (tokenRefreshed && authService.isAuthenticated()) {
      console.log('✅ AuthContext: Token is valid, fetching user...')
      try {
        const currentUser = await authService.getCurrentUser()
        console.log('✅ AuthContext: User loaded:', currentUser.email)
        setUser(currentUser)
      } catch (error) {
        console.error('❌ AuthContext: Failed to load user:', error)
        // Clear everything if we can't fetch user data
        console.log('🧹 AuthContext: Clearing tokens due to fetch failure')
        authService.clearTokens()
        if (typeof window !== 'undefined') {
          document.cookie = 'access_token=; path=/; max-age=0'
          document.cookie = 'refresh_token=; path=/; max-age=0'
        }
        setUser(null)
      }
    } else {
      console.log('❌ AuthContext: Token is expired or missing')
      console.log('💡 AuthContext: User needs to login again')
      // Token is expired or doesn't exist - clear everything
      authService.clearTokens()
      // Clear cookies too
      if (typeof window !== 'undefined') {
        document.cookie = 'access_token=; path=/; max-age=0'
        document.cookie = 'refresh_token=; path=/; max-age=0'
      }
      setUser(null)
    }
    setLoading(false)
    console.log('✅ AuthContext: Loading complete')
  }

  useEffect(() => {
    loadUser()
    
    // Set up periodic token refresh check (every 5 minutes)
    const refreshInterval = setInterval(async () => {
      if (authService.isAuthenticated()) {
        await authService.refreshTokenIfNeeded()
      }
    }, 5 * 60 * 1000) // 5 minutes
    
    return () => clearInterval(refreshInterval)
  }, [])

  const login = async (email: string, password: string) => {
    console.log('🔐 [AUTH CONTEXT] Starting login...')
    setLoading(true)
    try {
      // Use Next.js API route instead of direct backend call
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important: include cookies
      })
      
      console.log('🔐 [AUTH CONTEXT] Login response status:', res.status)
      
      const response: AuthResponse = await res.json()
      console.log('🔐 [AUTH CONTEXT] Login response data:', {
        status: response.status,
        message: response.message,
        hasAccessToken: !!response.access_token,
        hasRefreshToken: !!response.refresh_token,
        hasUser: !!response.user,
      })
      
      if (!res.ok) {
        console.error('❌ [AUTH CONTEXT] Login failed:', response.message)
        throw new Error(response.message || 'Login failed')
      }
      
      // Save tokens in localStorage
      if (response.access_token) {
        console.log('💾 [AUTH CONTEXT] Saving access token to localStorage')
        localStorage.setItem('access_token', response.access_token)
      }
      if (response.refresh_token) {
        console.log('💾 [AUTH CONTEXT] Saving refresh token to localStorage')
        localStorage.setItem('refresh_token', response.refresh_token)
      }
      
      // Note: Cookies are already set by the API route
      // But we set them again here for redundancy
      if (response.access_token) {
        console.log('🍪 [AUTH CONTEXT] Setting access token cookie')
        document.cookie = `access_token=${response.access_token}; path=/; max-age=86400; SameSite=Lax`
      }
      if (response.refresh_token) {
        console.log('🍪 [AUTH CONTEXT] Setting refresh token cookie')
        document.cookie = `refresh_token=${response.refresh_token}; path=/; max-age=604800; SameSite=Lax`
      }
      
      if (response.user) {
        console.log('✅ [AUTH CONTEXT] User logged in:', response.user.email)
        setUser(response.user)
      } else {
        console.warn('⚠️ [AUTH CONTEXT] No user data in response')
      }
    } catch (error) {
      console.error('❌ [AUTH CONTEXT] Login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email: string, password: string, fullName: string, companyName?: string) => {
    setLoading(true)
    try {
      // Use Next.js API route instead of direct backend call
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          full_name: fullName,
          company_name: companyName 
        }),
        credentials: 'include', // Important: include cookies
      })
      
      const response: AuthResponse = await res.json()
      
      if (!res.ok) {
        throw new Error(response.message || 'Signup failed')
      }
      
      // Save tokens in localStorage
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token)
      }
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token)
      }
      
      // Save tokens in cookies for middleware
      if (response.access_token) {
        document.cookie = `access_token=${response.access_token}; path=/; max-age=86400; SameSite=Lax`
      }
      if (response.refresh_token) {
        document.cookie = `refresh_token=${response.refresh_token}; path=/; max-age=604800; SameSite=Lax`
      }
      
      if (response.user) {
        setUser(response.user)
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authService.logout() // Ya limpia tokens y cache internamente
    setUser(null)
    // Clear cookies
    document.cookie = 'access_token=; path=/; max-age=0'
    document.cookie = 'refresh_token=; path=/; max-age=0'
  }

  const updateUser = async (updates: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(updates)
      setUser(updatedUser)
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateUser,
        isAuthenticated: !!user,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
