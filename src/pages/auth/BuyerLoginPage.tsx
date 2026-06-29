// src/pages/auth/BuyerLoginPage.tsx

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Eye,
  EyeOff,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  MessageCircle,
  Mail,
  User,
  Lock,
  Phone,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
// Hapus ROUTES karena tidak digunakan
import { getBuyerByEmail, getBuyerByPhone, addBuyer } from '@/services/buyerService'

type AuthMode = 'login' | 'register' | 'otp-verify'

interface LoginFormData {
  identifier: string
  password: string
  rememberMe: boolean
}

interface RegisterFormData {
  name: string
  phone: string
  email: string
  password: string
  confirmPassword: string
  agreeTerms: boolean
}

interface OtpFormData {
  code: string
}

export default function BuyerLoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<AuthMode>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [loginData, setLoginData] = useState<LoginFormData>({
    identifier: '',
    password: '',
    rememberMe: false,
  })
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  const [registerData, setRegisterData] = useState<RegisterFormData>({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  })
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false)

  const [otpData, setOtpData] = useState<OtpFormData>({ code: '' })
  const [otpTimer, setOtpTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [otpPhone, setOtpPhone] = useState('')
  const [otpName, setOtpName] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null) // Perbaiki tipe
  const [otpFlow, setOtpFlow] = useState<'login' | 'register'>('register')

  const DUMMY_OTP = '7777'

  useEffect(() => {
    setError(null)
    setSuccess(null)
  }, [mode])

  useEffect(() => {
    if (mode === 'otp-verify' && otpTimer > 0) {
      timerRef.current = setTimeout(() => {
        setOtpTimer((prev) => prev - 1)
      }, 1000)
    } else if (otpTimer === 0) {
      setCanResend(true)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [mode, otpTimer])

  // ============================================================
  // HANDLERS - LOGIN
  // ============================================================

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!loginData.identifier.trim()) {
      setError('Email wajib diisi')
      return
    }
    if (!loginData.password) {
      setError('Password wajib diisi')
      return
    }

    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const user = await getBuyerByEmail(loginData.identifier)
      if (!user || user.password !== loginData.password) {
        setError('Email atau password salah')
        setIsLoading(false)
        return
      }

      const authUser = {
        id: user.id,
        name: user.name,
        role: 'buyer' as const,
        phone: user.phone,
        email: user.email,
      }
      login('mock-token-123', authUser)
      setSuccess('Login berhasil!')
      setTimeout(() => navigate('/'), 500)
    } catch (err) {
      setError('Login gagal. Periksa kembali email dan password Anda.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginWithOtp = async () => {
    setError(null)
    setSuccess(null)

    const identifier = loginData.identifier.trim()
    if (!identifier) {
      setError('Masukkan nomor WhatsApp untuk menerima OTP')
      return
    }

    const isPhone = /^[0-9+\-\s()]{8,15}$/.test(identifier.replace(/\s/g, ''))
    if (!isPhone) {
      setError('Masukkan nomor WhatsApp yang valid')
      return
    }

    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const user = await getBuyerByPhone(identifier)
      if (!user) {
        setError('Nomor WhatsApp tidak terdaftar. Silakan daftar terlebih dahulu.')
        setIsLoading(false)
        return
      }

      setOtpPhone(identifier)
      setOtpName('')
      setOtpFlow('login')
      setOtpData({ code: '' })
      setOtpTimer(60)
      setCanResend(false)
      setMode('otp-verify')
      setSuccess(`Kode OTP telah dikirim ke WhatsApp ${identifier} (dummy: ${DUMMY_OTP})`)
    } catch (err) {
      setError('Gagal mengirim OTP. Coba lagi nanti.')
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================================
  // HANDLERS - REGISTER
  // ============================================================

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!registerData.name.trim()) {
      setError('Nama lengkap wajib diisi')
      return
    }
    const phoneClean = registerData.phone.replace(/\s/g, '')
    if (!phoneClean || phoneClean.length < 8) {
      setError('Nomor WhatsApp wajib diisi dengan benar')
      return
    }
    if (registerData.password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }
    if (registerData.password !== registerData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok')
      return
    }
    if (!registerData.agreeTerms) {
      setError('Anda harus menyetujui Syarat & Ketentuan')
      return
    }

    // Cek email
    const existing = await getBuyerByEmail(registerData.email)
    if (existing) {
      setError('Email sudah terdaftar. Silakan login.')
      return
    }

    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setOtpPhone(phoneClean)
      setOtpName(registerData.name)
      setOtpFlow('register')
      setOtpData({ code: '' })
      setOtpTimer(60)
      setCanResend(false)
      setMode('otp-verify')
      setSuccess(`Kode OTP telah dikirim ke WhatsApp ${phoneClean} (dummy: ${DUMMY_OTP})`)
    } catch (err) {
      setError('Gagal mendaftar. Coba lagi nanti.')
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================================
  // HANDLERS - OTP VERIFICATION
  // ============================================================

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const code = otpData.code.trim()
    if (!code || code.length < 4) {
      setError('Masukkan kode OTP yang valid (minimal 4 digit)')
      return
    }

    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (code !== DUMMY_OTP) {
        setError('Kode OTP salah. Gunakan 7777 untuk dummy.')
        setIsLoading(false)
        return
      }

      if (otpFlow === 'login') {
        const user = await getBuyerByPhone(otpPhone)
        if (!user) {
          setError('User tidak ditemukan')
          setIsLoading(false)
          return
        }
        const authUser = {
          id: user.id,
          name: user.name,
          role: 'buyer' as const,
          phone: user.phone,
          email: user.email,
        }
        login('mock-token-123', authUser)
        setSuccess('Login berhasil!')
        setTimeout(() => navigate('/'), 500)
      } else {
        const newUser = await addBuyer({
          name: otpName || 'User',
          email: registerData.email,
          phone: otpPhone,
          password: registerData.password,
        })
        const authUser = {
          id: newUser.id,
          name: newUser.name,
          role: 'buyer' as const,
          phone: newUser.phone,
          email: newUser.email,
        }
        login('mock-token-123', authUser)
        setSuccess('Akun berhasil dibuat!')
        setTimeout(() => navigate('/'), 500)
      }
    } catch (err) {
      setError('Kode OTP tidak valid atau sudah kadaluwarsa')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setOtpTimer(60)
      setCanResend(false)
      setSuccess(`Kode OTP baru telah dikirim (dummy: ${DUMMY_OTP})`)
    } catch (err) {
      setError('Gagal mengirim ulang OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setMode('login')
    setError(null)
    setSuccess(null)
  }

  const handleBackToRegister = () => {
    setMode('register')
    setError(null)
    setSuccess(null)
  }

  // ============================================================
  // OTP VERIFICATION VIEW
  // ============================================================

  if (mode === 'otp-verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fdf6f0] to-[#f4ebdf] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={otpFlow === 'register' ? handleBackToRegister : handleBackToLogin}
            className="mb-6 flex items-center gap-1 text-sm font-medium text-[#6f5448] hover:text-[#4b2417] transition"
          >
            <ChevronLeft className="h-4 w-4" />
            {otpFlow === 'register' ? 'Kembali ke Daftar' : 'Kembali ke Masuk'}
          </button>

          <div className="rounded-2xl bg-white/90 backdrop-blur-sm p-8 shadow-xl border border-[#ead8ca]">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f4ebdf]">
                <Shield className="h-8 w-8 text-[#d85b30]" />
              </div>
              <h2 className="text-2xl font-black text-[#4b2417]">Verifikasi OTP</h2>
              <p className="mt-2 text-sm text-[#6f5448]">
                Kami telah mengirimkan kode OTP ke WhatsApp
                <br />
                <span className="font-semibold text-[#4b2417]">{otpPhone}</span>
              </p>
              <p className="mt-1 text-xs text-[#8b7166]">
                Gunakan kode dummy: <span className="font-mono font-bold text-[#d85b30]">7777</span>
              </p>
              {otpName && (
                <p className="mt-1 text-xs text-[#8b7166]">
                  Untuk akun: <span className="font-medium">{otpName}</span>
                </p>
              )}
            </div>

            <form onSubmit={handleOtpVerify} className="mt-6 space-y-5">
              <div>
                <label htmlFor="otp-code" className="block text-sm font-semibold text-[#4b2417]">
                  Kode OTP
                </label>
                <input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpData.code}
                  onChange={(e) => setOtpData({ code: e.target.value.replace(/\D/g, '') })}
                  placeholder="Masukkan kode 4-6 digit"
                  className="mt-1.5 w-full rounded-xl border border-[#d0bfaf] bg-white/70 px-4 py-3 text-center text-xl font-bold text-[#4b2417] outline-none transition placeholder:text-sm placeholder:font-normal placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                  autoFocus
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
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-sm font-medium text-[#d85b30] hover:text-[#c04e28] transition"
                  >
                    Kirim ulang OTP
                  </button>
                ) : (
                  <span className="text-sm text-[#8b7166]">
                    Kirim ulang dalam {otpTimer}s
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // LOGIN VIEW
  // ============================================================

  if (mode === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fdf6f0] to-[#f4ebdf] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <img
              src="src/assets/logo.png"
              alt="Toti Cakery"
              className="h-12 w-auto object-contain mx-auto"
            />
            <p className="mt-1 text-sm text-[#6f5448]">Selamat datang kembali! 👋</p>
          </div>

          <div className="rounded-2xl bg-white/90 backdrop-blur-sm p-8 shadow-xl border border-[#ead8ca]">
            <h1 className="text-2xl font-black text-[#4b2417]">Masuk ke Akun</h1>
            <p className="mt-1 text-sm text-[#6f5448]">
              Masuk untuk melanjutkan pengalaman belanja
            </p>

            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="login-identifier" className="block text-sm font-semibold text-[#4b2417]">
                  Email
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7166]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="login-identifier"
                    type="email"
                    value={loginData.identifier}
                    onChange={(e) =>
                      setLoginData((prev) => ({ ...prev, identifier: e.target.value }))
                    }
                    placeholder="email@domain.com"
                    className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-3 pl-11 pr-4 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-semibold text-[#4b2417]">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7166]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Masukkan password"
                    className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-3 pl-11 pr-12 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166] hover:text-[#4b2417]"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#8b7166]">
                  Gunakan akun dummy: <span className="font-mono">john@example.com / buyer123</span>
                </p>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-[#6f5448]">
                  <input
                    type="checkbox"
                    checked={loginData.rememberMe}
                    onChange={(e) =>
                      setLoginData((prev) => ({ ...prev, rememberMe: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-[#d0bfaf] text-[#d85b30] focus:ring-[#e9b49d]"
                  />
                  Ingat saya
                </label>
                <Link
                  to="/auth/buyer/forgot-password"
                  className="text-sm font-medium text-[#d85b30] hover:text-[#c04e28] transition"
                >
                  Lupa password?
                </Link>
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
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#ead8ca]" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white/90 px-4 text-[#8b7166]">atau</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLoginWithOtp}
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#25D366] bg-white text-sm font-bold text-[#25D366] transition hover:bg-[#25D366]/5 disabled:opacity-60"
              >
                <MessageCircle className="h-5 w-5" />
                Masuk dengan WhatsApp (OTP)
              </button>

              <div className="text-center text-sm text-[#6f5448]">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-bold text-[#d85b30] hover:text-[#c04e28] transition"
                >
                  Daftar Sekarang
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 text-center text-xs text-[#8b7166]">
            <p>Verifikasi akan dikirim melalui WhatsApp</p>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // REGISTER VIEW
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf6f0] to-[#f4ebdf] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src="src/assets/logo.png"
            alt="Toti Cakery"
            className="h-12 w-auto object-contain mx-auto"
          />
          <p className="mt-1 text-sm text-[#6f5448]">Buat akun untuk mulai belanja! 🎂</p>
        </div>

        <div className="rounded-2xl bg-white/90 backdrop-blur-sm p-8 shadow-xl border border-[#ead8ca]">
          <h1 className="text-2xl font-black text-[#4b2417]">Daftar Akun</h1>
          <p className="mt-1 text-sm text-[#6f5448]">
            Buat akun untuk menjelajahi produk & memesan
          </p>

          <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="register-name" className="block text-sm font-semibold text-[#4b2417]">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7166]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="register-name"
                  type="text"
                  value={registerData.name}
                  onChange={(e) =>
                    setRegisterData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Masukkan nama lengkap Anda"
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-3 pl-11 pr-4 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-semibold text-[#4b2417]">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7166]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="register-email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="email@domain.com"
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-3 pl-11 pr-4 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-phone" className="block text-sm font-semibold text-[#4b2417]">
                Nomor WhatsApp <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7166]">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="register-phone"
                  type="tel"
                  value={registerData.phone}
                  onChange={(e) =>
                    setRegisterData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="81234567890"
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-3 pl-11 pr-4 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                />
              </div>
              <p className="mt-1 text-xs text-[#8b7166]">
                Masukkan nomor WhatsApp aktif untuk verifikasi OTP
              </p>
            </div>

            <div>
              <label htmlFor="register-password" className="block text-sm font-semibold text-[#4b2417]">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7166]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="register-password"
                  type={showRegisterPassword ? 'text' : 'password'}
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-3 pl-11 pr-12 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166] hover:text-[#4b2417]"
                >
                  {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="register-confirm-password" className="block text-sm font-semibold text-[#4b2417]">
                Konfirmasi Password <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7166]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="register-confirm-password"
                  type={showRegisterConfirmPassword ? 'text' : 'password'}
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  placeholder="Konfirmasi password Anda"
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-3 pl-11 pr-12 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166] hover:text-[#4b2417]"
                >
                  {showRegisterConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                id="register-terms"
                type="checkbox"
                checked={registerData.agreeTerms}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, agreeTerms: e.target.checked }))
                }
                className="mt-1 h-4 w-4 shrink-0 rounded border-[#d0bfaf] text-[#d85b30] focus:ring-[#e9b49d]"
              />
              <label htmlFor="register-terms" className="text-sm text-[#6f5448]">
                Saya setuju dengan{' '}
                <Link to="/syarat-ketentuan" className="font-medium text-[#d85b30] hover:text-[#c04e28] transition">
                  Syarat & Ketentuan
                </Link>
              </label>
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
                'Daftar'
              )}
            </button>

            <div className="text-center text-sm text-[#6f5448]">
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold text-[#d85b30] hover:text-[#c04e28] transition"
              >
                Masuk
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-[#8b7166]">
          <p>Dengan mendaftar, Anda menyetujui kebijakan privasi kami</p>
          <p className="mt-1">Kode OTP akan dikirim melalui WhatsApp untuk verifikasi</p>
        </div>
      </div>
    </div>
  )
}