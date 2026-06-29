export type BuyerRole = 'buyer'
export type SellerRole = 'owner' | 'admin' | 'staff'
export type UserRole = BuyerRole | SellerRole

export interface User {
  id: string
  name: string
  role: UserRole
  phone?: string
  email?: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
}
