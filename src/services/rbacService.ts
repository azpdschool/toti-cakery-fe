import { UserRole } from './sellerSettingsService';

export interface Permission {
  id: string;
  key: string;
  label: string;
  module: string;
}

export const allPermissions: Permission[] = [
  { id: 'p1', key: 'manage_products', label: 'Kelola produk', module: 'Produk' },
  { id: 'p2', key: 'view_process_orders', label: 'Lihat & proses order', module: 'Pesanan' },
  { id: 'p3', key: 'manage_inventory', label: 'Kelola stok & bahan', module: 'Stok' },
  { id: 'p4', key: 'add_manual_order', label: 'Tambah order manual', module: 'Pesanan' },
  { id: 'p5', key: 'view_financial_reports', label: 'Lihat laporan keuangan', module: 'Keuangan' },
  { id: 'p6', key: 'manage_chatbot_faq', label: 'Kelola chatbot FAQ', module: 'Chatbot' },
  { id: 'p7', key: 'manage_users', label: 'Kelola pengguna', module: 'Pengaturan' },
  { id: 'p8', key: 'edit_shop_settings', label: 'Edit pengaturan toko', module: 'Pengaturan' },
  { id: 'p9', key: 'delete_data', label: 'Hapus data', module: 'Lainnya' },
  { id: 'p10', key: 'export_reports', label: 'Export laporan', module: 'Lainnya' },
];

// Default permissions per role (sesuai gambar rbac.jpeg)
const rolePermissionMap: Record<UserRole, string[]> = {
  owner: allPermissions.map(p => p.key),
  admin: [
    'manage_products',
    'view_process_orders',
    'manage_inventory',
    'add_manual_order',
    // admin tidak punya view_financial_reports? Berdasarkan gambar, admin punya Manage Order & Finance, jadi mungkin punya view_financial_reports? Di gambar, admin punya Manage Order & Finance, jadi mungkin dia bisa melihat laporan keuangan. Namun di jpeg awal, owner yang punya view financial reports, admin tidak. Tapi di gambar rbac, admin punya Manage Order & Finance, yang mencakup Manage Orders, Verify Payments, Manage Invoices. Tidak disebutkan View Financial Reports secara eksplisit. Saya akan ikuti gambar rbac: admin tidak punya 'view_financial_reports', 'manage_users', 'edit_shop_settings', 'delete_data', 'export_reports'.
    'manage_chatbot_faq',
    // admin tidak punya manage_users, edit_shop_settings, delete_data, export_reports
  ],
  staff: [
    'view_process_orders',
    'manage_inventory', // manage stock
    // staff tidak punya manage_products, add_manual_order, view_financial_reports, etc.
  ],
};

// Untuk buyer tidak digunakan di sini

export async function getPermissionsByRole(role: UserRole): Promise<string[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return rolePermissionMap[role] || [];
}

export async function getAllPermissions(): Promise<Permission[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return allPermissions;
}

export async function updateRolePermissions(role: UserRole, permissions: string[]): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
  rolePermissionMap[role] = permissions;
}

export function hasPermission(role: UserRole | undefined, permissionKey: string): boolean {
  if (!role) return false;
  const perms = rolePermissionMap[role] || [];
  return perms.includes(permissionKey);
}