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
import { ROUTES, LOGO_URL } from '@/constants'
import {
  requestSellerForgotPassword,
  resetSellerPassword,
  verifySellerForgotPasswordOtp,
} from '@/api/auth'
import { AuthAnimatedBackdrop } from '@/components/common/AuthAnimatedBackdrop'

type ForgotStep = 'email' | 'otp' | 'reset'

function parseApiError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as { response?: { data?: { detail?: unknown } } }
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    setError(null)
    setSuccess(null)

    if (!email.trim()) {
      setError('Email or username is required')
      return
    }

    setIsLoading(true)

    try {
      const response = await requestSellerForgotPassword({
        email: email.trim(),
      })

      setOtpId(response.otp_id)
      setSuccess('OTP code has been sent.')
      setStep('otp')
    } catch (err) {
      setError(
        parseApiError(
          err,
          'Failed to send OTP. Ensure email/username is registered.',
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
      setError('Please enter OTP code')
      return
    }

    if (!otpId) {
      setError('OTP ID not found. Please resend OTP.')
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
      setSuccess('OTP successfully verified. Please create a new password.')
      setStep('reset')
    } catch (err) {
      setError(parseApiError(err, 'Invalid or expired OTP code.'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    setError(null)
    setSuccess(null)

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Password and confirmation do not match')
      return
    }

    if (!verifyToken) {
      setError('Verification token not found. Please restart the process.')
      setStep('email')
      return
    }

    setIsLoading(true)

    try {
      await resetSellerPassword({
        verify_token: verifyToken,
        new_password: newPassword,
      })

      setSuccess('Password reset successfully! Please log in.')

      setTimeout(() => {
        navigate(ROUTES.AUTH_SELLER, { replace: true })
      }, 1200)
    } catch (err) {
      setError(parseApiError(err, 'Failed to reset password. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-4 py-8">
      <AuthAnimatedBackdrop variant="seller" />

      <div className="relative z-10 w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate(ROUTES.AUTH_SELLER)}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-[#F6EFE6]/90 transition-colors duration-200 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Login
        </button>

        <div className="rounded-2xl bg-[#FFFFFF]/95 backdrop-blur-sm border border-[#E8DCCB]/80 p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(26,12,8,0.45)] transition-all duration-300 hover:shadow-[0_24px_60px_-15px_rgba(26,12,8,0.58)] hover:border-[#E0A04E]/60">
          <div className="mb-6 text-center">
            <img
              src={LOGO_URL}
              alt="Toti Cakery"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = '/fallback-logo.png'
              }}
              className="mx-auto w-48 sm:w-60 h-auto max-w-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-[#3A1F16] text-center">
            Forgot Password
          </h1>

          <p className="mt-1 text-sm text-[#6B4A3C] text-center">
            {step === 'email' && 'Enter your seller username'}
            {step === 'otp' && 'Enter the OTP sent to your email'}
            {step === 'reset' && 'Create a new password for your account'}
          </p>

          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-[#3A1F16]"
                >
                  Username / Email <span className="text-red-500 ml-0.5">*</span>
                </label>

                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8B6A5A]">
                    <Mail className="h-4 w-4" />
                  </div>

                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., owner / admin / staff"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-[#D0BFAF] bg-[#F6EFE6]/50 py-3 pl-11 pr-4 text-sm text-[#3A1F16] outline-none transition-all duration-200 placeholder:text-[#9C8478] hover:border-[#8B6A5A] focus:bg-white focus:border-[#3A1F16] focus:ring-2 focus:ring-[#3A1F16]/15 disabled:opacity-60"
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
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#3A1F16] text-sm font-black text-white transition-all duration-200 hover:bg-[#6B4A3C] hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-[#3A1F16] disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-semibold text-[#3A1F16]"
                >
                  OTP Code <span className="text-red-500 ml-0.5">*</span>
                </label>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter OTP code"
                  autoFocus
                  disabled={isLoading}
                  className="mt-1.5 w-full rounded-xl border border-[#D0BFAF] bg-[#F6EFE6]/50 px-4 py-3 text-center text-xl font-bold text-[#3A1F16] outline-none transition-all duration-200 placeholder:text-sm placeholder:font-normal placeholder:text-[#9C8478] hover:border-[#8B6A5A] focus:bg-white focus:border-[#3A1F16] focus:ring-2 focus:ring-[#3A1F16]/15 disabled:opacity-60"
                />
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
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
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
                  className="text-sm font-semibold text-[#9B4A2F] transition-colors duration-200 hover:text-[#7E3A24] hover:underline"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} noValidate className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-semibold text-[#3A1F16]"
                >
                  New Password <span className="text-red-500 ml-0.5">*</span>
                </label>

                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8B6A5A]">
                    <Lock className="h-4 w-4" />
                  </div>

                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-[#D0BFAF] bg-[#F6EFE6]/50 py-3 pl-11 pr-12 text-sm text-[#3A1F16] outline-none transition-all duration-200 placeholder:text-[#9C8478] hover:border-[#8B6A5A] focus:bg-white focus:border-[#3A1F16] focus:ring-2 focus:ring-[#3A1F16]/15 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B6A5A] hover:text-[#3A1F16] transition-colors"
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
                  className="block text-sm font-semibold text-[#3A1F16]"
                >
                  Confirm Password <span className="text-red-500 ml-0.5">*</span>
                </label>

                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8B6A5A]">
                    <Lock className="h-4 w-4" />
                  </div>

                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-[#D0BFAF] bg-[#F6EFE6]/50 py-3 pl-11 pr-12 text-sm text-[#3A1F16] outline-none transition-all duration-200 placeholder:text-[#9C8478] hover:border-[#8B6A5A] focus:bg-white focus:border-[#3A1F16] focus:ring-2 focus:ring-[#3A1F16]/15 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B6A5A] hover:text-[#3A1F16] transition-colors"
                  >
                    {showConfirmPassword ? (
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
                    Resetting Password...
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
