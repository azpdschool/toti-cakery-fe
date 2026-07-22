// src/hooks/useAuth.ts
import { useContext } from 'react'
import { AuthContext, type AuthContextType } from '@/components/common/AuthProvider'

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  }

  return context
}
