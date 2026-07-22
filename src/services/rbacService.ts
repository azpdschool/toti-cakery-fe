// src/services/rbacService.ts
import type { SellerRole, UserRole } from '@/types'

export interface Permission {
  id: string
  key: string
  label: string
  module: string
}

export const allPermissions: Permission[] = [
  {
    id: 'p1',
    key: 'view_dashboard',
    label: 'Lihat dashboard',
    module: 'Dashboard',
  },
  {
    id: 'p2',
    key: 'manage_products',
    label: 'Kelola produk',
    module: 'Produk',
  },
  {
    id: 'p3',
    key: 'view_process_orders',
    label: 'Lihat & proses pesanan',
    module: 'Pesanan',
  },
  {
    id: 'p4',
    key: 'manage_inventory',
    label: 'Kelola stok & bahan',
    module: 'Stok',
  },
  {
    id: 'p5',
    key: 'add_manual_order',
    label: 'Tambah pesanan manual',
    module: 'Pesanan',
  },
  {
    id: 'p6',
    key: 'view_financial_reports',
    label: 'Lihat laporan keuangan',
    module: 'Keuangan',
  },
  {
    id: 'p7',
    key: 'manage_chatbot_faq',
    label: 'Kelola chatbot FAQ',
    module: 'Chatbot',
  },
  {
    id: 'p8',
    key: 'manage_users',
    label: 'Kelola pengguna',
    module: 'Pengaturan',
  },
  {
    id: 'p9',
    key: 'edit_shop_settings',
    label: 'Edit pengaturan toko',
    module: 'Pengaturan',
  },
  {
    id: 'p10',
    key: 'delete_data',
    label: 'Hapus data',
    module: 'Lainnya',
  },
  {
    id: 'p11',
    key: 'export_reports',
    label: 'Export laporan',
    module: 'Laporan',
  },
]

export type PermissionKey = (typeof allPermissions)[number]['key']

const rolePermissionMap: Record<SellerRole, string[]> = {
  owner: allPermissions.map((permission) => permission.key),

  admin: [
    'view_dashboard',
    'manage_products',
    'view_process_orders',
    'manage_inventory',
    'add_manual_order',
    'manage_chatbot_faq',
  ],

  staff: [
    'view_dashboard',
    'view_process_orders',
    'manage_inventory',
  ],
}

function isSellerRole(role?: UserRole): role is SellerRole {
  return role === 'owner' || role === 'admin' || role === 'staff'
}

/**
 * Dibuat async supaya tetap compatible dengan page lama
 * yang mungkin masih pakai:
 * await getPermissionsByRole(...)
 * atau
 * getPermissionsByRole(...).then(...)
 */
export async function getPermissionsByRole(role: UserRole): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))

  if (!isSellerRole(role)) return []

  return rolePermissionMap[role] ?? []
}

export async function getAllPermissions(): Promise<Permission[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))

  return allPermissions
}

/**
 * Untuk sekarang permission masih FE/static.
 * Kalau nanti BE sudah punya endpoint role-permission,
 * function ini bisa diganti call API.
 */
export async function updateRolePermissions(
  role: UserRole,
  permissions: string[],
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  if (!isSellerRole(role)) return

  rolePermissionMap[role] = permissions
}

/**
 * Function sync untuk sidebar/menu.
 */
export function hasPermission(
  role: UserRole | undefined,
  permissionKey: string,
): boolean {
  if (!role || !isSellerRole(role)) return false

  const permissions = rolePermissionMap[role] ?? []

  return permissions.includes(permissionKey)
}

export function canAccessSellerPage(
  role: UserRole | undefined,
  permissionKey?: string | null,
): boolean {
  if (!role || !isSellerRole(role)) return false
  if (!permissionKey) return true

  return hasPermission(role, permissionKey)
}
