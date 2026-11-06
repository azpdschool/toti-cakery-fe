// src/components/layout/BuyerNavbar.tsx

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Home,
  Menu,
  ShoppingBag,
  ShoppingCart,
  User,
  X,
  HelpCircle,
  ShieldCheck,
  FileText,
  Store,
  Truck,
  ExternalLink,
} from 'lucide-react'

import { useCart } from '@/context/CartContext'
import { useAuth } from '@/hooks/useAuth'
import { useWhatsApp } from '@/context/WhatsAppContext'
import { LANG_KEY, ROUTES, LOGO_URL } from '@/constants'
import { NotificationBell } from '@/components/common/NotificationBell'
import { PublicSearchDropdown } from './PublicSearchDropdown'
import instagramIcon from '@/assets/instagram.png'
import whatsappIcon from '@/assets/whatsapp.png'

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
  const location = useLocation()
  const navigate = useNavigate()
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { totalItems } = useCart()
  const { user } = useAuth()
  const { whatsappNumberDisplay, whatsappUrl } = useWhatsApp()
  const avatarUrl = user?.avatar_url
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [avatarUrl])

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const currentLanguage =
    languages.find((language) => language.code === i18n.language) ?? languages[0]

  function handleChangeLanguage(language: (typeof languages)[number]) {
    i18n.changeLanguage(language.code)
    localStorage.setItem(LANG_KEY, language.code)
    setIsLanguageOpen(false)
  }

  const handleOurStoreClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsMobileMenuOpen(false)
    if (location.pathname === '/') {
      const el = document.getElementById('our-store')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      navigate('/#our-store')
    }
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
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8 lg:pl-12 lg:pr-12 xl:gap-7">
        {/* KIRI: Logo + Beranda (Desktop) */}
        <div className="flex min-w-0 shrink-0 items-center gap-6 xl:gap-7">
          <Link to={ROUTES.HOME} className="ml-0 md:ml-6 flex shrink-0 items-center">
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

        {/* TENGAH: Search Bar (Desktop) */}
        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <div className="w-full max-w-[420px]">
            <PublicSearchDropdown />
          </div>
        </div>

        {/* Keranjang, Pesanan Saya (Desktop) */}
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

        {/* KANAN: Paling Pojok Kanan Atas (Mobile: Notifikasi + Hamburger; Desktop: Language + Notifikasi + Profile) */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 md:gap-6 xl:gap-7">
          {/* Desktop Language Selector */}
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setIsLanguageOpen((value) => !value)}
              className="flex h-10 items-center justify-center gap-1.5 px-1 text-xs font-semibold text-[#3A1F16] transition-colors hover:text-[#9B4A2F]"
              aria-label={t('nav.language_aria', 'Ganti bahasa')}
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

          {/* Notifikasi Bell: Di sebelah kirinya hamburger pada mobile, dan di header pada desktop */}
          {user && user.role === 'buyer' && <NotificationBell />}

          {/* Profile / Login Button: HANYA MUNCUL DI DESKTOP (md:flex). Pada mobile disembunyikan karena sudah ada di bottom nav */}
          {user && user.role === 'buyer' ? (
            <Link
              to="/profile"
              className="hidden md:flex min-w-0 items-center gap-2 text-sm font-semibold text-[#3A1F16] transition-colors hover:text-[#9B4A2F]"
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

              <span className="hidden sm:inline max-w-[150px] truncate text-sm">
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

          {/* Hamburger Menu: Berada di POJOK PALING KANAN ATAS pada mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#3A1F16] shadow-sm md:hidden hover:bg-[#FDF9F5] focus:outline-none focus:ring-2 focus:ring-[#9B4A2F]/20"
            aria-label={t('nav.open_menu', 'Buka menu navigasi')}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Top-Right Mobile Drawer via Portal directly to body */}
      {isMobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-[9999] md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel Sliding from Right */}
          <div
            className="fixed inset-y-0 right-0 z-[10000] w-[85%] max-w-[340px] bg-[#FAF5EF] shadow-2xl flex flex-col h-full border-l border-[#D0BFAF]"
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.mobile_menu', 'Menu Navigasi')}
          >
            {/* Drawer Header: Logo + Close 'X' */}
            <div className="flex items-center justify-between border-b border-[#EAD8CA] px-5 py-4 bg-white shrink-0">
              <Link
                to={ROUTES.HOME}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2"
              >
                <img
                  src={LOGO_URL}
                  alt="Toti Cakery"
                  className="h-8 w-auto object-contain"
                />
              </Link>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-full text-[#3A1F16] hover:bg-black/5 transition"
                aria-label={t('common.close', 'Tutup menu')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content with Strict Hierarchy */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* HIERARKI 1 (PALING ATAS): Dual Bahasa (Language Switcher) */}
              <div className="rounded-xl bg-white p-3.5 border border-[#EAD8CA]/80 shadow-xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#9B4A2F] mb-2.5">
                  {t('common.language', 'Pilihan Bahasa / Language')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      type="button"
                      onClick={() => handleChangeLanguage(language)}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition ${
                        currentLanguage.code === language.code
                          ? 'bg-[#9B4A2F] text-white shadow-xs'
                          : 'bg-[#FAF5EF] text-[#6B4A3C] hover:bg-[#F3E8DD]'
                      }`}
                    >
                      <span>{language.flag}</span>
                      <span>{language.label === 'ID' ? 'Indonesia' : 'English'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* HIERARKI 2: Tentang Kami (About Us) */}
              <div className="rounded-xl bg-white p-4 border border-[#EAD8CA]/80 shadow-xs">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#9B4A2F] mb-2.5">
                  {t('footer.about_us', 'Tentang Kami')}
                </h4>
                <ul className="space-y-1.5 text-xs text-[#3A1F16]">
                  <li>
                    <a
                      href="/#our-store"
                      onClick={handleOurStoreClick}
                      className="flex items-center justify-between py-1.5 font-medium hover:text-[#9B4A2F] transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Store className="h-4 w-4 text-[#9C8478]" />
                        <span>{t('footer.our_store', 'Toko Kami')}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-[#C4B2A5]" />
                    </a>
                  </li>
                  <li>
                    <Link
                      to={ROUTES.CATALOG}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between py-1.5 font-medium hover:text-[#9B4A2F] transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingBag className="h-4 w-4 text-[#9C8478]" />
                        <span>{t('footer.products', 'Produk')}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-[#C4B2A5]" />
                    </Link>
                  </li>
                </ul>
              </div>

              {/* HIERARKI 3: Bantuan (Help) */}
              <div className="rounded-xl bg-white p-4 border border-[#EAD8CA]/80 shadow-xs">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#9B4A2F] mb-2.5">
                  {t('footer.help', 'Bantuan')}
                </h4>
                <ul className="space-y-1.5 text-xs text-[#3A1F16]">
                  <li>
                    <Link
                      to={ROUTES.BUYER_FAQ}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between py-1.5 font-medium hover:text-[#9B4A2F] transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <HelpCircle className="h-4 w-4 text-[#9C8478]" />
                        <span>{t('footer.faq', 'FAQ / Tanya Jawab')}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-[#C4B2A5]" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={ROUTES.HOW_TO_SHOP}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between py-1.5 font-medium hover:text-[#9B4A2F] transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-[#9C8478]" />
                        <span>{t('footer.how_to_shop', 'Cara Berbelanja')}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-[#C4B2A5]" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={ROUTES.PAYMENT_GUIDE}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between py-1.5 font-medium hover:text-[#9B4A2F] transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-[#9C8478]" />
                        <span>{t('footer.payment_guide', 'Panduan Pembayaran')}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-[#C4B2A5]" />
                    </Link>
                  </li>
                </ul>
              </div>

              {/* HIERARKI 4: Kebijakan (Policies) */}
              <div className="rounded-xl bg-white p-4 border border-[#EAD8CA]/80 shadow-xs">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#9B4A2F] mb-2.5">
                  {t('footer.policies', 'Kebijakan')}
                </h4>
                <ul className="space-y-1.5 text-xs text-[#3A1F16]">
                  <li>
                    <Link
                      to={ROUTES.SHIPPING}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between py-1.5 font-medium hover:text-[#9B4A2F] transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Truck className="h-4 w-4 text-[#9C8478]" />
                        <span>{t('footer.shipping', 'Pengiriman')}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-[#C4B2A5]" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={ROUTES.PRIVACY}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between py-1.5 font-medium hover:text-[#9B4A2F] transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="h-4 w-4 text-[#9C8478]" />
                        <span>{t('footer.privacy', 'Kebijakan Privasi')}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-[#C4B2A5]" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={ROUTES.TERMS}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between py-1.5 font-medium hover:text-[#9B4A2F] transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-[#9C8478]" />
                        <span>{t('footer.terms', 'Syarat & Ketentuan')}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-[#C4B2A5]" />
                    </Link>
                  </li>
                </ul>
              </div>

              {/* HIERARKI 5: Media Sosial (Social Media) */}
              <div className="rounded-xl bg-white p-4 border border-[#EAD8CA]/80 shadow-xs">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#9B4A2F] mb-2.5">
                  {t('footer.social_media', 'Media Sosial')}
                </h4>
                <div className="space-y-2">
                  <a
                    href="https://instagram.com/toti.cakery"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg bg-[#FAF5EF] p-2.5 text-xs text-[#3A1F16] hover:bg-[#F3E8DD] transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={instagramIcon} alt="Instagram" className="h-5 w-5 object-contain" />
                      <span className="font-semibold">@toti.cakery</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-[#9C8478]" />
                  </a>

                  <a
                    href={whatsappUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg bg-[#FAF5EF] p-2.5 text-xs text-[#3A1F16] hover:bg-[#F3E8DD] transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={whatsappIcon} alt="WhatsApp" className="h-5 w-5 object-contain" />
                      <span className="font-semibold">{whatsappNumberDisplay || 'WhatsApp'}</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-[#9C8478]" />
                  </a>
                </div>
              </div>

              {/* Drawer Bottom Copyright */}
              <div className="pt-2 pb-6 text-center text-[10px] text-[#9C8478]">
                COPYRIGHT ©2026 TOTI CAKERY<br />ALL RIGHTS RESERVED
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  )
}