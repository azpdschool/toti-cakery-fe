import { useState } from 'react'
import type React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
} from '@/api/auth'

type ResetStep = 'input' | 'otp' | 'reset'

function parseApiError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as { response?: { data?: { detail?: unknown }, status?: number } }
    const detail = err.response?.data?.detail

    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((item) => item?.msg).filter(Boolean).join(', ')
    }
    if (err.response?.status === 404) return 'Akun buyer tidak ditemukan'
    if (err.response?.status === 400) return 'OTP atau data tidak valid'
  }
  return fallback
}

export default function BuyerForgotPasswordPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [step, setStep] = useState<ResetStep>('input')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const resetMessage = () => {
    setError(null)
    setSuccess(null)
  }

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()

    if (!email.trim()) {
      setError(t('auth.email_required', 'Email wajib diisi'))
      return
    }

    setIsLoading(true)
    try {
      await requestBuyerForgotPassword(email.trim())
      setSuccess(t('auth.otp_sent', 'OTP berhasil dikirim ke email Anda. Periksa kotak masuk atau spam.'))
      setStep('otp')
    } catch (err) {
      setError(parseApiError(err, 'Gagal mengirim OTP ke email.'))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()

    if (otpCode.length !== 6) {
      setError(t('auth.error_otp_length', 'OTP harus 6 digit'))
      return
    }

    if (newPassword.length < 6) {
      setError(t('auth.error_password_length', 'Password minimal 6 karakter'))
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.error_password_match', 'Password tidak cocok'))
      return
    }

    setIsLoading(true)
    try {
      await resetBuyerPasswordEmail({
        email: email.trim(),
        otp: otpCode,
        new_password: newPassword,
      })

      setSuccess(t('auth.reset_success', 'Password berhasil diubah. Mengalihkan...'))
      setTimeout(() => navigate(ROUTES.AUTH_BUYER, { replace: true }), 2000)
    } catch (err) {
      setError(parseApiError(err, t('auth.error_generic', 'Gagal reset password')))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fffaf5] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm sm:p-8">
        <div className="relative mb-6 text-center flex flex-col items-center">
          <button
            onClick={() => {
              if (step === 'input') {
                navigate(ROUTES.AUTH_BUYER)
              } else {
                setStep('input')
                setOtpCode('')
                setNewPassword('')
                setConfirmPassword('')
                resetMessage()
              }
            }}
            className="absolute left-0 top-0 flex items-center text-sm font-bold text-[#8b7166] hover:text-[#d85b30] transition"
          >
            <ChevronLeft className="mr-1 h-5 w-5" />
            {t('auth.cancel', 'Batal')}
          </button>

          <Link to={ROUTES.HOME} className="inline-block mt-8 mb-6">
            <img src={LOGO_URL} alt="Toti Cakery" className="mx-auto w-48 sm:w-60 h-auto max-w-full object-contain" />
          </Link>
          <h1 className="text-2xl font-black text-[#4b2417]">{t('auth.buyer_forgot_title', 'Lupa Password')}</h1>
          <p className="mt-1 text-sm text-[#6f5448]">
            {step === 'input' 
              ? t('auth.buyer_forgot_subtitle', 'Masukkan email akun Anda untuk mendapatkan kode OTP reset password.') 
              : 'Masukkan kode OTP dan password baru Anda.'}
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

        {step === 'input' && (
          <form onSubmit={handleSendEmailOtp} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.email_placeholder', 'Email')}
                className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white hover:bg-[#c04e28] disabled:opacity-60 transition"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.send_otp', 'Kirim OTP')}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#4b2417] mb-1.5">
                Kode OTP (6 digit)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 px-4 py-3 text-center text-xl font-bold text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4b2417] mb-1.5">
                Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('auth.new_password', 'Password Baru')}
                  className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-12 text-sm outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4b2417] mb-1.5">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirm_password_placeholder', 'Konfirmasi Password')}
                  className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-12 text-sm outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166]"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white hover:bg-[#c04e28] disabled:opacity-60 transition"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.reset_btn', 'Ubah Password')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
