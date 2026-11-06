import { useState, useEffect } from 'react'
import type React from 'react'
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react'
import { ROUTES, LOGO_URL } from '@/constants'
import {
  requestBuyerForgotPassword,
  resetBuyerPasswordEmail,
  verifyBuyerResetOtp,
} from '@/api/auth'
import { LanguageToggle } from '@/components/common/Languagetoggle'

import type { TFunction } from 'i18next'

function maskEmail(val: string): string {
  if (!val || !val.includes('@')) return val
  const [name, domain] = val.split('@')
  if (!domain) return val
  if (name.length <= 1) return `*@${domain}`
  if (name.length === 2) return `${name[0]}*@${domain}`
  const first = name[0]
  const last = name[name.length - 1]
  const asterisks = '*'.repeat(Math.min(4, Math.max(2, name.length - 2)))
  return `${first}${asterisks}${last}@${domain}`
}

function parseApiError(
  error: unknown,
  fallback: string,
  t: TFunction,
): string {
  if (error && typeof error === 'object') {
    const axiosErr = error as {
      code?: string
      message?: string
      response?: { data?: { detail?: unknown }; status?: number }
    }

    if (
      axiosErr.code === 'ERR_NETWORK' ||
      (!axiosErr.response && axiosErr.message?.toLowerCase().includes('network'))
    ) {
      return t(
        'auth.network_error',
        'Terjadi kesalahan jaringan. Silakan periksa koneksi internet Anda.',
      )
    }

    if (axiosErr.response) {
      const detail = axiosErr.response.data?.detail
      const status = axiosErr.response.status

      if (typeof detail === 'string') {
        const lower = detail.toLowerCase()
        if (lower.includes('kedaluwarsa') || lower.includes('expired')) {
          return t(
            'auth.otp_expired',
            'Kode OTP telah kedaluwarsa. Silakan minta kode baru.',
          )
        }
        if (
          lower.includes('batas percobaan') ||
          lower.includes('too many') ||
          status === 429
        ) {
          return t(
            'auth.otp_max_attempts',
            'Batas percobaan verifikasi OTP tercapai (maksimal 5 kali). Silakan minta kode baru.',
          )
        }
        const remainingMatch = detail.match(/sisa percobaan:\s*(\d+)/i)
        if (remainingMatch) {
          return t('auth.otp_wrong_with_remaining', {
            count: Number(remainingMatch[1]),
          })
        }
        if (
          lower.includes('salah') ||
          lower.includes('tidak valid') ||
          lower.includes('invalid') ||
          lower.includes('not valid')
        ) {
          return t('auth.invalid_otp', 'Kode OTP tidak valid atau salah.')
        }
        if (
          lower.includes('tidak ditemukan') ||
          lower.includes('not found') ||
          status === 404
        ) {
          return t('auth.buyer_not_found', 'Akun pembeli tidak ditemukan.')
        }
        if (
          lower.includes('password') &&
          (lower.includes('minimal') ||
            lower.includes('character') ||
            lower.includes('karakter'))
        ) {
          return t(
            'auth.error_password_length',
            'Password minimal 8 karakter.',
          )
        }
        return detail
      }

      if (Array.isArray(detail)) {
        for (const item of detail) {
          const loc = Array.isArray(item?.loc) ? item.loc.join(' ') : ''
          if (loc.includes('otp')) {
            return t('auth.error_otp_length', 'Kode OTP harus 6 digit.')
          }
          if (loc.includes('new_password') || loc.includes('password')) {
            return t(
              'auth.error_password_length',
              'Password minimal 8 karakter.',
            )
          }
          if (loc.includes('email')) {
            return t('auth.invalid_email', 'Format email tidak valid.')
          }
        }
        const msgs = detail
          .map((item) => item?.msg)
          .filter(Boolean)
          .join(', ')
        if (msgs) return msgs
      }

      if (status === 404)
        return t('auth.buyer_not_found', 'Akun pembeli tidak ditemukan.')
      if (status === 429)
        return t(
          'auth.too_many_attempts',
          'Terlalu banyak percobaan verifikasi. Silakan tunggu beberapa saat.',
        )
      if (status === 400)
        return t('auth.invalid_otp', 'Kode OTP tidak valid atau salah.')
      if (status && status >= 500)
        return t(
          'auth.server_error',
          'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
        )
    }

    if (axiosErr.message && !axiosErr.response) {
      return t(
        'auth.network_error',
        'Terjadi kesalahan jaringan. Silakan periksa koneksi internet Anda.',
      )
    }
  }

  return fallback || t('auth.error_generic', 'Terjadi kesalahan. Silakan coba lagi.')
}

export default function BuyerForgotPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [successKey, setSuccessKey] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Pre-fill email from search query, location state, or storage. Auto-advance ONLY if otpSent flag is present.
  useEffect(() => {
    const state = location.state as { email?: string; otpSent?: boolean } | null
    const queryEmail = searchParams.get('email')
    const stateEmail = state?.email
    const storedEmail =
      sessionStorage.getItem('buyer_reset_email') ||
      localStorage.getItem('buyer_reset_email') ||
      localStorage.getItem('buyer_email') ||
      ''

    const initialEmail = queryEmail || stateEmail || storedEmail
    if (initialEmail) {
      setEmail(initialEmail)
    }

    const isOtpSent =
      searchParams.get('otpSent') === 'true' || state?.otpSent === true

    if (initialEmail && isOtpSent) {
      setStep(2)
      setSuccessKey('auth.otp_sent')
    }
  }, [location.state, searchParams])

  // Resend cooldown timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const clearMessages = () => {
    setError('')
    setSuccessKey(null)
  }

  // STEP 1: Submit email to request OTP
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()

    const trimmedEmail = email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!trimmedEmail) {
      const msg = t('auth.email_required', 'Email wajib diisi')
      setError(msg)
      return
    }

    if (!emailRegex.test(trimmedEmail)) {
      const msg = t('auth.invalid_email', 'Format email tidak valid')
      setError(msg)
      return
    }

    setIsLoading(true)
    try {
      await requestBuyerForgotPassword(trimmedEmail)
      try {
        sessionStorage.setItem('buyer_reset_email', trimmedEmail)
      } catch {
        // ignore storage errors
      }
      setResendCooldown(60)
      setSuccessKey('auth.otp_sent')
      toast.success(t('auth.otp_sent'))
      setStep(2)
    } catch (err) {
      const parsed = parseApiError(
        err,
        t('auth.send_otp_failed', 'Gagal mengirim kode OTP ke email.'),
        t,
      )
      setError(parsed)
      toast.error(parsed)
    } finally {
      setIsLoading(false)
    }
  }

  // STEP 2: Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setStep(1)
      return
    }

    setIsResending(true)
    clearMessages()
    try {
      await requestBuyerForgotPassword(trimmedEmail)
      setResendCooldown(60)
      setSuccessKey('auth.otp_sent')
      toast.success(t('auth.otp_sent'))
    } catch (err) {
      const parsed = parseApiError(
        err,
        t('auth.send_otp_failed', 'Gagal mengirim ulang kode OTP.'),
        t,
      )
      setError(parsed)
      toast.error(parsed)
    } finally {
      setIsResending(false)
    }
  }

  // STEP 2: Submit & verify OTP code against backend before advancing to Step 3
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()

    const trimmedOtp = otp.trim()
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      const msg = t('auth.error_otp_length', 'Kode OTP harus 6 digit')
      setError(msg)
      toast.error(msg)
      return
    }

    setIsLoading(true)
    try {
      await verifyBuyerResetOtp({
        email: email.trim(),
        otp: trimmedOtp,
      })
      clearMessages()
      setStep(3)
    } catch (err) {
      const parsed = parseApiError(
        err,
        t('auth.invalid_otp', 'Kode OTP tidak valid atau salah.'),
        t,
      )
      setError(parsed)
      toast.error(parsed)
      // Stay on Step 2!
    } finally {
      setIsLoading(false)
    }
  }

  // STEP 3: Submit reset password & immediately redirect to buyer login
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()

    if (!newPassword || newPassword.length < 8) {
      const msg = t('auth.error_password_length', 'Password minimal 8 karakter')
      setError(msg)
      toast.error(msg)
      return
    }

    if (newPassword !== confirmPassword) {
      const msg = t('auth.error_password_match', 'Konfirmasi password tidak cocok')
      setError(msg)
      toast.error(msg)
      return
    }

    setIsLoading(true)
    try {
      await resetBuyerPasswordEmail({
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      })

      const successToastMsg = t(
        'auth.reset_success',
        'Password berhasil diubah. Silakan login.',
      )
      toast.success(successToastMsg)
      try {
        sessionStorage.removeItem('buyer_reset_email')
      } catch {
        // ignore storage errors
      }
      navigate(ROUTES.AUTH_BUYER, { replace: true })
    } catch (err) {
      const parsedError = parseApiError(
        err,
        t('auth.error_generic', 'Gagal reset password'),
        t,
      )
      setError(parsedError)
      toast.error(parsedError)

      // Safety Fallback: If Step 3 ever receives an OTP-related error (e.g. OTP expired while typing password),
      // automatically return to setStep(2) so OTP errors are always handled on the OTP screen.
      const lower = parsedError.toLowerCase()
      if (
        lower.includes('otp') ||
        lower.includes('kedaluwarsa') ||
        lower.includes('expired') ||
        lower.includes('percobaan') ||
        lower.includes('attempt')
      ) {
        setStep(2)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle header cancel / back button
  const handleBack = () => {
    clearMessages()
    if (step === 1) {
      navigate(ROUTES.AUTH_BUYER)
    } else if (step === 2) {
      setStep(1)
    } else {
      setStep(2)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fffaf5] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm sm:p-8">
        <div className="relative mb-6 text-center flex flex-col items-center">
          <button
            type="button"
            onClick={handleBack}
            className="absolute left-0 top-0 flex items-center text-sm font-bold text-[#8b7166] hover:text-[#d85b30] transition"
          >
            <ChevronLeft className="mr-1 h-5 w-5" />
            {t('auth.cancel', 'Batal')}
          </button>

          <div className="absolute right-0 top-0">
            <LanguageToggle />
          </div>

          <Link to={ROUTES.HOME} className="inline-block mt-8 mb-6">
            <img
              src={LOGO_URL}
              alt="Toti Cakery"
              className="mx-auto w-48 sm:w-60 h-auto max-w-full object-contain"
            />
          </Link>
          <h1 className="text-2xl font-black text-[#4b2417]">
            {t('auth.buyer_forgot_title', 'Lupa Password')}
          </h1>
          <p className="mt-1 text-sm text-[#6f5448]">
            {step === 1 &&
              t(
                'auth.buyer_forgot_step1_email_subtitle',
                'Masukkan email Anda untuk menerima kode OTP verifikasi.',
              )}
            {step === 2 &&
              t(
                'auth.buyer_forgot_step1_subtitle',
                'Masukkan kode OTP 6 digit yang telah dikirimkan ke email Anda.',
              )}
            {step === 3 &&
              t(
                'auth.buyer_forgot_step2_subtitle',
                'Masukkan dan konfirmasi password baru Anda.',
              )}
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {successKey && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <p>{t(successKey)}</p>
          </div>
        )}

        {/* STEP 1: Email Input */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#4b2417] mb-1.5">
                {t('auth.method_email', 'Email')} <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder={t('auth.email_placeholder', 'email@domain.com')}
                  className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white hover:bg-[#c04e28] disabled:opacity-60 transition"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('common.next', 'Lanjut')
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Input & Verification */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit} noValidate className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-[#fbf4ee] px-4 py-3 text-xs text-[#6f5448]">
              <span>
                {t('auth.otp_sent_to', 'Kode dikirim ke')}{' '}
                <strong className="text-[#4b2417]">{maskEmail(email)}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  clearMessages()
                  setStep(1)
                }}
                className="font-bold text-[#d85b30] hover:underline"
              >
                {t('auth.change_email', 'Ganti email')}
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4b2417] mb-1.5">
                {t('auth.otp_label', 'Kode OTP (6 digit)')} <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''))
                  if (error) setError('')
                }}
                placeholder="000000"
                className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 px-4 py-3 text-center text-xl font-bold tracking-widest text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                autoFocus
              />
            </div>

            <div className="text-center text-xs text-[#6f5448]">
              {resendCooldown > 0 ? (
                <span className="text-[#8b7166]">
                  {t('auth.resend_in', 'Kirim ulang dalam')}{' '}
                  <span className="font-bold text-[#d85b30]">
                    {resendCooldown}s
                  </span>
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isResending}
                  onClick={handleResendOtp}
                  className="font-bold text-[#d85b30] hover:underline disabled:opacity-50"
                >
                  {isResending ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t('auth.sending', 'Mengirim...')}
                    </span>
                  ) : (
                    t('auth.resend_otp', 'Kirim Ulang Kode OTP')
                  )}
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white hover:bg-[#c04e28] disabled:opacity-60 transition"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('common.next', 'Lanjut')
              )}
            </button>
          </form>
        )}

        {/* STEP 3: New Password Input */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#4b2417] mb-1.5">
                {t('auth.new_password', 'Password Baru')} <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder={t('auth.new_password', 'Password Baru')}
                  className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-12 text-sm outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4b2417] mb-1.5">
                {t('auth.confirm_password', 'Konfirmasi Password Baru')} <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder={t(
                    'auth.confirm_password_placeholder',
                    'Konfirmasi Password',
                  )}
                  className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-12 text-sm outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166]"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white hover:bg-[#c04e28] disabled:opacity-60 transition"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('auth.reset_btn', 'Ubah Password')
                )}
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  clearMessages()
                  setStep(2)
                }}
                className="flex h-12 w-full items-center justify-center rounded-xl border border-[#d0bfaf] bg-transparent text-sm font-bold text-[#4b2417] hover:bg-[#fbf4ee] disabled:opacity-60 transition"
              >
                {t('auth.back_to_otp', 'Kembali ke Input OTP')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
