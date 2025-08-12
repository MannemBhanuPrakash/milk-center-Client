import type { AuthUser } from "../types"
import { apiService } from "./api"

const AUTH_KEY = "msr-milk-center-auth"

export const authService = {
  login: async (username: string, password: string): Promise<AuthUser | null> => {
    try {
      const response = await apiService.login(username, password)

      if (response.success && response.data?.user) {
        const authUser: AuthUser = {
          username: response.data.user.username,
          role: response.data.user.role
        }
        localStorage.setItem(AUTH_KEY, JSON.stringify(authUser))
        return authUser
      }

      const errorMessage = response.message || 'Authentication failed'
      const error = new Error(errorMessage)
        ; (error as any).response = response
        ; (error as any).statusCode = 401
      throw error
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem(AUTH_KEY)
      localStorage.removeItem('auth-token')
    }
  },

  forceLogout: (): void => {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem('auth-token')
    setTimeout(() => {
      window.location.reload()
    }, 100)
  },

  getCurrentUser: (): AuthUser | null => {
    const user = localStorage.getItem(AUTH_KEY)
    return user ? JSON.parse(user) : null
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(AUTH_KEY) && !!localStorage.getItem('auth-token')
  },

  verifyAuth: async (): Promise<boolean> => {
    try {
      const response = await apiService.getCurrentUser()
      return response.success
    } catch (error) {
      localStorage.removeItem(AUTH_KEY)
      localStorage.removeItem('auth-token')
      return false
    }
  },

  isAdmin: (): boolean => {
    const user = authService.getCurrentUser()
    return user?.role === 'admin'
  },

  isUser: (): boolean => {
    const user = authService.getCurrentUser()
    return user?.role === 'user'
  },

  isHelper: (): boolean => {
    const user = authService.getCurrentUser()
    return user?.role === 'helper'
  },

  canAccessAdvancedFeatures: (): boolean => {
    const user = authService.getCurrentUser()
    return user?.role === 'admin' || user?.role === 'user'
  },

  canModifyData: (): boolean => {
    const user = authService.getCurrentUser()
    return user?.role === 'admin' || user?.role === 'user'
  }
}
