// src/pages/auth/Register.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';
import {
  startWAVerification,
  getWAVerificationStatus,
  registerBuyer,
  mapBuyerAuthResponseToUser,
} from '@/api/auth';
import { InternationalPhoneInput } from '@/components/common/PhoneInput';

function parseApiError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as { response?: { data?: { detail?: unknown; message?: string }; status?: number } };
    const detail = err.response?.data?.detail;

    if (err.response?.status === 409) return 'Nomor HP atau email sudah terdaftar';
    if (typeof detail === 'string') return detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item: { msg?: string }) => item?.msg)
        .filter(Boolean)
        .join(', ');
    }

    if (err.response?.data?.message) {
      return err.response.data.message;
    }
  }

  return fallback;
}

export const Register: React.FC = () => {
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // WA Verification state
  const [waMode, setWaMode] = useState(false);
  const [waNonce, setWaNonce] = useState('');
  const [waDeeplink, setWaDeeplink] = useState('');
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.HOME, { replace: true });
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isAuthenticated, navigate]);

  const startStatusPolling = (nonce: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = window.setInterval(async () => {
      try {
        const res = await getWAVerificationStatus(nonce);
        if (res.status === 'verified' && res.verify_token) {
          if (pollingRef.current) clearInterval(pollingRef.current);

          const response = await registerBuyer({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password,
            verify_token: res.verify_token,
          });

          login(response.access_token, mapBuyerAuthResponseToUser(response));
          setSuccess(t('common.success', 'Registrasi berhasil!'));
          setTimeout(() => navigate(ROUTES.HOME, { replace: true }), 1000);
        }
      } catch {
        // Continue polling until timeout or verified
      }
    }, 3000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      setError('Nama, email, dan nomor HP wajib diisi');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);

    try {
      const startRes = await startWAVerification({
        phone_number: trimmedPhone,
      });

      // MOCK MODE Handling
      if (startRes.mock_mode && startRes.verify_token) {
        const response = await registerBuyer({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          password,
          verify_token: startRes.verify_token,
        });

        login(response.access_token, mapBuyerAuthResponseToUser(response));
        setSuccess('Registrasi berhasil! Mengalihkan...');
        setTimeout(() => navigate(ROUTES.HOME, { replace: true }), 1000);
        return;
      }

      // REAL MODE: WA Deeplink and polling
      setWaNonce(startRes.nonce);
      setWaDeeplink(startRes.deeplink);
      setWaMode(true);
      startStatusPolling(startRes.nonce);
    } catch (err) {
      setError(parseApiError(err, 'Gagal memulai verifikasi WhatsApp'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#ead8ca] bg-white p-8 shadow-sm">
        <div className="text-center">
          <Link
            to={ROUTES.HOME}
            className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-[#8b7166] hover:text-[#d85b30]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Beranda
          </Link>
          <h1 className="text-2xl font-black text-[#4b2417]">Daftar Akun Baru</h1>
          <p className="mt-1 text-sm text-[#6f5448]">
            Lengkapi data di bawah untuk membuat akun di Toti Cakery
          </p>
        </div>

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

        {!waMode ? (
          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6f5448]">
                Nama Lengkap
              </label>
              <div className="relative flex items-center rounded-xl border border-[#d0bfaf] bg-white transition-all focus-within:border-[#d85b30] focus-within:ring-2 focus-within:ring-[#d85b30]/20">
                <UserIcon className="ml-3.5 h-4 w-4 text-[#8b7166]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  className="w-full bg-transparent px-3 py-3 text-sm font-medium text-[#4b2417] placeholder:text-[#9c8478] outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6f5448]">
                Email
              </label>
              <div className="relative flex items-center rounded-xl border border-[#d0bfaf] bg-white transition-all focus-within:border-[#d85b30] focus-within:ring-2 focus-within:ring-[#d85b30]/20">
                <Mail className="ml-3.5 h-4 w-4 text-[#8b7166]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="w-full bg-transparent px-3 py-3 text-sm font-medium text-[#4b2417] placeholder:text-[#9c8478] outline-none"
                  required
                />
              </div>
            </div>

            <InternationalPhoneInput
              label="Nomor WhatsApp"
              value={phone}
              onChange={setPhone}
              placeholder="812 3456 7890"
              required
            />

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6f5448]">
                Password
              </label>
              <div className="relative flex items-center rounded-xl border border-[#d0bfaf] bg-white transition-all focus-within:border-[#d85b30] focus-within:ring-2 focus-within:ring-[#d85b30]/20">
                <Lock className="ml-3.5 h-4 w-4 text-[#8b7166]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-transparent px-3 py-3 text-sm font-medium text-[#4b2417] placeholder:text-[#9c8478] outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="mr-3 text-[#8b7166] hover:text-[#4b2417]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6f5448]">
                Konfirmasi Password
              </label>
              <div className="relative flex items-center rounded-xl border border-[#d0bfaf] bg-white transition-all focus-within:border-[#d85b30] focus-within:ring-2 focus-within:ring-[#d85b30]/20">
                <Lock className="ml-3.5 h-4 w-4 text-[#8b7166]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  className="w-full bg-transparent px-3 py-3 text-sm font-medium text-[#4b2417] placeholder:text-[#9c8478] outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="mr-3 text-[#8b7166] hover:text-[#4b2417]"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white hover:bg-[#c04e28] disabled:opacity-60 transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Daftar Sekarang'}
            </button>
          </form>
        ) : (
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
                  Kode Verifikasi: <span className="font-bold">{waNonce}</span>
                </p>
              )}
            </div>

            {waDeeplink && (
              <a
                href={waDeeplink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#25D366] text-sm font-black text-white hover:bg-[#20bd5a]"
              >
                Buka WhatsApp
              </a>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-[#8b7166]">
              <Loader2 className="h-4 w-4 animate-spin text-[#d85b30]" />
              Menunggu verifikasi WhatsApp...
            </div>

            <button
              type="button"
              onClick={() => {
                if (pollingRef.current) clearInterval(pollingRef.current);
                setWaMode(false);
              }}
              className="text-xs text-[#d85b30] hover:underline"
            >
              Kembali ke form
            </button>
          </div>
        )}

        <div className="mt-6 border-t border-[#ead8ca] pt-4 text-center text-xs text-[#6f5448]">
          Sudah punya akun?{' '}
          <Link to={ROUTES.AUTH_BUYER} className="font-bold text-[#d85b30] hover:underline">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
