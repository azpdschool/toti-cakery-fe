// src/lib/roles.ts
import { UserRole } from '@/services/sellerSettingsService';

export function isSellerRole(role?: string): boolean {
  return role === 'owner' || role === 'admin' || role === 'staff';
}

export function isOwner(role?: string): boolean {
  return role === 'owner';
}

export function isAdmin(role?: string): boolean {
  return role === 'admin' || role === 'owner';
}