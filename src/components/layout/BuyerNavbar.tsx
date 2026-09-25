// src/components/layout/BuyerNavbar.tsx

import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown,
  ClipboardList,
  Home,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
  X,
} from 'lucide-react'

import { useCart } from '@/context/CartContext'
import { useAuth } from '@/hooks/useAuth'
import { LANG_KEY, ROUTES, LOGO_URL } from '@/constants'
import { NotificationBell } from '@/components/common/NotificationBell'

const languages = [
  {
    code: 'id',
    label: 'ID',
    flag: '🇮🇩',
  },
  {
    code: 'en',
    label: 'EN',
    flag: '🇬🇧',
  },
] as const

export function BuyerNavbar() {
  const { t, i18n } = useTranslation()
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { totalItems } = useCart()
  const { user } = useAuth()
  const avatarUrl = user?.avatar_url
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [avatarUrl])

  const currentLanguage =
    languages.find((language) => language.code === i18n.language) ?? languages[0]

  function handleChangeLanguage(language: (typeof languages)[number]) {
    i18n.changeLanguage(language.code)
    localStorage.setItem(LANG_KEY, language.code)
    setIsLanguageOpen(false)
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'relative flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[#9B4A2F]',
      isActive
        ? 'text-[#9B4A2F] after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-[#9B4A2F]'
        : 'text-[#3A1F16]',
    ].join(' ')

  const getInitials = (name: string) => {
    if (!name) return 'U'

    const parts = name.trim().split(' ').filter(Boolean)

    if (parts.length === 0) return 'U'
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()

    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#D0BFAF] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-4 px-4 md:px-8 lg:pl-12 lg:pr-12 xl:gap-7">
        {/* KIRI: Logo + Beranda */}
        <div className="flex min-w-0 shrink-0 items-center gap-6 xl:gap-7">
          <Link to={ROUTES.HOME} className="ml-6 flex shrink-0 items-center">
            <img
              src={LOGO_URL}
              alt="Toti Cakery"
              className="h-10 w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-6 whitespace-nowrap xl:gap-7 md:flex">
            <NavLink to={ROUTES.HOME} className={navLinkClass}>
              <Home className="h-4 w-4" />
              <span>{t('nav.home', 'Beranda')}</span>
            </NavLink>

            <NavLink to={ROUTES.CATALOG} className={navLinkClass}>
              <ShoppingBag className="h-4 w-4" />
              <span>{t('nav.catalog', 'Produk')}</span>
            </NavLink>
          </nav>
        </div>

        {/* TENGAH: Search Bar */}
        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <div className="relative w-full max-w-[420px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B4A3C]" />
            <input
              type="text"
              placeholder={t('nav.search', 'Cari dessert favorit kamu..')}
              className="h-10 w-full rounded-full border border-[#D0BFAF] bg-white/75 pl-11 pr-5 text-xs font-medium text-[#3A1F16] outline-none placeholder:text-[#9C8478] focus:border-[#9B4A2F] focus:ring-2 focus:ring-[#9B4A2F]/25"
            />
          </div>
        </div>

        {/* Keranjang, Pesanan Saya */}
        <nav className="hidden shrink-0 items-center gap-6 whitespace-nowrap xl:gap-7 md:flex">
          <NavLink to={ROUTES.CART} className={navLinkClass}>
            <div className="relative">
              <ShoppingCart className="h-4 w-4" />

              {totalItems > 0 && (
                <span className="absolute -right-2.5 -top-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9B4A2F] px-1 text-[9px] font-bold leading-none text-white">
                  {totalItems}
                </span>
              )}
            </div>

            <span>{t('nav.cart', 'Keranjang')}</span>
          </NavLink>

          <NavLink to={ROUTES.ORDERS} className={navLinkClass}>
            <ClipboardList className="h-4 w-4" />
            <span>{t('nav.orders', 'Pesanan Saya')}</span>
          </NavLink>
        </nav>

        {/* KANAN: Language + Profile */}
        <div className="flex min-w-0 shrink-0 items-center gap-4 md:gap-6 xl:gap-7">
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setIsLanguageOpen((value) => !value)}
              className="flex h-10 items-center justify-center gap-1.5 px-1 text-xs font-semibold text-[#3A1F16] transition-colors hover:text-[#9B4A2F]"
            >
              <span>{currentLanguage.flag}</span>
              <span>{currentLanguage.label}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-75" />
            </button>

            {isLanguageOpen && (
              <div className="absolute right-0 top-12 w-24 overflow-hidden rounded-lg border border-[#D0BFAF] bg-white shadow-lg">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => handleChangeLanguage(language)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-[#3A1F16] hover:bg-[#F6EFE6]"
                  >
                    <span>{language.flag}</span>
                    <span>{language.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {user && user.role === 'buyer' && <NotificationBell />}


          {user && user.role === 'buyer' ? (
            <Link
              to="/profile"
              className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#3A1F16] transition-colors hover:text-[#9B4A2F]"
            >
              {avatarUrl && !imgError ? (
                <img
                  src={avatarUrl}
                  alt={user.name || 'Avatar'}
                  onError={() => setImgError(true)}
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#9B4A2F] text-xs font-bold text-white">
                  {getInitials(user.name || '')}
                </div>
              )}

              <span className="max-w-[150px] truncate text-sm">
                {user.name?.split(' ')[0] || t('nav.profile', 'Profil')}
              </span>
            </Link>
          ) : (
            <Link
              to={ROUTES.AUTH_BUYER}
              className="hidden h-10 min-w-[154px] items-center justify-center gap-2 rounded-lg border border-[#3A1F16]/70 bg-white/70 px-4 text-xs font-semibold text-[#3A1F16] transition-colors hover:bg-white md:flex"
            >
              <User className="h-4 w-4" />
              {t('nav.login_register', 'Masuk / Daftar')}
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#3A1F16] shadow-sm md:hidden"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-[#D0BFAF] bg-[#EFE4D6] px-4 py-4 md:hidden">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B4A3C]" />
            <input
              type="text"
              placeholder={t('nav.search', 'Cari dessert favorit kamu..')}
              className="h-10 w-full rounded-full border border-[#D0BFAF] bg-white pl-11 pr-4 text-xs text-[#3A1F16] outline-none"
            />
          </div>

          <div className="grid gap-2">
            <Link
              to={ROUTES.HOME}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#3A1F16]"
            >
              <Home className="h-4 w-4" />
              {t('nav.home', 'Beranda')}
            </Link>

            <Link
              to={ROUTES.CATALOG}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#3A1F16]"
            >
              <ShoppingBag className="h-4 w-4" />
              {t('nav.catalog', 'Produk')}
            </Link>

            <Link
              to={ROUTES.CART}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#3A1F16]"
            >
              <div className="relative">
                <ShoppingCart className="h-4 w-4" />

                {totalItems > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9B4A2F] px-1 text-[9px] font-bold text-white">
                    {totalItems}
                  </span>
                )}
              </div>

              <span>{t('nav.cart', 'Keranjang')}</span>
            </Link>

            <Link
              to={ROUTES.ORDERS}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#3A1F16]"
            >
              <ClipboardList className="h-4 w-4" />
              {t('nav.orders', 'Pesanan Saya')}
            </Link>

            {user && user.role === 'buyer' ? (
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#3A1F16]"
              >
                {avatarUrl && !imgError ? (
                  <img
                    src={avatarUrl}
                    alt={user.name || 'Avatar'}
                    onError={() => setImgError(true)}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#9B4A2F] text-xs font-bold text-white">
                    {getInitials(user.name || '')}
                  </div>
                )}

                {user.name || t('nav.profile', 'Profil')}
              </Link>
            ) : (
              <Link
                to={ROUTES.AUTH_BUYER}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl bg-[#9B4A2F] px-4 py-3 text-sm font-semibold text-white"
              >
                <User className="h-4 w-4" />
                {t('nav.login_register', 'Masuk / Daftar')}
              </Link>
            )}

          </div>
        </div>
      )}
    </header>
  )
}