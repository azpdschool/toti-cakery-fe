import { useState } from 'react'
import type React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  Lock,
  User,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES, LOGO_URL } from '@/constants'
import { loginSeller, mapSellerLoginResponseToUser } from '@/api/auth'
import { AuthAnimatedBackdrop } from '@/components/common/AuthAnimatedBackdrop'

export default function SellerLoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const parseAuthError = (err: unknown): string => {
    if (err && typeof err === 'object' && 'response' in err) {
      const e = err as { response?: { data?: { detail?: unknown }, status?: number } }
      const detail = e.response?.data?.detail

      if (typeof detail === 'string') return detail

      if (Array.isArray(detail)) {
        return detail
          .map((item) => item?.msg)
          .filter(Boolean)
          .join(', ')
      }

      if (e.response?.status === 401) {
        return t('auth.error_username_password_wrong')
      }

      if (e.response?.status === 422) {
        return t('auth.error_inactive_account')
      }
    }

    return t('auth.error_generic')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setError(null)
    setSuccess(null)

    if (!username.trim() || !password.trim()) {
      setError(t('auth.error_username_password_required'))
      return
    }

    setIsLoading(true)

    try {
      const response = await loginSeller({
        username: username.trim(),
        password,
      })

      const authUser = mapSellerLoginResponseToUser(response)

      login(response.access_token, authUser)

      setSuccess(t('auth.login_success'))

      setTimeout(() => {
        navigate(ROUTES.SELLER_DASHBOARD, { replace: true })
      }, 500)
    } catch (err) {
      setError(parseAuthError(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-4 py-8">
      <AuthAnimatedBackdrop variant="seller" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl bg-[#FFFFFF]/95 backdrop-blur-sm border border-[#E8DCCB]/80 p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(26,12,8,0.45)] transition-all duration-300 hover:shadow-[0_24px_60px_-15px_rgba(26,12,8,0.58)] hover:border-[#E0A04E]/60">
          <div className="mb-6 text-center">
            <img
              src={LOGO_URL}
              alt={t('app.name')}
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = '/fallback-logo.png'
              }}
              className="mx-auto w-48 sm:w-60 h-auto max-w-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-[#3A1F16]">
            {t('auth.seller_login_title')}
          </h1>
          <p className="mt-1 text-sm text-[#6B4A3C]">
            {t('auth.seller_login_subtitle')}
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-[#3A1F16]"
              >
                {t('auth.username_label')} <span className="text-red-500 ml-0.5">*</span>
              </label>

              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8B6A5A]">
                  <User className="h-4 w-4" />
                </div>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('auth.username_placeholder')}
                  autoComplete="username"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-[#D0BFAF] bg-[#F6EFE6]/50 py-3 pl-11 pr-4 text-sm text-[#3A1F16] outline-none transition-all duration-200 placeholder:text-[#9C8478] hover:border-[#8B6A5A] focus:bg-white focus:border-[#3A1F16] focus:ring-2 focus:ring-[#3A1F16]/15 disabled:opacity-60"
                />
              </div>

              <p className="mt-2 text-xs text-[#8B6A5A]">
                {t('auth.username_helper')}
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[#3A1F16]"
              >
                {t('auth.password_label')} <span className="text-red-500 ml-0.5">*</span>
              </label>

              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8B6A5A]">
                  <Lock className="h-4 w-4" />
                </div>

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password_placeholder')}
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-[#D0BFAF] bg-[#F6EFE6]/50 py-3 pl-11 pr-12 text-sm text-[#3A1F16] outline-none transition-all duration-200 placeholder:text-[#9C8478] hover:border-[#8B6A5A] focus:bg-white focus:border-[#3A1F16] focus:ring-2 focus:ring-[#3A1F16]/15 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B6A5A] hover:text-[#3A1F16] transition-colors"
                  aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#3A1F16] text-sm font-black text-white transition-all duration-200 hover:bg-[#6B4A3C] hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-[#3A1F16] disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.processing')}
                </>
              ) : (
                t('auth.login')
              )}
            </button>

            <div className="text-center text-sm text-[#6B4A3C]">
              <Link
                to={ROUTES.AUTH_SELLER_FORGOT_PASSWORD}
                className="font-medium text-[#9B4A2F] hover:text-[#7E3A24] hover:underline transition-colors duration-200"
              >
                {t('auth.forgot_password')}
              </Link>
            </div>
          </form>
        </div>

        <div className="relative z-10 mt-6 text-center text-xs text-[#F6EFE6]/90 transition-colors">
          <p>{t('auth.management_only')}</p>
        </div>
      </div>
    </div>
  )
}
