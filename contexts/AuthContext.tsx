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
    // First, try to refresh token if needed
    const tokenRefreshed = await authService.refreshTokenIfNeeded()
    
    if (tokenRefreshed && authService.isAuthenticated()) {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Failed to load user:', error)
        // Don't logout immediately - the token might still be valid
        // The interceptor will handle token refresh if needed
        // Only clear user state, but keep tokens for retry
        setUser(null)
      }
    } else {
      // Token is expired or doesn't exist
      setUser(null)
    }
    setLoading(false)
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
    setLoading(true)
    try {
      // Use Next.js API route instead of direct backend call
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      const response: AuthResponse = await res.json()
      
      if (!res.ok) {
        throw new Error(response.message || 'Login failed')
      }
      
      // Save tokens
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token)
      }
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token)
      }
      
      if (response.user) {
        setUser(response.user)
      }
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
      })
      
      const response: AuthResponse = await res.json()
      
      if (!res.ok) {
        throw new Error(response.message || 'Signup failed')
      }
      
      // Save tokens
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token)
      }
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token)
      }
      
      if (response.user) {
        setUser(response.user)
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
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
