// src/components/common/AuthProvider.tsx
import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthState, SellerRole, User, UserRole } from '@/types'
import { TOKEN_KEY, USER_KEY } from '@/constants'

export interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void
  logout: () => void
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

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    if (!token || !storedUser) return

    try {
      const user = JSON.parse(storedUser) as User

      setAuth({
        user,
        accessToken: token,
        isAuthenticated: true,
      })
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }, [])

  const login = (token: string, user: User) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))

    setAuth({
      user,
      accessToken: token,
      isAuthenticated: true,
    })
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)

    setAuth({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    })
  }

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!auth.user) return false

    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    return allowedRoles.includes(auth.user.role)
  }

  const hasSellerRole = (roles: SellerRole | SellerRole[]) => {
    if (!auth.user || !isSellerRole(auth.user.role)) return false

    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    return allowedRoles.includes(auth.user.role)
  }

  const value = useMemo<AuthContextType>(() => {
    const role = auth.user?.role

    return {
      ...auth,
      login,
      logout,
      hasRole,
      hasSellerRole,
      isSeller: isSellerRole(role),
      isOwner: role === 'owner',
      isAdmin: role === 'admin',
      isStaff: role === 'staff',
    }
  }, [auth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
