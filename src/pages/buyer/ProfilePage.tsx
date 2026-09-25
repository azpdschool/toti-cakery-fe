import { useRef, useState } from 'react'
import type React from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  User,
  Phone,
  Mail,
  LogOut,
  CheckCircle,
  Camera,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Home,
  X,
  Heart,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants'
import { changeBuyerPassword, changeBuyerPhone, uploadBuyerAvatar } from '@/api/auth'
import ImageCropper from '@/components/common/ImageCropper'
import { InternationalPhoneInput } from '@/components/common/PhoneInput'
import { formatPhoneNumber } from '@/utils/phone'

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
  const { t } = useTranslation()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [cropperSrc, setCropperSrc] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [profileImgError, setProfileImgError] = useState(false)

  // Phone Modal State
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [phoneCurrentPassword, setPhoneCurrentPassword] = useState('')
  const [showPhoneCurrentPassword, setShowPhoneCurrentPassword] = useState(false)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneSuccess, setPhoneSuccess] = useState<string | null>(null)

  // Password State
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

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

    if (!file.type.startsWith('image/') || file.size === 0 || file.size > 5 * 1024 * 1024) {
      toast.error(t('profile.image_error'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCropperSrc(String(reader.result))
      setIsCropperOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropCancel = () => {
    setIsCropperOpen(false)
    setCropperSrc(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCropConfirm = async (croppedFile: File) => {
    if (croppedFile.size > 5 * 1024 * 1024) {
      toast.error(t('profile.upload_error'))
      return
    }

    setAvatarLoading(true)
    try {
      const response = await uploadBuyerAvatar(croppedFile)
      updateUser({ avatar_url: response.avatar_url })
      toast.success(t('profile.upload_success'))
      setIsCropperOpen(false)
      setCropperSrc(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      toast.error(t('profile.upload_error'))
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    setPasswordError(null)
    setPasswordSuccess(null)

    if (!passwordData.current) {
      setPasswordError(t('profile.password_req_current'))
      return
    }

    if (passwordData.new.length < 6) {
      setPasswordError(t('profile.password_req_length'))
      return
    }

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError(t('profile.password_req_match'))
      return
    }

    setPasswordLoading(true)

    try {
      await changeBuyerPassword({
        current_password: passwordData.current,
        new_password: passwordData.new,
      })

      setPasswordSuccess(t('profile.password_success'))
      setPasswordData({ current: '', new: '', confirm: '' })
      setTimeout(() => {
        setIsChangingPassword(false)
        setPasswordSuccess(null)
      }, 2000)
    } catch (err) {
      setPasswordError(parseApiError(err, t('profile.password_failed')))
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setPhoneError(null)
    setPhoneSuccess(null)

    const cleanedPhone = formatPhoneNumber(newPhone)
    if (!cleanedPhone || cleanedPhone.length < 8) {
      setPhoneError(t('profile.phone_invalid'))
      return
    }

    if (!phoneCurrentPassword) {
      setPhoneError(t('profile.password_req_current'))
      return
    }

    setPhoneLoading(true)

    try {
      const response = await changeBuyerPhone({ 
        current_password: phoneCurrentPassword,
        phone: cleanedPhone 
      })
      
      updateUser({ phone: response.phone })
      setPhoneSuccess(t('profile.phone_success'))
      
      setTimeout(() => {
        setIsPhoneModalOpen(false)
        setPhoneSuccess(null)
      }, 1500)
    } catch (err) {
      setPhoneError(parseApiError(err, t('profile.phone_failed')))
    } finally {
      setPhoneLoading(false)
    }
  }

  const initial = user.name?.charAt(0).toUpperCase() || 'B'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Page Header (Full Width) */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#3A1F16]">
          {t('profile.title')}
        </h1>
        <p className="mt-1 text-sm text-[#6B4A3C]">
          {t('profile.subtitle')}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        
        {/* LEFT SIDEBAR: Identity & Quick Navigation */}
        <aside className="space-y-6">
          {/* Identity Card */}
          <div className="rounded-2xl border border-[#D0BFAF] bg-white p-6 shadow-sm flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#F6EFE6] text-3xl font-black text-[#9B4A2F] border-2 border-[#EAD8CA]">
                {user.avatar_url && !profileImgError ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    onError={() => setProfileImgError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>

              <button
                type="button"
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#9B4A2F] text-white shadow-sm transition hover:bg-[#7E3A24]"
                aria-label={t('profile.change_avatar_title')}
                title={t('profile.change_avatar_title')}
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

            <h2 className="mt-4 text-lg font-bold text-[#3A1F16]">
              {user.name || t('profile.buyer')}
            </h2>

            <p className="mt-0.5 text-xs text-[#6B4A3C]">
              {user.email || user.phone || '-'}
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 border border-green-200">
              <CheckCircle className="h-3.5 w-3.5" />
              {t('profile.active')}
            </div>
          </div>

          {/* Quick Navigation Card */}
          <div className="rounded-2xl border border-[#D0BFAF] bg-white p-4 shadow-sm space-y-1">
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#6B4A3C] transition hover:bg-[#F6EFE6] hover:text-[#3A1F16]"
            >
              <Home className="h-4 w-4 text-[#9B4A2F]" />
              {t('profile.home')}
            </Link>

            <Link
              to={ROUTES.ORDERS}
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#6B4A3C] transition hover:bg-[#F6EFE6] hover:text-[#3A1F16]"
            >
              <ShoppingBag className="h-4 w-4 text-[#9B4A2F]" />
              {t('profile.my_orders')}
            </Link>

            <Link
              to={ROUTES.WISHLIST}
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#6B4A3C] transition hover:bg-[#F6EFE6] hover:text-[#3A1F16]"
            >
              <Heart className="h-4 w-4 text-[#9B4A2F]" />
              {t('profile.wishlist')}
            </Link>

            <div className="pt-2 border-t border-[#EAD8CA] mt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                {t('profile.logout')}
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT */}
        <main className="space-y-6">

          {/* Personal Information Card */}
          <section className="rounded-2xl border border-[#D0BFAF] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#3A1F16] mb-4 border-b border-[#EAD8CA] pb-3">
              {t('profile.profile_info')}
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Name */}
              <div className="rounded-xl border border-[#EAD8CA] bg-[#F6EFE6]/40 p-4">
                <div className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B4A3C]">
                  <User className="h-3.5 w-3.5 text-[#9B4A2F]" />
                  {t('profile.name')}
                </div>
                <p className="text-sm font-semibold text-[#3A1F16]">
                  {user.name || '-'}
                </p>
              </div>

              {/* Email */}
              <div className="rounded-xl border border-[#EAD8CA] bg-[#F6EFE6]/40 p-4">
                <div className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B4A3C]">
                  <Mail className="h-3.5 w-3.5 text-[#9B4A2F]" />
                  {t('profile.email')}
                </div>
                <p className="break-all text-sm font-semibold text-[#3A1F16]">
                  {user.email || '-'}
                </p>
              </div>

              {/* WhatsApp Number */}
              <div className="rounded-xl border border-[#EAD8CA] bg-[#F6EFE6]/40 p-4 md:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B4A3C]">
                    <Phone className="h-3.5 w-3.5 text-[#9B4A2F]" />
                    {t('profile.phone')}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPhone(user.phone || '')
                      setPhoneCurrentPassword('')
                      setPhoneError(null)
                      setPhoneSuccess(null)
                      setIsPhoneModalOpen(true)
                    }}
                    className="text-xs font-bold text-[#9B4A2F] hover:text-[#7E3A24] hover:underline"
                  >
                    {t('profile.change')}
                  </button>
                </div>
                <p className="mt-1 text-sm font-semibold text-[#3A1F16]">
                  {user.phone || '-'}
                </p>
              </div>
            </div>
          </section>

          {/* Account Security Card */}
          <section className="rounded-2xl border border-[#D0BFAF] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#3A1F16] mb-1">
              {t('profile.account_security')}
            </h2>

            <p className="text-xs text-[#6B4A3C] mb-4">
              {t('profile.change_password')}
            </p>

            {passwordError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                {passwordSuccess}
              </div>
            )}

            {!isChangingPassword ? (
              <button
                type="button"
                onClick={() => setIsChangingPassword(true)}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#9B4A2F] px-5 text-sm font-bold text-white transition hover:bg-[#7E3A24]"
              >
                <Lock className="mr-2 h-4 w-4" />
                {t('profile.change_password')}
              </button>
            ) : (
              <form onSubmit={handleSavePassword} className="max-w-md space-y-4 border-t border-[#EAD8CA] pt-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A1F16]">
                    {t('profile.current_password')}
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.current}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                      placeholder={t('profile.current_password_placeholder')}
                      className="w-full rounded-xl border border-[#D0BFAF] bg-white py-2.5 pl-4 pr-12 text-sm text-[#3A1F16] outline-none transition focus:border-[#9B4A2F] focus:ring-2 focus:ring-[#9B4A2F]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B4A3C] hover:text-[#3A1F16]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A1F16]">
                    {t('profile.new_password')}
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.new}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                      placeholder={t('profile.new_password_placeholder')}
                      className="w-full rounded-xl border border-[#D0BFAF] bg-white py-2.5 pl-4 pr-12 text-sm text-[#3A1F16] outline-none transition focus:border-[#9B4A2F] focus:ring-2 focus:ring-[#9B4A2F]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A1F16]">
                    {t('profile.confirm_password')}
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                      placeholder={t('profile.confirm_password_placeholder')}
                      className="w-full rounded-xl border border-[#D0BFAF] bg-white py-2.5 pl-4 pr-12 text-sm text-[#3A1F16] outline-none transition focus:border-[#9B4A2F] focus:ring-2 focus:ring-[#9B4A2F]/20"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[#9B4A2F] px-5 text-sm font-bold text-white transition hover:bg-[#7E3A24] disabled:opacity-60"
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('profile.saving')}
                      </>
                    ) : (
                      t('profile.save_password')
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false)
                      setPasswordData({ current: '', new: '', confirm: '' })
                      setPasswordError(null)
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D0BFAF] bg-white px-5 text-sm font-bold text-[#3A1F16] transition hover:bg-[#F6EFE6]"
                  >
                    {t('profile.cancel')}
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
                {t('profile.change_phone_modal_title')}
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
                label={t('profile.new_phone_label')}
                value={newPhone}
                onChange={setNewPhone}
                placeholder="812 3456 7890"
                required
                error={phoneError}
              />
              <p className="text-xs text-[#8b7166]">
                {t('profile.phone_helper')}
              </p>

              <div>
                <label className="block text-sm font-semibold text-[#4b2417] mb-1">
                  {t('profile.current_password')}
                </label>
                <div className="relative">
                  <input
                    type={showPhoneCurrentPassword ? 'text' : 'password'}
                    value={phoneCurrentPassword}
                    onChange={(e) => setPhoneCurrentPassword(e.target.value)}
                    placeholder={t('profile.current_password_placeholder')}
                    className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-2.5 pl-4 pr-10 text-sm text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPhoneCurrentPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166]"
                  >
                    {showPhoneCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsPhoneModalOpen(false)}
                  className="rounded-xl border border-[#d0bfaf] px-4 py-2.5 text-sm font-bold text-[#4b2417] hover:bg-[#fff4ed] transition"
                >
                  {t('profile.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={phoneLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-[#d85b30] px-5 py-2.5 text-sm font-black text-white hover:bg-[#c04e28] disabled:opacity-60 transition"
                >
                  {phoneLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('profile.saving')}
                    </>
                  ) : (
                    t('profile.save_phone')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {isCropperOpen && cropperSrc && (
        <ImageCropper
          imageSrc={cropperSrc}
          onCrop={handleCropConfirm}
          onCancel={handleCropCancel}
          isUploading={avatarLoading}
        />
      )}
    </div>
  )
}

