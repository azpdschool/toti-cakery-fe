import { useState, useRef, useEffect } from 'react'
import type React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
  MessageCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES, LOGO_URL } from '@/constants'
import {
  registerBuyer,
  startWAVerification,
  getWAVerificationStatus,
  mapBuyerAuthResponseToUser,
} from '@/api/auth'
import { InternationalPhoneInput } from '@/components/common/PhoneInput'
import { formatPhoneNumber } from '@/utils/phone'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useTranslation()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // WA Verification State
  const [waMode, setWaMode] = useState(false)
  const [waNonce, setWaNonce] = useState<string | null>(null)
  const [waDeeplink, setWaDeeplink] = useState<string>('')
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const stopPolling = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
    pollIntervalRef.current = null
    pollTimeoutRef.current = null
  }

  useEffect(() => {
    return () => stopPolling()
  }, [])

  const resetMessage = () => {
    setError(null)
    setSuccess(null)
  }

  const goHome = () => {
    setTimeout(() => {
      navigate(ROUTES.HOME, { replace: true })
    }, 1000)
  }

  const startStatusPolling = (nonce: string, regData: any) => {
    stopPolling()

    pollTimeoutRef.current = setTimeout(() => {
      stopPolling()
      setError(t('auth.wa_expired'))
      setWaMode(false)
    }, 300000)

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await getWAVerificationStatus(nonce)
        if (res.status === 'verified' && res.verify_token) {
          stopPolling()
          setLoading(true)
          try {
            const response = await registerBuyer({
              name: regData.name,
              email: regData.email,
              phone: regData.phone,
              password: regData.password,
              verify_token: res.verify_token,
            })
            login(response.access_token, mapBuyerAuthResponseToUser(response))
            setSuccess(t('auth.login_success'))
            goHome()
          } catch (err: any) {
            setError(err.response?.data?.detail || err.message || t('auth.error_generic'))
            setWaMode(false)
          } finally {
            setLoading(false)
          }
        } else if (res.status === 'expired' || res.status === 'failed') {
          stopPolling()
          setError(t('auth.wa_expired'))
          setWaMode(false)
        }
      } catch {
        // Continue polling
      }
    }, 3000)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedPhone = formatPhoneNumber(phone)

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      setError(t('auth.phone_required'))
      return
    }

    if (password.length < 6) {
      setError(t('auth.error_password_length'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.error_password_match'))
      return
    }

    setLoading(true)
    try {
      const startRes = await startWAVerification({ phone_number: trimmedPhone })
      const regData = {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        password: password,
      }

      if (startRes.mock_mode && startRes.verify_token) {
        const response = await registerBuyer({
          ...regData,
          verify_token: startRes.verify_token,
        })
        login(response.access_token, mapBuyerAuthResponseToUser(response))
        setSuccess(t('auth.login_success'))
        goHome()
        return
      }

      setWaNonce(startRes.nonce)
      setWaDeeplink(startRes.deeplink)
      setWaMode(true)
      startStatusPolling(startRes.nonce, regData)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || t('auth.error_generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fffaf5] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center flex flex-col items-center">
          <Link to={ROUTES.HOME} className="inline-block mb-6">
            <img src={LOGO_URL} alt="Toti Cakery" className="mx-auto w-48 sm:w-60 h-auto max-w-full object-contain" />
          </Link>
          <h1 className="text-2xl font-black text-[#4b2417]">{t('auth.buyer_register_title')}</h1>
          <p className="mt-1 text-sm text-[#6f5448]">{t('auth.buyer_register_subtitle')}</p>
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

        {!waMode ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('auth.name_placeholder')}
                className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]"
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.email_placeholder')}
                className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]"
                required
              />
            </div>

            <InternationalPhoneInput
              value={phone}
              onChange={setPhone}
              placeholder={t('auth.phone_placeholder')}
              required
            />

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.password_min_length')}
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

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirm_password_placeholder')}
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

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white hover:bg-[#c04e28] disabled:opacity-60 transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.register_btn')}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f9ee]">
              <MessageCircle className="h-8 w-8 text-[#25D366]" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-[#6f5448]">{t('auth.wa_instruction')}</p>
              {waNonce && (
                <p className="text-xs text-gray-500 font-mono">
                  {t('auth.wa_verification_code')} <span className="font-bold">{waNonce}</span>
                </p>
              )}
            </div>
            {waDeeplink && (
              <a
                href={waDeeplink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#25D366] text-sm font-bold text-white shadow hover:bg-[#20bd5a] transition"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                {t('auth.open_wa_btn')}
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            )}
            <div className="flex items-center justify-center gap-2 rounded-xl bg-[#fff7f0] border border-[#ead8ca] py-3 text-xs text-[#8b7166]">
              <Loader2 className="h-4 w-4 animate-spin text-[#d85b30]" />
              <span>{t('auth.wa_waiting')}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                stopPolling()
                setWaMode(false)
              }}
              className="w-full text-sm font-semibold text-[#d85b30] hover:underline"
            >
              {t('auth.cancel')}
            </button>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-[#6f5448]">
          {t('auth.has_account')}{' '}
          <Link to={ROUTES.AUTH_BUYER} className="font-bold text-[#d85b30] hover:underline">
            {t('auth.login_btn')}
          </Link>
        </div>

        <div className="mt-6 border-t border-[#ead8ca] pt-6 text-center text-sm text-[#6f5448]">
          <Link to={ROUTES.HOME} className="font-medium text-[#8b7166] hover:text-[#4b2417]">
            {t('auth.back_to_home', 'Kembali ke Beranda')}
          </Link>
        </div>
      </div>
    </div>
  )
}
