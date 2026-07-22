// src/pages/buyer/ProfilePage.tsx
import { useRef, useState } from 'react'
import type React from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  User,
  Phone,
  Mail,
  LogOut,
  CheckCircle,
  Shield,
  Camera,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Home,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants'
import {
  resetBuyerPassword,
  sendBuyerOtp,
  verifyBuyerOtp,
} from '@/api/auth'

type PasswordStep = 'idle' | 'otp' | 'reset'

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

export default function ProfilePage() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [avatar, setAvatar] = useState<string | null>(() => {
    return localStorage.getItem('buyer_avatar')
  })

  const [passwordStep, setPasswordStep] = useState<PasswordStep>('idle')
  const [otpId, setOtpId] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [verifyToken, setVerifyToken] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    new: '',
    confirm: '',
  })

  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  if (!isAuthenticated || !user || user.role !== 'buyer') {
    return <Navigate to={ROUTES.AUTH_BUYER} replace />
  }

  const handleLogout = () => {
    logout()
    navigate(ROUTES.HOME, { replace: true })
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar')
      return
    }

    const reader = new FileReader()

    reader.onloadend = () => {
      const result = String(reader.result)
      setAvatar(result)
      localStorage.setItem('buyer_avatar', result)
    }

    reader.readAsDataURL(file)
  }

  const handleRequestPasswordOtp = async () => {
    setPasswordError(null)
    setPasswordSuccess(null)

    const target = user.email || user.phone

    if (!target) {
      setPasswordError('Email atau nomor WhatsApp tidak tersedia.')
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await sendBuyerOtp({
        target,
        channel: user.email ? 'email' : 'whatsapp',
        purpose: 'reset_password',
      })

      setOtpId(response.otp_id)
      setPasswordSuccess(
        'Kode OTP telah dikirim. Untuk development gunakan kode 7777.',
      )
      setPasswordStep('otp')
    } catch (err) {
      setPasswordError(parseApiError(err, 'Gagal mengirim OTP.'))
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    setPasswordError(null)
    setPasswordSuccess(null)

    if (!otpId) {
      setPasswordError('OTP ID tidak ditemukan. Silakan kirim ulang OTP.')
      setPasswordStep('idle')
      return
    }

    if (!otpCode.trim()) {
      setPasswordError('Kode OTP wajib diisi.')
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await verifyBuyerOtp({
        otp_id: otpId,
        code: otpCode.trim(),
      })

      setVerifyToken(response.verify_token)
      setPasswordSuccess('OTP berhasil diverifikasi. Silakan buat password baru.')
      setPasswordStep('reset')
    } catch (err) {
      setPasswordError(parseApiError(err, 'Kode OTP salah atau expired.'))
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    setPasswordError(null)
    setPasswordSuccess(null)

    if (!verifyToken) {
      setPasswordError('Token verifikasi tidak ditemukan.')
      setPasswordStep('idle')
      return
    }

    if (passwordData.new.length < 6) {
      setPasswordError('Password minimal 6 karakter.')
      return
    }

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('Password dan konfirmasi tidak cocok.')
      return
    }

    setIsChangingPassword(true)

    try {
      await resetBuyerPassword({
        verify_token: verifyToken,
        new_password: passwordData.new,
      })

      setPasswordSuccess('Password berhasil diganti.')
      setPasswordStep('idle')
      setOtpId('')
      setOtpCode('')
      setVerifyToken('')
      setPasswordData({
        new: '',
        confirm: '',
      })
    } catch (err) {
      setPasswordError(parseApiError(err, 'Gagal mengganti password.'))
    } finally {
      setIsChangingPassword(false)
    }
  }

  const initial = user.name?.charAt(0).toUpperCase() || 'B'

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-[#f3e2d7] text-4xl font-black text-[#d85b30]">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>

              <button
                type="button"
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#d85b30] text-white shadow-sm transition hover:bg-[#c04e28]"
              >
                <Camera className="h-4 w-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <h1 className="mt-4 text-xl font-black text-[#4b2417]">
              {user.name || 'Buyer'}
            </h1>

            <p className="mt-1 text-sm text-[#6f5448]">
              {user.email || user.phone || '-'}
            </p>

            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
              <CheckCircle className="h-3.5 w-3.5" />
              Akun Aktif
            </div>
          </div>

          <div className="mt-6 space-y-2 border-t border-[#ead8ca] pt-5">
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#6f5448] transition hover:bg-[#fff4ed] hover:text-[#4b2417]"
            >
              <Home className="h-4 w-4" />
              Beranda
            </Link>

            <Link
              to={ROUTES.ORDERS}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#6f5448] transition hover:bg-[#fff4ed] hover:text-[#4b2417]"
            >
              <ShoppingBag className="h-4 w-4" />
              Pesanan Saya
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <main className="space-y-6">
          <section className="rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#4b2417]">
                  Informasi Profil
                </h2>

                <p className="mt-1 text-sm text-[#6f5448]">
                  Data akun buyer dari autentikasi backend.
                </p>
              </div>

              <div className="hidden rounded-full bg-[#fff1e9] px-3 py-1 text-xs font-bold text-[#d85b30] sm:block">
                Buyer
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[#ead8ca] bg-[#fffaf6] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#4b2417]">
                  <User className="h-4 w-4 text-[#d85b30]" />
                  Nama
                </div>

                <p className="text-sm text-[#6f5448]">
                  {user.name || '-'}
                </p>
              </div>

              <div className="rounded-xl border border-[#ead8ca] bg-[#fffaf6] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#4b2417]">
                  <Mail className="h-4 w-4 text-[#d85b30]" />
                  Email
                </div>

                <p className="break-all text-sm text-[#6f5448]">
                  {user.email || '-'}
                </p>
              </div>

              <div className="rounded-xl border border-[#ead8ca] bg-[#fffaf6] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#4b2417]">
                  <Phone className="h-4 w-4 text-[#d85b30]" />
                  Nomor WhatsApp
                </div>

                <p className="text-sm text-[#6f5448]">
                  {user.phone || '-'}
                </p>
              </div>

              <div className="rounded-xl border border-[#ead8ca] bg-[#fffaf6] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#4b2417]">
                  <Shield className="h-4 w-4 text-[#d85b30]" />
                  Role
                </div>

                <p className="text-sm capitalize text-[#6f5448]">
                  {user.role}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-[#4b2417]">
              Keamanan Akun
            </h2>

            <p className="mt-1 text-sm text-[#6f5448]">
              Ganti password menggunakan OTP dari backend.
            </p>

            {passwordError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {passwordSuccess}
              </div>
            )}

            {passwordStep === 'idle' && (
              <button
                type="button"
                onClick={handleRequestPasswordOtp}
                disabled={isChangingPassword}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#d85b30] px-5 text-sm font-black text-white transition hover:bg-[#c04e28] disabled:opacity-60"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim OTP...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Ganti Password
                  </>
                )}
              </button>
            )}

            {passwordStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="mt-5 max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#4b2417]">
                    Kode OTP
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="Masukkan OTP"
                    className="mt-1.5 w-full rounded-xl border border-[#d0bfaf] bg-white/70 px-4 py-3 text-center text-xl font-bold text-[#4b2417] outline-none transition placeholder:text-sm placeholder:font-normal placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                    autoFocus
                  />

                  <p className="mt-2 text-xs text-[#8b7166]">
                    Untuk development gunakan kode{' '}
                    <span className="font-mono font-bold">7777</span>.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#d85b30] px-5 text-sm font-black text-white transition hover:bg-[#c04e28] disabled:opacity-60"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifikasi...
                      </>
                    ) : (
                      'Verifikasi OTP'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPasswordStep('idle')
                      setOtpId('')
                      setOtpCode('')
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d0bfaf] px-5 text-sm font-bold text-[#4b2417] transition hover:bg-[#fff4ed]"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}

            {passwordStep === 'reset' && (
              <form
                onSubmit={handleResetPassword}
                className="mt-5 max-w-md space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-[#4b2417]">
                    Password Baru
                  </label>

                  <div className="relative mt-1.5">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.new}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          new: e.target.value,
                        }))
                      }
                      placeholder="Minimal 6 karakter"
                      className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-3 pl-4 pr-12 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
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
                  <label className="block text-sm font-semibold text-[#4b2417]">
                    Konfirmasi Password
                  </label>

                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.confirm}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirm: e.target.value,
                      }))
                    }
                    placeholder="Ulangi password baru"
                    className="mt-1.5 w-full rounded-xl border border-[#d0bfaf] bg-white/70 px-4 py-3 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#d85b30] px-5 text-sm font-black text-white transition hover:bg-[#c04e28] disabled:opacity-60"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Password'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPasswordStep('idle')
                      setVerifyToken('')
                      setPasswordData({
                        new: '',
                        confirm: '',
                      })
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d0bfaf] px-5 text-sm font-bold text-[#4b2417] transition hover:bg-[#fff4ed]"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
