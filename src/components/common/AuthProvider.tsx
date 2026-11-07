// src/components/common/AuthProvider.tsx
import { createContext, useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from 'react'
import type { AuthState, SellerRole, User, UserRole } from '@/types'
import { TOKEN_KEY, USER_KEY } from '@/constants'
import { jwtDecode } from 'jwt-decode'
import { logoutApi, getBuyerProfile, invalidateBuyerProfileCache } from '@/api/auth'
import { invalidateNotificationCache } from '@/hooks/useNotifications'
import { invalidateWishlistCache } from '@/hooks/useWishlist'
import { invalidateProfileCache } from '@/services/sellerSettingsService'
import { toast } from 'react-hot-toast'
import i18n from '@/lib/i18n'

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
    localStorage.removeItem('toti_cart')
    localStorage.removeItem('last_activity')

    invalidateBuyerProfileCache()
    invalidateNotificationCache()
    invalidateWishlistCache()
    invalidateProfileCache()

    window.dispatchEvent(new Event('auth:logout'))

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
      const isUnchanged = (Object.keys(updatedFields) as Array<keyof User>).every(
        (key) => prev.user![key] === updatedFields[key]
      )
      if (isUnchanged) {
        return prev
      }
      const newUser: User = { ...prev.user, ...updatedFields }
      localStorage.setItem(USER_KEY, JSON.stringify(newUser))
      return {
        ...prev,
        user: newUser,
      }
    })
  }, [])

  const login = useCallback((token: string, user: User) => {
    invalidateProfileCache()
    invalidateBuyerProfileCache()
    invalidateNotificationCache()
    invalidateWishlistCache()
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

  // Sync auth state across multiple tabs (e.g., login, logout, or account switch in another tab)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      // Case 1: Token cleared or all localStorage cleared in another tab
      if ((e.key === TOKEN_KEY && !e.newValue) || (e.key === null && !localStorage.getItem(TOKEN_KEY))) {
        invalidateBuyerProfileCache()
        invalidateNotificationCache()
        invalidateWishlistCache()
        invalidateProfileCache()

        setAuth({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        })
        return
      }

      // Case 2: Token updated/replaced in another tab (new login or account switch)
      if (e.key === TOKEN_KEY && e.newValue) {
        try {
          const decoded = jwtDecode(e.newValue)
          if (decoded.exp && decoded.exp * 1000 > Date.now()) {
            const storedUser = localStorage.getItem(USER_KEY)
            let parsedUser: User | null = null
            if (storedUser) {
              try {
                parsedUser = JSON.parse(storedUser) as User
              } catch {
                parsedUser = null
              }
            }

            // Invalidate caches from previous user session
            invalidateProfileCache()
            invalidateBuyerProfileCache()
            invalidateNotificationCache()
            invalidateWishlistCache()

            setAuth({
              user: parsedUser,
              accessToken: e.newValue,
              isAuthenticated: true,
            })
          } else {
            logout()
          }
        } catch {
          logout()
        }
        return
      }

      // Case 3: User data updated in another tab
      if (e.key === USER_KEY) {
        if (!e.newValue) {
          if (!localStorage.getItem(TOKEN_KEY)) {
            setAuth({
              user: null,
              accessToken: null,
              isAuthenticated: false,
            })
          }
        } else {
          try {
            const updatedUser = JSON.parse(e.newValue) as User
            setAuth((prev) => {
              if (prev.isAuthenticated) {
                return {
                  ...prev,
                  user: updatedUser,
                }
              }
              return prev
            })
          } catch {
            // Ignore malformed JSON
          }
        }
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [logout])

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
        const isEn = i18n.language === 'en' || (typeof window !== 'undefined' && window.location.pathname.startsWith('/seller'))
        toast.error(
          isEn
            ? 'You have been logged out automatically due to 1 hour of inactivity.'
            : 'Anda telah logout otomatis karena tidak ada aktivitas selama 1 jam.'
        )
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
