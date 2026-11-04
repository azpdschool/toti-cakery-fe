import { NavLink } from 'react-router-dom'
import { Home, ShoppingBag, ShoppingCart, ClipboardList, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants'

export function BuyerBottomNav() {
  const { t } = useTranslation()
  const { totalItems } = useCart()
  const { user } = useAuth()

  const profileRoute = user && user.role === 'buyer' ? '/profile' : ROUTES.AUTH_BUYER

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex flex-1 flex-col items-center justify-center py-2 text-[10px] font-semibold transition-colors',
      isActive ? 'text-[#9B4A2F]' : 'text-[#7D6E65] hover:text-[#3A1F16]',
    ].join(' ')

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAD8CA] pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex h-14 items-center justify-around px-2">
        <NavLink to={ROUTES.HOME} className={navLinkClass}>
          <Home className="h-5 w-5 mb-0.5" />
          <span>{t('nav.home', 'Beranda')}</span>
        </NavLink>

        <NavLink to={ROUTES.CATALOG} className={navLinkClass}>
          <ShoppingBag className="h-5 w-5 mb-0.5" />
          <span>{t('nav.catalog', 'Produk')}</span>
        </NavLink>

        <NavLink to={ROUTES.CART} className={navLinkClass}>
          <div className="relative">
            <ShoppingCart className="h-5 w-5 mb-0.5" />
            {totalItems > 0 && (
              <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9B4A2F] px-1 text-[9px] font-bold leading-none text-white">
                {totalItems}
              </span>
            )}
          </div>
          <span>{t('nav.cart', 'Keranjang')}</span>
        </NavLink>

        <NavLink to={ROUTES.ORDERS} className={navLinkClass}>
          <ClipboardList className="h-5 w-5 mb-0.5" />
          <span>{t('nav.orders', 'Pesanan')}</span>
        </NavLink>

        <NavLink to={profileRoute} className={navLinkClass}>
          <User className="h-5 w-5 mb-0.5" />
          <span>{user && user.role === 'buyer' ? t('nav.profile', 'Profil') : t('nav.login', 'Masuk')}</span>
        </NavLink>
      </div>
    </nav>
  )
}
