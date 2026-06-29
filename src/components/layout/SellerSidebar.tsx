// src/components/layout/SellerSidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Receipt,
  Bot,
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission } from '@/services/rbacService';
import { UserRole } from '@/services/sellerSettingsService';

// Definisikan semua menu dengan permission yang dibutuhkan
const allMenuItems = [
  { path: ROUTES.SELLER_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, permission: null }, // semua role bisa lihat dashboard
  { path: ROUTES.SELLER_ORDERS, label: 'Pesanan', icon: ShoppingCart, permission: 'view_process_orders' },
  { path: ROUTES.SELLER_PRODUCTS, label: 'Produk', icon: Package, permission: 'manage_products' },
  { path: ROUTES.SELLER_INVENTORY, label: 'Stok', icon: Boxes, permission: 'manage_inventory' },
  { path: ROUTES.SELLER_REPORTS, label: 'Keuangan', icon: Receipt, permission: 'view_financial_reports' },
  { path: '/seller/chatbot', label: 'Chatbot', icon: Bot, permission: 'manage_chatbot_faq' },
  { path: '/seller/settings', label: 'Pengaturan', icon: Settings, permission: null }, // semua role bisa lihat settings? Tapi kita batasi di dalam halaman
];

export function SellerSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/seller');
  };

  const initial = user?.name?.charAt(0) || 'U';
  const role = user?.role as UserRole;

  // Filter menu berdasarkan permission
  const menuItems = allMenuItems.filter((item) => {
    if (!item.permission) return true; // menu tanpa permission (dashboard, settings) bisa dilihat semua
    return hasPermission(role, item.permission);
  });

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col overflow-y-auto bg-[#3A1F16]">
      <div className="flex flex-1 flex-col p-4">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <img src="src/assets/logo.png" alt="Toti Cakery" className="h-8 w-auto" />
          <span className="text-xl font-black text-white">TOTI</span>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#E0A04E] text-[#3A1F16]'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Profil User */}
        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E0A04E] text-sm font-black text-[#3A1F16]">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.name || 'User'}</p>
              <p className="text-xs capitalize text-white/60">{user?.role || 'Owner'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}