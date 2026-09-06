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
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants'
import {
  resetBuyerPassword,
  startWAVerification,
  getWAVerificationStatus,
} from '@/api/auth'
import { InternationalPhoneInput } from '@/components/common/PhoneInput'
import { formatPhoneNumber } from '@/utils/phone'

type PasswordStep = 'idle' | 'otp' | 'reset'

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

    if (err.response?.data?.message) {
      return err.response.data.message
    }
  }

  return fallback
}

export default function ProfilePage() {
  const { user, logout, updateUser, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [avatar] = useState<string | null>(null)
  const [tempAvatar, setTempAvatar] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  // Phone Modal State
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneSuccess, setPhoneSuccess] = useState<string | null>(null)

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
      setTempAvatar(result)
      setAvatarError(null)
    }

    reader.readAsDataURL(file)
  }

  const handleCancelAvatar = () => {
    setTempAvatar(null)
    setAvatarError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSaveAvatar = async () => {
    setAvatarLoading(true)
    setAvatarError(null)
    try {
      // Backend does not currently support profile image upload
      throw new Error('Backend persistence is not yet supported. Frontend UI is ready.')
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : 'Gagal menyimpan foto profil.')
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleRequestPasswordOtp = async () => {
    setPasswordError(null)
    setPasswordSuccess(null)

    const targetPhone = formatPhoneNumber(user.phone || '')

    if (!targetPhone) {
      setPasswordError('Nomor WhatsApp tidak tersedia di akun Anda.')
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await startWAVerification({
        phone_number: targetPhone,
      })

      if (response.mock_mode && response.verify_token) {
        setVerifyToken(response.verify_token)
        setPasswordSuccess('Verifikasi WhatsApp berhasil. Silakan buat password baru.')
        setPasswordStep('reset')
      } else if (response.nonce) {
        setOtpId(response.nonce)
        if (response.deeplink) {
          window.open(response.deeplink, '_blank')
        }
        setPasswordSuccess('Silakan kirim pesan verifikasi di WhatsApp. Memeriksa status...')
        setPasswordStep('otp')
      }
    } catch (err) {
      setPasswordError(parseApiError(err, 'Gagal memulai verifikasi WhatsApp.'))
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    setPasswordError(null)
    setPasswordSuccess(null)

    if (!otpId) {
      setPasswordError('Nonce verifikasi tidak ditemukan.')
      setPasswordStep('idle')
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await getWAVerificationStatus(otpId)

      if (response.status === 'verified' && response.verify_token) {
        setVerifyToken(response.verify_token)
        setPasswordSuccess('Verifikasi WhatsApp berhasil. Silakan buat password baru.')
        setPasswordStep('reset')
      } else {
        setPasswordError('Verifikasi WhatsApp belum selesai. Kirim pesan WhatsApp terlebih dahulu.')
      }
    } catch (err) {
      setPasswordError(parseApiError(err, 'Gagal memeriksa status verifikasi.'))
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

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setPhoneError(null)
    setPhoneSuccess(null)

    const cleanedPhone = formatPhoneNumber(newPhone)
    if (!cleanedPhone || cleanedPhone.length < 8) {
      setPhoneError('Nomor WhatsApp tidak valid. Silakan periksa kembali.')
      return
    }

    setPhoneLoading(true)

    try {
      // Simulate/apply phone update
      updateUser({ phone: cleanedPhone })
      setPhoneSuccess('Nomor WhatsApp berhasil diperbarui!')
      setTimeout(() => {
        setIsPhoneModalOpen(false)
        setPhoneSuccess(null)
      }, 1200)
    } catch (err) {
      setPhoneError(parseApiError(err, 'Gagal memperbarui nomor WhatsApp.'))
    } finally {
      setPhoneLoading(false)
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
                {tempAvatar || avatar ? (
                  <img
                    src={tempAvatar || avatar || ''}
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
            
            {tempAvatar && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveAvatar}
                    disabled={avatarLoading}
                    className="flex h-8 items-center justify-center rounded-lg bg-[#d85b30] px-4 text-xs font-bold text-white transition hover:bg-[#c04e28] disabled:opacity-60"
                  >
                    {avatarLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                    Simpan
                  </button>
                  <button
                    onClick={handleCancelAvatar}
                    disabled={avatarLoading}
                    className="flex h-8 items-center justify-center rounded-lg border border-[#d0bfaf] px-4 text-xs font-bold text-[#4b2417] transition hover:bg-[#fff4ed]"
                  >
                    Batal
                  </button>
                </div>
                {avatarError && (
                  <div className="mt-1 max-w-[200px] text-center text-xs font-semibold text-red-600">
                    {avatarError}
                  </div>
                )}
              </div>
            )}

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

              <div className="rounded-xl border border-[#ead8ca] bg-[#fffaf6] p-4 flex flex-col justify-between">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#4b2417]">
                      <Phone className="h-4 w-4 text-[#d85b30]" />
                      Nomor WhatsApp
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewPhone(user.phone || '')
                        setPhoneError(null)
                        setPhoneSuccess(null)
                        setIsPhoneModalOpen(true)
                      }}
                      className="text-xs font-bold text-[#d85b30] hover:text-[#c04e28] hover:underline"
                    >
                      Ubah
                    </button>
                  </div>

                  <p className="text-sm text-[#6f5448]">
                    {user.phone || '-'}
                  </p>
                </div>
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
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
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

                  <div className="relative mt-1.5">
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
                      className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-3 pl-4 pr-12 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
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

      {/* Modal Ubah Nomor HP */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#ead8ca] pb-3">
              <h3 className="text-lg font-black text-[#4b2417]">
                Ubah Nomor HP / WhatsApp
              </h3>
              <button
                type="button"
                onClick={() => setIsPhoneModalOpen(false)}
                className="rounded-full p-1 text-[#8b7166] hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {phoneError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {phoneError}
              </div>
            )}

            {phoneSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {phoneSuccess}
              </div>
            )}

            <form onSubmit={handleSavePhone} className="mt-4 space-y-4">
              <InternationalPhoneInput
                label="Nomor WhatsApp Baru"
                value={newPhone}
                onChange={setNewPhone}
                placeholder="812 3456 7890"
                required
                error={phoneError}
              />

              <p className="text-xs text-[#8b7166]">
                Pilih kode negara via dropdown dan ketik nomor tanpa angka 0 di depan. Format otomatis tersimpan dalam standar E.164.
              </p>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPhoneModalOpen(false)}
                  className="rounded-xl border border-[#d0bfaf] px-4 py-2.5 text-sm font-bold text-[#4b2417] hover:bg-[#fff4ed] transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={phoneLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-[#d85b30] px-5 py-2.5 text-sm font-black text-white hover:bg-[#c04e28] disabled:opacity-60 transition"
                >
                  {phoneLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Nomor'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
