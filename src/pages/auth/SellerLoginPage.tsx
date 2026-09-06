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
import { ROUTES } from '@/constants'
import { loginSeller, mapSellerLoginResponseToUser } from '@/api/auth'

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fdf6f0] to-[#f4ebdf] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src="/src/assets/logo.png"
            alt={t('app.name')}
            className="mx-auto h-12 w-auto object-contain"
          />
          <p className="mt-1 text-sm text-[#6f5448]">
            {t('auth.seller_login')}
          </p>
        </div>

        <div className="rounded-2xl border border-[#ead8ca] bg-white/90 p-8 shadow-xl backdrop-blur-sm">
          <h1 className="text-2xl font-black text-[#4b2417]">
            {t('auth.seller_login_title')}
          </h1>
          <p className="mt-1 text-sm text-[#6f5448]">
            {t('auth.seller_login_subtitle')}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-[#4b2417]"
              >
                {t('auth.username_label')}
              </label>

              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7166]">
                  <User className="h-4 w-4" />
                </div>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('auth.username_placeholder')}
                  autoComplete="username"
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-3 pl-11 pr-4 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                />
              </div>

              <p className="mt-2 text-xs text-[#8b7166]">
                {t('auth.username_helper')}
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[#4b2417]"
              >
                {t('auth.password_label')}
              </label>

              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7166]">
                  <Lock className="h-4 w-4" />
                </div>

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password_placeholder')}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-3 pl-11 pr-12 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166] hover:text-[#4b2417]"
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
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white transition hover:bg-[#c04e28] disabled:opacity-60"
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

            <div className="text-center text-sm text-[#6f5448]">
              <Link
                to={ROUTES.AUTH_SELLER_FORGOT_PASSWORD}
                className="font-medium text-[#d85b30] transition hover:text-[#c04e28]"
              >
                {t('auth.forgot_password')}
              </Link>
            </div>

            <div className="text-center text-sm text-[#6f5448]">
              <Link
                to={ROUTES.HOME}
                className="font-medium text-[#6f5448] transition hover:text-[#4b2417]"
              >
                {t('auth.back_to_home')}
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-[#8b7166]">
          <p>{t('auth.management_only')}</p>
        </div>
      </div>
    </div>
  )
}
