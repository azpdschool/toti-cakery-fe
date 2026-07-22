// src/pages/auth/SellerForgotPasswordPage.tsx
import { useState } from 'react'
import type React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { ROUTES } from '@/constants'
import {
  requestSellerForgotPassword,
  resetSellerPassword,
  verifySellerForgotPasswordOtp,
} from '@/api/auth'

type ForgotStep = 'email' | 'otp' | 'reset'

function parseApiError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as any
    const detail = err.response?.data?.detail

    if (typeof detail === 'string') return detail

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item?.msg)
        .filter(Boolean)
        .join(', ')
    }
  }

  return fallback
}

export default function SellerForgotPasswordPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState<ForgotStep>('email')
  const [email, setEmail] = useState('')
  const [otpId, setOtpId] = useState('')
  const [verifyToken, setVerifyToken] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    setError(null)
    setSuccess(null)

    if (!email.trim()) {
      setError('Email atau username wajib diisi')
      return
    }

    setIsLoading(true)

    try {
      const response = await requestSellerForgotPassword({
        email: email.trim(),
      })

      setOtpId(response.otp_id)
      setSuccess(
        `Kode OTP telah dikirim. Untuk development gunakan kode dummy: 7777`,
      )
      setStep('otp')
    } catch (err) {
      setError(
        parseApiError(
          err,
          'Gagal mengirim OTP. Pastikan email/username terdaftar.',
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    setError(null)
    setSuccess(null)

    if (!otp.trim()) {
      setError('Masukkan kode OTP')
      return
    }

    if (!otpId) {
      setError('OTP ID tidak ditemukan. Silakan kirim ulang OTP.')
      setStep('email')
      return
    }

    setIsLoading(true)

    try {
      const response = await verifySellerForgotPasswordOtp({
        otp_id: otpId,
        code: otp.trim(),
      })

      setVerifyToken(response.verify_token)
      setSuccess('OTP berhasil diverifikasi. Silakan buat password baru.')
      setStep('reset')
    } catch (err) {
      setError(parseApiError(err, 'Kode OTP salah atau sudah expired.'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    setError(null)
    setSuccess(null)

    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Password dan konfirmasi tidak cocok')
      return
    }

    if (!verifyToken) {
      setError('Token verifikasi tidak ditemukan. Silakan ulangi proses.')
      setStep('email')
      return
    }

    setIsLoading(true)

    try {
      await resetSellerPassword({
        verify_token: verifyToken,
        new_password: newPassword,
      })

      setSuccess('Password berhasil direset! Silakan login.')

      setTimeout(() => {
        navigate(ROUTES.AUTH_SELLER, { replace: true })
      }, 1200)
    } catch (err) {
      setError(parseApiError(err, 'Gagal mereset password. Silakan coba lagi.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fdf6f0] to-[#f4ebdf] px-4 py-8">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate(ROUTES.AUTH_SELLER)}
          className="mb-6 flex items-center gap-1 text-sm font-medium text-[#6f5448] transition hover:text-[#4b2417]"
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali ke Login
        </button>

        <div className="rounded-2xl border border-[#ead8ca] bg-white/90 p-8 shadow-xl backdrop-blur-sm">
          <h1 className="text-2xl font-black text-[#4b2417]">
            Lupa Password
          </h1>

          <p className="mt-1 text-sm text-[#6f5448]">
            {step === 'email' && 'Masukkan email atau username seller Anda'}
            {step === 'otp' && 'Masukkan kode OTP yang dikirim'}
            {step === 'reset' && 'Buat password baru untuk akun Anda'}
          </p>

          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-[#4b2417]"
                >
                  Email / Username
                </label>

                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7166]">
                    <Mail className="h-4 w-4" />
                  </div>

                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contoh: owner / admin / staff"
                    className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-3 pl-11 pr-4 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                  />
                </div>

                <p className="mt-2 text-xs text-[#8b7166]">
                  Catatan: backend saat ini mencari seller berdasarkan username.
                  Jika nanti kolom email sudah aktif, field ini tetap bisa dipakai untuk email.
                </p>
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
                    Mengirim OTP...
                  </>
                ) : (
                  'Kirim OTP'
                )}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-semibold text-[#4b2417]"
                >
                  Kode OTP
                </label>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Masukkan kode OTP"
                  autoFocus
                  className="mt-1.5 w-full rounded-xl border border-[#d0bfaf] bg-white/70 px-4 py-3 text-center text-xl font-bold text-[#4b2417] outline-none transition placeholder:text-sm placeholder:font-normal placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                />

                <p className="mt-2 text-xs text-[#8b7166]">
                  Untuk development, gunakan kode dummy{' '}
                  <span className="font-mono font-bold">7777</span>.
                </p>
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
                    Memverifikasi...
                  </>
                ) : (
                  'Verifikasi OTP'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setOtp('')
                    setOtpId('')
                    setStep('email')
                  }}
                  className="text-sm font-medium text-[#d85b30] transition hover:text-[#c04e28]"
                >
                  Kirim ulang OTP
                </button>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-semibold text-[#4b2417]"
                >
                  Password Baru
                </label>

                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7166]">
                    <Lock className="h-4 w-4" />
                  </div>

                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-3 pl-11 pr-12 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166] hover:text-[#4b2417]"
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
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-semibold text-[#4b2417]"
                >
                  Konfirmasi Password
                </label>

                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7166]">
                    <Lock className="h-4 w-4" />
                  </div>

                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-3 pl-11 pr-12 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                  />
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
                    Mereset Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
