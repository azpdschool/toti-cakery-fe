// src/lib/roles.ts
import type { SellerRole, UserRole } from '@/types'

export function isSellerRole(role?: string): role is SellerRole {
  return role === 'owner' || role === 'admin' || role === 'staff'
}

export function isOwner(role?: string): boolean {
  return role === 'owner'
}

export function isAdmin(role?: string): boolean {
  return role === 'admin'
}

export function isStaff(role?: string): boolean {
  return role === 'staff'
}

export function isAdminOrOwner(role?: string): boolean {
  return role === 'owner' || role === 'admin'
}

export function roleLabel(role?: UserRole): string {
  if (role === 'owner') return 'Owner / Superadmin'
  if (role === 'admin') return 'Admin'
  if (role === 'staff') return 'Staff'
  if (role === 'buyer') return 'Buyer'
  return 'User'
}
