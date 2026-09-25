// src/components/common/AuthProvider.tsx
import { createContext, useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from 'react'
import type { AuthState, SellerRole, User, UserRole } from '@/types'
import { TOKEN_KEY, USER_KEY } from '@/constants'
import { jwtDecode } from 'jwt-decode'
import { logoutApi, getBuyerProfile } from '@/api/auth'
import { toast } from 'react-hot-toast'

export interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (updatedFields: Partial<User>) => void
  hasRole: (roles: UserRole | UserRole[]) => boolean
  hasSellerRole: (roles: SellerRole | SellerRole[]) => boolean
  isSeller: boolean
  isOwner: boolean
  isAdmin: boolean
  isStaff: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

function isSellerRole(role?: string): role is SellerRole {
  return role === 'owner' || role === 'admin' || role === 'staff'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
  })

  const logout = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    
    // Clear state safely
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem('buyer_avatar')

    setAuth({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    })

    if (token) {
      try {
        await logoutApi()
      } catch (e) {
        console.error('Backend logout failed, but local state cleared.')
      }
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    if (!token || !storedUser) return

    try {
      const decoded = jwtDecode(token)
      if (decoded.exp && decoded.exp * 1000 > Date.now()) {
        const user = JSON.parse(storedUser) as User
        setAuth({
          user,
          accessToken: token,
          isAuthenticated: true,
        })
      } else {
        // Token expired on startup
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem('buyer_avatar')
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem('buyer_avatar')
    }
  }, [])

  const updateUser = useCallback((updatedFields: Partial<User>) => {
    setAuth((prev) => {
      if (!prev.user) return prev
      const newUser: User = { ...prev.user, ...updatedFields }
      localStorage.setItem(USER_KEY, JSON.stringify(newUser))
      return {
        ...prev,
        user: newUser,
      }
    })
  }, [])

  const login = useCallback((token: string, user: User) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))

    setAuth({
      user,
      accessToken: token,
      isAuthenticated: true,
    })
  }, [])

  // Sync latest Buyer profile (avatar_url) on load
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.role === 'buyer') {
      getBuyerProfile()
        .then((profile) => {
          if (profile && profile.avatar_url !== undefined) {
            updateUser({ avatar_url: profile.avatar_url })
          }
        })
        .catch(() => {
          // Silent fallback if network/auth fails
        })
    }
  }, [auth.isAuthenticated, auth.user?.role, updateUser])

  // Sync auth state across multiple tabs (e.g., if logged out in another tab)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY && !e.newValue) {
        setAuth({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        })
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // 401 Unauthorized handling
  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [logout])

  // Idle Timeout Mechanism (60 minutes)
  const lastActivity = useRef<number>(Date.now())

  useEffect(() => {
    if (!auth.isAuthenticated) return

    const IDLE_TIMEOUT_MS = 60 * 60 * 1000 // 60 minutes
    const ACTIVITY_KEY = 'last_activity'
    
    lastActivity.current = Date.now()
    localStorage.setItem(ACTIVITY_KEY, lastActivity.current.toString())

    let throttleTimer: number | null = null
    const updateActivity = () => {
      lastActivity.current = Date.now()
      
      // Throttle writing to localStorage to prevent performance issues on high frequency events
      if (!throttleTimer) {
        throttleTimer = window.setTimeout(() => {
          localStorage.setItem(ACTIVITY_KEY, Date.now().toString())
          throttleTimer = null
        }, 5000)
      }
    }

    const events = ['mousemove', 'keydown', 'click', 'touchstart']
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true })
    })

    const intervalId = setInterval(() => {
      const globalLastActivityStr = localStorage.getItem(ACTIVITY_KEY)
      const globalLastActivity = globalLastActivityStr ? parseInt(globalLastActivityStr, 10) : lastActivity.current
      
      // Use the most recent timestamp between the local tab and localStorage (other tabs)
      const mostRecentActivity = Math.max(lastActivity.current, globalLastActivity)

      if (Date.now() - mostRecentActivity >= IDLE_TIMEOUT_MS) {
        logout()
        toast.error('Anda telah logout otomatis karena tidak ada aktivitas selama 1 jam.')
      }
    }, 10000) // Check every 10 seconds

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity)
      })
      if (throttleTimer) clearTimeout(throttleTimer)
      clearInterval(intervalId)
    }
  }, [auth.isAuthenticated, logout])

  const value = useMemo<AuthContextType>(() => {
    const role = auth.user?.role

    return {
      ...auth,
      login,
      logout,
      updateUser,
      hasRole: (roles: UserRole | UserRole[]) => {
        if (!auth.user) return false
        const allowedRoles = Array.isArray(roles) ? roles : [roles]
        return allowedRoles.includes(auth.user.role)
      },
      hasSellerRole: (roles: SellerRole | SellerRole[]) => {
        if (!auth.user || !isSellerRole(auth.user.role)) return false
        const allowedRoles = Array.isArray(roles) ? roles : [roles]
        return allowedRoles.includes(auth.user.role)
      },
      isSeller: isSellerRole(role),
      isOwner: role === 'owner',
      isAdmin: role === 'admin',
      isStaff: role === 'staff',
    }
  }, [auth, login, logout, updateUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
