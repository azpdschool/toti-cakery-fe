// src/pages/auth/SellerForgotPasswordPage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Lock, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { getUserByEmail, updateUserPasswordByEmail } from '@/services/sellerSettingsService';

export default function SellerForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const DUMMY_OTP = '7777';

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      const user = await getUserByEmail(email);
      if (!user) {
        setError('Email tidak terdaftar. Silakan coba lagi.');
        setIsLoading(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(`Kode OTP telah dikirim ke ${email} (dummy: ${DUMMY_OTP})`);
      setStep('otp');
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!otp.trim()) {
      setError('Masukkan kode OTP');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (otp.trim() !== DUMMY_OTP) {
        setError('Kode OTP salah. Gunakan 7777.');
        setIsLoading(false);
        return;
      }
      setSuccess('OTP berhasil diverifikasi. Silakan buat password baru.');
      setStep('reset');
    } catch (err) {
      setError('Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Password dan konfirmasi tidak cocok');
      return;
    }

    setIsLoading(true);
    try {
      await updateUserPasswordByEmail(email, newPassword);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess('Password berhasil direset! Silakan login.');
      setTimeout(() => navigate('/auth/seller'), 1500);
    } catch (err) {
      setError('Gagal mereset password. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf6f0] to-[#f4ebdf] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate('/auth/seller')}
          className="mb-6 flex items-center gap-1 text-sm font-medium text-[#6f5448] hover:text-[#4b2417] transition"
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali ke Login
        </button>

        <div className="rounded-2xl bg-white/90 backdrop-blur-sm p-8 shadow-xl border border-[#ead8ca]">
          <h1 className="text-2xl font-black text-[#4b2417]">Lupa Password</h1>
          <p className="mt-1 text-sm text-[#6f5448]">
            {step === 'email' && 'Masukkan email Anda untuk menerima kode OTP'}
            {step === 'otp' && 'Masukkan kode OTP yang dikirim ke email Anda'}
            {step === 'reset' && 'Buat password baru untuk akun Anda'}
          </p>

          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#4b2417]">
                  Email
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7166]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-3 pl-11 pr-4 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                  />
                </div>
                <p className="mt-2 text-xs text-[#8b7166]">
                  Gunakan email yang terdaftar di akun seller Anda
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
                <label htmlFor="otp" className="block text-sm font-semibold text-[#4b2417]">
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
                  placeholder="Masukkan kode OTP (dummy: 7777)"
                  className="mt-1.5 w-full rounded-xl border border-[#d0bfaf] bg-white/70 px-4 py-3 text-center text-xl font-bold text-[#4b2417] outline-none transition placeholder:text-sm placeholder:font-normal placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                  autoFocus
                />
                <p className="mt-2 text-xs text-[#8b7166]">
                  Gunakan kode dummy <span className="font-mono font-bold">7777</span>
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
                  onClick={() => setStep('email')}
                  className="text-sm font-medium text-[#d85b30] hover:text-[#c04e28] transition"
                >
                  Kirim ulang OTP
                </button>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-semibold text-[#4b2417]">
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
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166] hover:text-[#4b2417]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold text-[#4b2417]">
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
  );
}