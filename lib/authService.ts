import axios, { AxiosError } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:5001/api/auth'

// Helper function to decode JWT and check expiration
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expirationTime = payload.exp * 1000 // Convert to milliseconds
    const currentTime = Date.now()
    // Add 5 minute buffer to refresh before actual expiration
    return currentTime >= (expirationTime - 5 * 60 * 1000)
  } catch (error) {
    console.error('Error decoding token:', error)
    return true // If we can't decode, consider it expired
  }
}

export interface User {
  id: string
  email: string
  full_name: string
  company_name?: string
  phone?: string
  status: 'active' | 'inactive' | 'pending_verification'
  email_verified: boolean
  email_verified_at?: string
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  status: 'success' | 'error'
  message?: string
  access_token?: string
  refresh_token?: string
  expires_in?: number
  user?: User
}

export interface ErrorResponse {
  status: 'error'
  message: string
  error?: string
  errors?: string[]
}

// Configurar axios con interceptores
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar errores 401 (token expirado)
let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = []

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axios(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const { data } = await axios.post<AuthResponse>(`${API_BASE_URL}/refresh`, {
            refresh_token: refreshToken,
          })
          if (data.access_token) {
            localStorage.setItem('access_token', data.access_token)
            if (data.refresh_token) {
              localStorage.setItem('refresh_token', data.refresh_token)
            }
            api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`
            processQueue(null, data.access_token)
            isRefreshing = false
            return axios(originalRequest)
          }
        } catch (refreshError) {
          processQueue(refreshError as Error, null)
          isRefreshing = false
          // Only logout if refresh token is actually invalid
          console.error('Token refresh failed:', refreshError)
          authService.clearTokens()
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
          return Promise.reject(refreshError)
        }
      } else {
        isRefreshing = false
        // Only logout if we're not already on login page
        authService.clearTokens()
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authService = {
  // Signup
  async signup(email: string, password: string, fullName: string, companyName?: string): Promise<AuthResponse> {
    try {
      const { data } = await api.post<AuthResponse>('/signup', {
        email,
        password,
        full_name: fullName,
        company_name: companyName,
      })
      
      // Guardar tokens
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token)
      }
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token)
      }
      
      return data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data
      }
      throw new Error('Network error. Please try again.')
    }
  },

  // Login
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data } = await api.post<AuthResponse>('/login', { email, password })
      
      // Guardar tokens
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token)
      }
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token)
      }
      
      return data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data
      }
      throw new Error('Network error. Please try again.')
    }
  },

  // Clear tokens without redirecting
  clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  },

  // Logout
  logout() {
    this.clearTokens()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    try {
      const { data } = await api.get<{ status: string; user: User }>('/me')
      return data.user
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data
      }
      throw new Error('Failed to fetch user data')
    }
  },

  // Forgot password
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const { data } = await api.post<{ status: string; message: string }>('/forgot-password', { email })
      return { message: data.message }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data
      }
      throw new Error('Failed to send reset email')
    }
  },

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const { data } = await api.post<{ status: string; message: string }>('/reset-password', {
        token,
        new_password: newPassword,
      })
      return { message: data.message }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data
      }
      throw new Error('Failed to reset password')
    }
  },

  // Verify email
  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const { data } = await api.post<{ status: string; message: string }>('/verify-email', { token })
      return { message: data.message }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data
      }
      throw new Error('Failed to verify email')
    }
  },

  // Resend verification email
  async resendVerification(): Promise<{ message: string }> {
    try {
      const { data } = await api.post<{ status: string; message: string }>('/resend-verification')
      return { message: data.message }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data
      }
      throw new Error('Failed to resend verification')
    }
  },

  // Update profile
  async updateProfile(updates: Partial<Omit<User, 'id' | 'email' | 'created_at' | 'updated_at'>>): Promise<User> {
    try {
      const { data } = await api.put<{ status: string; user: User }>('/profile', updates)
      return data.user
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data
      }
      throw new Error('Failed to update profile')
    }
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      const { data } = await api.post<{ status: string; message: string }>('/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      return { message: data.message }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data
      }
      throw new Error('Failed to change password')
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    const token = localStorage.getItem('access_token')
    if (!token) return false
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      console.log('Access token is expired or about to expire')
      return false
    }
    
    return true
  },

  // Get stored token
  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('access_token')
  },

  // Proactively refresh token if it's about to expire
  async refreshTokenIfNeeded(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    const token = localStorage.getItem('access_token')
    const refreshToken = localStorage.getItem('refresh_token')
    
    if (!token || !refreshToken) return false
    
    // Check if token is expired or about to expire
    if (isTokenExpired(token)) {
      try {
        const { data } = await axios.post<AuthResponse>(`${API_BASE_URL}/refresh`, {
          refresh_token: refreshToken,
        })
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token)
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token)
          }
          return true
        }
      } catch (error) {
        console.error('Failed to refresh token:', error)
        return false
      }
    }
    
    return true // Token is still valid
  },
}
