// src/pages/auth/BuyerLoginPage.tsx
import { useState } from 'react'
import type React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
  MessageCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants'
import {
  loginBuyer,
  loginBuyerPhone,
  loginBuyerOtp,
  mapBuyerAuthResponseToUser,
  registerBuyer,
  sendBuyerOtp,
  verifyBuyerOtp,
} from '@/api/auth'

type Mode =
  | 'login-email'
  | 'login-phone-password'
  | 'login-phone-otp'
  | 'login-phone-otp-verify'
  | 'register'
  | 'register-otp'

function parseApiError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as any
    const detail = err.response?.data?.detail

    if (typeof detail === 'string') return detail

    if (Array.isArray(detail)) {
      return detail.map((item) => item?.msg).filter(Boolean).join(', ')
    }

    if (err.response?.status === 401) return 'Data login tidak valid'
    if (err.response?.status === 404) return 'Akun buyer tidak ditemukan'
    if (err.response?.status === 400) return 'Data tidak valid atau OTP salah'
  }

  return fallback
}

export default function BuyerLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [mode, setMode] = useState<Mode>('login-email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Login email
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Login phone + password
  const [phonePasswordNumber, setPhonePasswordNumber] = useState('')
  const [phonePasswordPassword, setPhonePasswordPassword] = useState('')

  // Login phone + OTP
  const [otpPhone, setOtpPhone] = useState('')
  const [otpLoginId, setOtpLoginId] = useState('')
  const [otpLoginCode, setOtpLoginCode] = useState('')

  // Register
  const [name, setName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [registerOtpId, setRegisterOtpId] = useState('')
  const [registerOtpCode, setRegisterOtpCode] = useState('')

  const resetMessage = () => {
    setError(null)
    setSuccess(null)
  }

  const goHome = () => {
    setTimeout(() => {
      navigate(ROUTES.HOME, { replace: true })
    }, 500)
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Email dan password wajib diisi')
      return
    }

    setLoading(true)

    try {
      const response = await loginBuyer({
        email: loginEmail.trim(),
        password: loginPassword,
      })

      login(response.access_token, mapBuyerAuthResponseToUser(response))
      setSuccess('Login berhasil')
      goHome()
    } catch (err) {
      setError(parseApiError(err, 'Gagal login dengan email'))
    } finally {
      setLoading(false)
    }
  }

  const handlePhonePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()

    if (!phonePasswordNumber.trim() || !phonePasswordPassword.trim()) {
      setError('Nomor HP dan password wajib diisi')
      return
    }

    setLoading(true)

    try {
      const response = await loginBuyerPhone({
        phone_number: phonePasswordNumber.trim(),
        password: phonePasswordPassword,
      })

      login(response.access_token, mapBuyerAuthResponseToUser(response))
      setSuccess('Login berhasil')
      goHome()
    } catch (err) {
      setError(parseApiError(err, 'Gagal login dengan nomor HP'))
    } finally {
      setLoading(false)
    }
  }

  const handleSendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()

    if (!otpPhone.trim()) {
      setError('Nomor HP wajib diisi')
      return
    }

    setLoading(true)

    try {
      const response = await sendBuyerOtp({
        target: otpPhone.trim(),
        channel: 'whatsapp',
        purpose: 'login',
      })

      setOtpLoginId(response.otp_id)
      setSuccess('OTP login terkirim. Untuk development gunakan kode 7777.')
      setMode('login-phone-otp-verify')
    } catch (err) {
      setError(parseApiError(err, 'Gagal mengirim OTP login'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()

    if (!otpLoginId) {
      setError('OTP ID tidak ditemukan. Kirim ulang OTP.')
      setMode('login-phone-otp')
      return
    }

    if (!otpLoginCode.trim()) {
      setError('Kode OTP wajib diisi')
      return
    }

    setLoading(true)

    try {
      const verified = await verifyBuyerOtp({
        otp_id: otpLoginId,
        code: otpLoginCode.trim(),
      })

      const response = await loginBuyerOtp({
        phone: otpPhone.trim(),
        verify_token: verified.verify_token,
      })

      login(response.access_token, mapBuyerAuthResponseToUser(response))
      setSuccess('Login OTP berhasil')
      goHome()
    } catch (err) {
      setError(parseApiError(err, 'Gagal login menggunakan OTP'))
    } finally {
      setLoading(false)
    }
  }

  const handleSendRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()

    if (!name.trim() || !registerEmail.trim() || !registerPhone.trim()) {
      setError('Nama, email, dan nomor HP wajib diisi')
      return
    }

    if (registerPassword.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }

    if (registerPassword !== confirmPassword) {
      setError('Password dan konfirmasi tidak cocok')
      return
    }

    setLoading(true)

    try {
      const response = await sendBuyerOtp({
        target: registerEmail.trim(),
        channel: 'email',
        purpose: 'register',
      })

      setRegisterOtpId(response.otp_id)
      setSuccess('OTP registrasi terkirim. Untuk development gunakan kode 7777.')
      setMode('register-otp')
    } catch (err) {
      setError(parseApiError(err, 'Gagal mengirim OTP register'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()

    if (!registerOtpId) {
      setError('OTP ID tidak ditemukan. Kirim ulang OTP.')
      setMode('register')
      return
    }

    if (!registerOtpCode.trim()) {
      setError('Kode OTP wajib diisi')
      return
    }

    setLoading(true)

    try {
      const verified = await verifyBuyerOtp({
        otp_id: registerOtpId,
        code: registerOtpCode.trim(),
      })

      const response = await registerBuyer({
        name: name.trim(),
        email: registerEmail.trim(),
        phone: registerPhone.trim(),
        password: registerPassword,
        verify_token: verified.verify_token,
      })

      login(response.access_token, mapBuyerAuthResponseToUser(response))
      setSuccess('Register berhasil')
      goHome()
    } catch (err) {
      setError(parseApiError(err, 'Gagal register buyer'))
    } finally {
      setLoading(false)
    }
  }

  const isLoginMode =
    mode === 'login-email' ||
    mode === 'login-phone-password' ||
    mode === 'login-phone-otp' ||
    mode === 'login-phone-otp-verify'

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff7f0] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#ead8ca] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black text-[#4b2417]">
          {isLoginMode ? 'Login Buyer' : 'Register Buyer'}
        </h1>

        <p className="mt-1 text-sm text-[#6f5448]">
          {mode === 'login-email' && 'Masuk menggunakan email dan password'}
          {mode === 'login-phone-password' && 'Masuk menggunakan nomor HP dan password'}
          {mode === 'login-phone-otp' && 'Masuk menggunakan kode OTP WhatsApp'}
          {mode === 'login-phone-otp-verify' && 'Masukkan kode OTP yang dikirim'}
          {mode === 'register' && 'Buat akun buyer baru'}
          {mode === 'register-otp' && 'Verifikasi kode OTP registrasi'}
        </p>

        {/* Login/Register tab */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              resetMessage()
              setMode('login-email')
            }}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              isLoginMode
                ? 'bg-[#d85b30] text-white'
                : 'bg-[#f5eadf] text-[#4b2417]'
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              resetMessage()
              setMode('register')
            }}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              mode === 'register' || mode === 'register-otp'
                ? 'bg-[#d85b30] text-white'
                : 'bg-[#f5eadf] text-[#4b2417]'
            }`}
          >
            Register
          </button>
        </div>

        {/* Login method tab */}
        {isLoginMode && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                resetMessage()
                setMode('login-email')
              }}
              className={`rounded-lg px-2 py-2 text-xs font-bold ${
                mode === 'login-email'
                  ? 'bg-[#fff1e9] text-[#d85b30]'
                  : 'bg-gray-50 text-[#6f5448]'
              }`}
            >
              Email
            </button>

            <button
              type="button"
              onClick={() => {
                resetMessage()
                setMode('login-phone-password')
              }}
              className={`rounded-lg px-2 py-2 text-xs font-bold ${
                mode === 'login-phone-password'
                  ? 'bg-[#fff1e9] text-[#d85b30]'
                  : 'bg-gray-50 text-[#6f5448]'
              }`}
            >
              No HP
            </button>

            <button
              type="button"
              onClick={() => {
                resetMessage()
                setMode('login-phone-otp')
              }}
              className={`rounded-lg px-2 py-2 text-xs font-bold ${
                mode === 'login-phone-otp' || mode === 'login-phone-otp-verify'
                  ? 'bg-[#fff1e9] text-[#d85b30]'
                  : 'bg-gray-50 text-[#6f5448]'
              }`}
            >
              OTP
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {mode === 'login-email' && (
          <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">
            <IconInput
              icon="mail"
              type="email"
              value={loginEmail}
              onChange={setLoginEmail}
              placeholder="email@domain.com"
            />

            <PasswordInput
              value={loginPassword}
              onChange={setLoginPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />

            <SubmitButton loading={loading} label="Login" />
            <ForgotPasswordLink />
          </form>
        )}

        {mode === 'login-phone-password' && (
          <form onSubmit={handlePhonePasswordLogin} className="mt-6 space-y-4">
            <IconInput
              icon="phone"
              type="tel"
              value={phonePasswordNumber}
              onChange={setPhonePasswordNumber}
              placeholder="contoh: 082112341234"
            />

            <PasswordInput
              value={phonePasswordPassword}
              onChange={setPhonePasswordPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />

            <SubmitButton loading={loading} label="Login dengan No HP" />
            <ForgotPasswordLink />
          </form>
        )}

        {mode === 'login-phone-otp' && (
          <form onSubmit={handleSendLoginOtp} className="mt-6 space-y-4">
            <IconInput
              icon="phone"
              type="tel"
              value={otpPhone}
              onChange={setOtpPhone}
              placeholder="contoh: 082112341234"
            />

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Kirim OTP
                </>
              )}
            </button>
          </form>
        )}

        {mode === 'login-phone-otp-verify' && (
          <form onSubmit={handleVerifyLoginOtp} className="mt-6 space-y-4">
            <input
              type="text"
              inputMode="numeric"
              value={otpLoginCode}
              onChange={(e) => setOtpLoginCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Kode OTP, contoh 7777"
              className="w-full rounded-xl border border-[#d0bfaf] px-4 py-3 text-center text-xl font-bold outline-none focus:border-[#d85b30]"
            />

            <p className="text-xs text-[#8b7166]">
              OTP dikirim ke {otpPhone}. Untuk development gunakan{' '}
              <span className="font-mono font-bold">7777</span>.
            </p>

            <SubmitButton loading={loading} label="Verifikasi & Login" />

            <button
              type="button"
              onClick={() => {
                setOtpLoginId('')
                setOtpLoginCode('')
                setMode('login-phone-otp')
              }}
              className="w-full text-sm font-semibold text-[#d85b30]"
            >
              Kirim ulang OTP
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleSendRegisterOtp} className="mt-6 space-y-4">
            <IconInput
              icon="user"
              type="text"
              value={name}
              onChange={setName}
              placeholder="Nama lengkap"
            />

            <IconInput
              icon="mail"
              type="email"
              value={registerEmail}
              onChange={setRegisterEmail}
              placeholder="Email"
            />

            <IconInput
              icon="phone"
              type="tel"
              value={registerPhone}
              onChange={setRegisterPhone}
              placeholder="Nomor HP / WhatsApp"
            />

            <input
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-[#d0bfaf] px-4 py-3 text-sm outline-none focus:border-[#d85b30]"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Konfirmasi password"
              className="w-full rounded-xl border border-[#d0bfaf] px-4 py-3 text-sm outline-none focus:border-[#d85b30]"
            />

            <SubmitButton loading={loading} label="Kirim OTP Register" />
          </form>
        )}

        {mode === 'register-otp' && (
          <form onSubmit={handleVerifyAndRegister} className="mt-6 space-y-4">
            <input
              type="text"
              inputMode="numeric"
              value={registerOtpCode}
              onChange={(e) => setRegisterOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Kode OTP, contoh 7777"
              className="w-full rounded-xl border border-[#d0bfaf] px-4 py-3 text-center text-xl font-bold outline-none focus:border-[#d85b30]"
            />

            <p className="text-xs text-[#8b7166]">
              OTP registrasi dikirim ke {registerEmail}. Untuk development
              gunakan <span className="font-mono font-bold">7777</span>.
            </p>

            <SubmitButton loading={loading} label="Verifikasi & Daftar" />

            <button
              type="button"
              onClick={() => setMode('register')}
              className="w-full text-sm font-semibold text-[#d85b30]"
            >
              Kembali
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function SubmitButton({
  loading,
  label,
}: {
  loading: boolean
  label: string
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </button>
  )
}

function ForgotPasswordLink() {
  return (
    <div className="text-center">
      <Link
        to="/auth/buyer/forgot-password"
        className="text-sm font-semibold text-[#d85b30]"
      >
        Lupa password?
      </Link>
    </div>
  )
}

function PasswordInput({
  value,
  onChange,
  showPassword,
  setShowPassword,
}: {
  value: string
  onChange: (value: string) => void
  showPassword: boolean
  setShowPassword: (value: boolean | ((prev: boolean) => boolean)) => void
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-[#4b2417]">
        Password
      </label>

      <div className="relative mt-1.5">
        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />

        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-12 text-sm outline-none focus:border-[#d85b30]"
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
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
  )
}

function IconInput({
  icon,
  type,
  value,
  onChange,
  placeholder,
}: {
  icon: 'user' | 'mail' | 'phone'
  type: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const Icon = icon === 'user' ? User : icon === 'mail' ? Mail : Phone

  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#d85b30]"
      />
    </div>
  )
}
