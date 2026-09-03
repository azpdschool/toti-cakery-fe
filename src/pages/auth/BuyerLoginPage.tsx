// src/pages/auth/BuyerLoginPage.tsx
import { useState, useEffect, useRef } from 'react'
import type React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  ExternalLink,
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
  startWAVerification,
  getWAVerificationStatus,
} from '@/api/auth'
import { InternationalPhoneInput } from '@/components/common/PhoneInput'

type Mode =
  | 'login-email'
  | 'login-phone-password'
  | 'login-phone-otp'
  | 'register'
  | 'wa-verification-pending'

type PendingAction = 'register' | 'login-otp'

function parseApiError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as {
      response?: {
        data?: { detail?: unknown; message?: string }
        status?: number
      }
    }
    const detail = err.response?.data?.detail

    if (typeof detail === 'string') return detail

    if (Array.isArray(detail)) {
      return detail
        .map((item: { msg?: string }) => item?.msg)
        .filter(Boolean)
        .join(', ')
    }

    if (err.response?.status === 401) return 'Kredensial login tidak valid'
    if (err.response?.status === 404) return 'Akun buyer tidak ditemukan'
    if (err.response?.status === 409) return 'Nomor HP atau email sudah terdaftar'
    if (err.response?.status === 429) return 'Terlalu banyak percobaan verifikasi'
    if (err.response?.status === 400) return 'Data request tidak valid'
  }

  if (error instanceof Error && error.message) {
    return error.message
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

  // Register
  const [name, setName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // WA Real Verification State
  const [waNonce, setWaNonce] = useState<string | null>(null)
  const [waDeeplink, setWaDeeplink] = useState<string>('')
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [, setIsPolling] = useState(false)

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
    setIsPolling(false)
  }

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [])

  const resetMessage = () => {
    setError(null)
    setSuccess(null)
  }

  const goHome = () => {
    setTimeout(() => {
      navigate(ROUTES.HOME, { replace: true })
    }, 500)
  }

  // Polling logic for REAL WA verification mode
  const startStatusPolling = (
    nonce: string,
    action: PendingAction,
    registrationData?: {
      name: string
      email: string
      phone: string
      password: string
    },
    loginPhone?: string,
  ) => {
    stopPolling()
    setIsPolling(true)

    // Timeout after 5 minutes (300,000 ms)
    pollTimeoutRef.current = setTimeout(() => {
      stopPolling()
      setError('Sesi verifikasi WhatsApp telah kedaluwarsa. Silakan coba lagi.')
      setMode(action === 'register' ? 'register' : 'login-phone-otp')
    }, 300000)

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await getWAVerificationStatus(nonce)

        if (res.status === 'verified' && res.verify_token) {
          stopPolling()
          setLoading(true)

          if (action === 'register' && registrationData) {
            try {
              const response = await registerBuyer({
                name: registrationData.name,
                email: registrationData.email,
                phone: registrationData.phone,
                password: registrationData.password,
                verify_token: res.verify_token,
              })
              login(response.access_token, mapBuyerAuthResponseToUser(response))
              setSuccess('Verifikasi berhasil! Akun telah terdaftar.')
              goHome()
            } catch (err) {
              setError(parseApiError(err, 'Gagal menyelesaikan pendaftaran akun'))
              setMode('register')
            } finally {
              setLoading(false)
            }
          } else if (action === 'login-otp' && loginPhone) {
            try {
              const response = await loginBuyerOtp({
                phone: loginPhone,
                verify_token: res.verify_token,
              })
              login(response.access_token, mapBuyerAuthResponseToUser(response))
              setSuccess('Verifikasi berhasil! Login sukses.')
              goHome()
            } catch (err) {
              setError(parseApiError(err, 'Gagal login menggunakan OTP'))
              setMode('login-phone-otp')
            } finally {
              setLoading(false)
            }
          }
        }
      } catch (err) {
        // Continue polling unless explicit hard error occurs
        console.error('Polling WA verification error:', err)
      }
    }, 3000)
  }

  // ------------------------------------------------------------
  // HANDLERS
  // ------------------------------------------------------------

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

  const handleStartLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()

    const targetPhone = otpPhone.trim()
    if (!targetPhone) {
      setError('Nomor HP wajib diisi')
      return
    }

    setLoading(true)

    try {
      const startRes = await startWAVerification({
        phone_number: targetPhone,
      })

      // MOCK MODE Handling: backend returned verify_token directly
      if (startRes.mock_mode && startRes.verify_token) {
        const response = await loginBuyerOtp({
          phone: targetPhone,
          verify_token: startRes.verify_token,
        })
        login(response.access_token, mapBuyerAuthResponseToUser(response))
        setSuccess('Login OTP berhasil')
        goHome()
        return
      }

      // REAL MODE Handling: setup deep link and start status polling
      setWaNonce(startRes.nonce)
      setWaDeeplink(startRes.deeplink)
      setPendingAction('login-otp')
      setMode('wa-verification-pending')

      startStatusPolling(startRes.nonce, 'login-otp', undefined, targetPhone)
    } catch (err) {
      setError(parseApiError(err, 'Gagal memulai verifikasi WhatsApp'))
    } finally {
      setLoading(false)
    }
  }

  const handleStartRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()

    const regName = name.trim()
    const regEmail = registerEmail.trim()
    const regPhone = registerPhone.trim()

    if (!regName || !regEmail || !regPhone) {
      setError('Nama, email, dan nomor HP wajib diisi')
      return
    }

    if (registerPassword.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }

    if (registerPassword !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok')
      return
    }

    setLoading(true)

    try {
      const startRes = await startWAVerification({
        phone_number: regPhone,
      })

      // MOCK MODE Handling: backend auto-verified and returned verify_token directly
      if (startRes.mock_mode && startRes.verify_token) {
        const response = await registerBuyer({
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: registerPassword,
          verify_token: startRes.verify_token,
        })
        login(response.access_token, mapBuyerAuthResponseToUser(response))
        setSuccess('Registrasi berhasil!')
        goHome()
        return
      }

      // REAL MODE Handling: setup deep link and start status polling
      const regData = {
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: registerPassword,
      }

      setWaNonce(startRes.nonce)
      setWaDeeplink(startRes.deeplink)
      setPendingAction('register')
      setMode('wa-verification-pending')

      startStatusPolling(startRes.nonce, 'register', regData)
    } catch (err) {
      setError(parseApiError(err, 'Gagal memulai verifikasi WhatsApp'))
    } finally {
      setLoading(false)
    }
  }

  const isLoginMode =
    mode === 'login-email' ||
    mode === 'login-phone-password' ||
    mode === 'login-phone-otp'

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff7f0] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#ead8ca] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black text-[#4b2417]">
          {mode === 'wa-verification-pending'
            ? 'Verifikasi WhatsApp'
            : isLoginMode
            ? 'Login Buyer'
            : 'Register Buyer'}
        </h1>

        <p className="mt-1 text-sm text-[#6f5448]">
          {mode === 'login-email' && 'Masuk menggunakan email dan password'}
          {mode === 'login-phone-password' && 'Masuk menggunakan nomor HP dan password'}
          {mode === 'login-phone-otp' && 'Masuk via verifikasi WhatsApp'}
          {mode === 'register' && 'Buat akun buyer baru'}
          {mode === 'wa-verification-pending' &&
            'Buka WhatsApp untuk mengonfirmasi nomor telepon Anda'}
        </p>

        {/* Login/Register tab (hidden in WA pending mode) */}
        {mode !== 'wa-verification-pending' && (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                stopPolling()
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
                stopPolling()
                resetMessage()
                setMode('register')
              }}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${
                mode === 'register'
                  ? 'bg-[#d85b30] text-white'
                  : 'bg-[#f5eadf] text-[#4b2417]'
              }`}
            >
              Register
            </button>
          </div>
        )}

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
                mode === 'login-phone-otp'
                  ? 'bg-[#fff1e9] text-[#d85b30]'
                  : 'bg-gray-50 text-[#6f5448]'
              }`}
            >
              WhatsApp
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

        {/* Mode: Email Login */}
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

        {/* Mode: Phone + Password Login */}
        {mode === 'login-phone-password' && (
          <form onSubmit={handlePhonePasswordLogin} className="mt-6 space-y-4">
            <InternationalPhoneInput
              value={phonePasswordNumber}
              onChange={setPhonePasswordNumber}
              placeholder="812 1234 1234"
              required
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

        {/* Mode: Phone + WhatsApp OTP Start */}
        {mode === 'login-phone-otp' && (
          <form onSubmit={handleStartLoginOtp} className="mt-6 space-y-4">
            <InternationalPhoneInput
              value={otpPhone}
              onChange={setOtpPhone}
              placeholder="812 1234 1234"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#25D366] text-sm font-black text-white hover:bg-[#20bd5a] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Verifikasi WhatsApp & Login
                </>
              )}
            </button>
          </form>
        )}

        {/* Mode: Registration Form */}
        {mode === 'register' && (
          <form onSubmit={handleStartRegister} className="mt-6 space-y-4">
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

            <InternationalPhoneInput
              value={registerPhone}
              onChange={setRegisterPhone}
              placeholder="812 3456 7890"
              required
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

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white hover:bg-[#c04e28] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Daftar Akun'
              )}
            </button>
          </form>
        )}

        {/* Mode: WA Real Verification Pending UI */}
        {mode === 'wa-verification-pending' && (
          <div className="mt-6 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f9ee]">
              <MessageCircle className="h-8 w-8 text-[#25D366]" />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-[#6f5448]">
                Silakan klik tombol di bawah untuk membuka WhatsApp dan mengirim pesan konfirmasi verifikasi.
              </p>
              {waNonce && (
                <p className="text-xs text-gray-500 font-mono">
                  Kode Verifikasi (Nonce): <span className="font-bold">{waNonce}</span>
                </p>
              )}
            </div>

            {waDeeplink && (
              <a
                href={waDeeplink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#25D366] text-sm font-bold text-white shadow hover:bg-[#20bd5a]"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Buka WhatsApp Sekarang
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            )}

            <div className="flex items-center justify-center gap-2 rounded-xl bg-[#fff7f0] border border-[#ead8ca] py-3 text-xs text-[#8b7166]">
              <Loader2 className="h-4 w-4 animate-spin text-[#d85b30]" />
              <span>Menunggu konfirmasi dari WhatsApp...</span>
            </div>

            <button
              type="button"
              onClick={() => {
                stopPolling()
                setMode(pendingAction === 'register' ? 'register' : 'login-phone-otp')
              }}
              className="w-full text-sm font-semibold text-[#d85b30] hover:underline"
            >
              Batal / Kembali
            </button>
          </div>
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
      className="flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white hover:bg-[#c04e28] disabled:opacity-60"
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
