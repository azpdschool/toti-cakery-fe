// src/components/layout/SellerSidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Receipt,
  MessageCircleQuestion,
  Settings,
  LogOut,
} from 'lucide-react'
import { ROUTES, LOGO_URL } from '@/constants'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission } from '@/services/rbacService'
import { roleLabel } from '@/lib/roles'

const allMenuItems = [
  {
    path: ROUTES.SELLER_DASHBOARD,
    label: 'Dashboard',
    icon: LayoutDashboard,
    permission: 'view_dashboard',
  },
  {
    path: ROUTES.SELLER_ORDERS,
    label: 'Pesanan',
    icon: ShoppingCart,
    permission: 'view_process_orders',
  },
  {
    path: ROUTES.SELLER_PRODUCTS,
    label: 'Produk',
    icon: Package,
    permission: 'manage_products',
  },
  {
    path: ROUTES.SELLER_INVENTORY,
    label: 'Stok',
    icon: Boxes,
    permission: 'manage_inventory',
  },
  {
    path: ROUTES.SELLER_REPORTS,
    label: 'Keuangan',
    icon: Receipt,
    permission: 'view_financial_reports',
  },
  {
    path: ROUTES.SELLER_CHATBOT,
    label: 'FAQ',
    icon: MessageCircleQuestion,
    permission: 'manage_chatbot_faq',
  },
  {
    path: ROUTES.SELLER_SETTINGS,
    label: 'Pengaturan',
    icon: Settings,
    permission: 'manage_users',
  },
]

interface SellerSidebarProps {
  isOpen: boolean
}

export function SellerSidebar({ isOpen }: SellerSidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate(ROUTES.AUTH_SELLER, { replace: true })
  }

  const initial = user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'
  const role = user?.role

  const menuItems = allMenuItems.filter((item) => {
    return hasPermission(role, item.permission)
  })

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 flex h-screen flex-col overflow-hidden bg-[#F6EDDE]
        transition-all duration-300 ease-in-out
        lg:sticky lg:top-0
        ${
          isOpen
            ? 'w-64 translate-x-0'
            : '-translate-x-full w-64 lg:translate-x-0 lg:w-0'
        }
      `}
    >
      <div className="flex h-full w-64 flex-col overflow-y-auto p-4">
        <div className="mb-8 flex items-center justify-center">
          <img
            src={LOGO_URL}
            alt="Toti Cakery"
            className="w-40 h-auto object-contain"
          />
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#E0A04E] text-[#3A1F16]'
                    : 'text-[#4b2417]/80 hover:bg-[#4b2417]/5 hover:text-[#4b2417]'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-[#4b2417]/10 pt-4">
          <div className="flex items-center gap-3 rounded-lg bg-[#4b2417]/5 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E0A04E] text-sm font-black uppercase text-[#3A1F16]">
              {initial}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#4b2417]">
                {user?.name || user?.username || 'User'}
              </p>

              <p className="text-xs capitalize text-[#4b2417]/60">
                {roleLabel(user?.role)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full p-1.5 text-[#4b2417]/60 hover:bg-[#4b2417]/10 hover:text-[#4b2417] shrink-0"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
