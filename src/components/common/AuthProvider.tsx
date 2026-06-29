import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthState, User } from '@/types'
import { TOKEN_KEY, USER_KEY } from '@/constants'

export interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

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

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
