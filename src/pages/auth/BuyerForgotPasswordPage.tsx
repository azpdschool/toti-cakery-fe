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
} from 'lucide-react'
import { ROUTES, LOGO_URL } from '@/constants'
import { resetBuyerPasswordEmail } from '@/api/auth'
import { LanguageToggle } from '@/components/common/Languagetoggle'

function parseApiError(error: unknown, fallback: string, t: any): string {
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
            count: remainingMatch[1],
            defaultValue: `Kode OTP salah. Sisa percobaan: ${remainingMatch[1]}.`,
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

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState<string>(() => {
    try {
      const searchEmail = new URLSearchParams(window.location.search).get('email')
      return (
        searchEmail ||
        sessionStorage.getItem('buyer_reset_email') ||
        localStorage.getItem('buyer_reset_email') ||
        localStorage.getItem('buyer_email') ||
        ''
      )
    } catch {
      return ''
    }
  })
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const stateEmail = (location.state as { email?: string })?.email
    const queryEmail = searchParams.get('email')
    const finalEmail = queryEmail || stateEmail
    if (finalEmail) {
      setEmail(finalEmail)
      try {
        sessionStorage.setItem('buyer_reset_email', finalEmail)
      } catch {
        // ignore storage errors
      }
    }
  }, [location.state, searchParams])

  const resetMessage = () => {
    setError(null)
    setSuccess(null)
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()

    if (!otpCode || otpCode.trim().length !== 6) {
      const msg = t('auth.error_otp_length', 'Kode OTP harus 6 digit')
      setError(msg)
      toast.error(msg)
      return
    }

    setStep(2)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()

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
        otp: otpCode.trim(),
        new_password: newPassword,
      })

      const successMsg = t('auth.reset_success', 'Password berhasil diubah. Mengalihkan...')
      setSuccess(successMsg)
      toast.success(successMsg)
      setTimeout(() => navigate(ROUTES.AUTH_BUYER, { replace: true }), 2000)
    } catch (err) {
      const parsedError = parseApiError(err, t('auth.error_generic', 'Gagal reset password'), t)
      setError(parsedError)
      toast.error(parsedError)
      setStep(1)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fffaf5] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm sm:p-8">
        <div className="relative mb-6 text-center flex flex-col items-center">
          <button
            type="button"
            onClick={() => {
              if (step === 1) {
                navigate(ROUTES.AUTH_BUYER)
              } else {
                setStep(1)
                resetMessage()
              }
            }}
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
            {step === 1
              ? t(
                  'auth.buyer_forgot_step1_subtitle',
                  'Masukkan kode OTP 6 digit yang telah dikirimkan ke email Anda.',
                )
              : t(
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

        {success && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleNextStep} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#4b2417] mb-1.5">
                {t('auth.otp_label', 'Kode OTP (6 digit)')}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, ''))
                  if (error) setError(null)
                }}
                placeholder="000000"
                className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 px-4 py-3 text-center text-xl font-bold tracking-widest text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white hover:bg-[#c04e28] transition"
            >
              {t('common.next', 'Lanjut')}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#4b2417] mb-1.5">
                {t('auth.new_password', 'Password Baru')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (error) setError(null)
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
                {t('auth.confirm_password', 'Konfirmasi Password Baru')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (error) setError(null)
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
                  resetMessage()
                  setStep(1)
                }}
                className="flex h-12 w-full items-center justify-center rounded-xl border border-[#d0bfaf] bg-transparent text-sm font-bold text-[#4b2417] hover:bg-[#fbf4ee] disabled:opacity-60 transition"
              >
                {t('common.back', 'Kembali')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
