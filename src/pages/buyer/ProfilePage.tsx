// src/pages/buyer/ProfilePage.tsx

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Edit,
  LogOut,
  CheckCircle,
  Shield,
  Camera,
  Lock,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getBuyerByEmail, updateBuyerPassword, type BuyerProfile } from '@/services/buyerService';

// Dummy OTP selalu 7777
const DUMMY_OTP = '7777';

type ChangeField = 'phone' | 'email' | 'password' | null;

export default function ProfilePage() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState<string | null>(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editField, setEditField] = useState<ChangeField>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  // Password change
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // OTP verification
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpField, setOtpField] = useState<'phone' | 'email' | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [otpStep, setOtpStep] = useState<'input' | 'verify'>('input');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/buyer');
      return;
    }

    async function loadProfile() {
      if (!user?.email) return;
      setLoading(true);
      try {
        const data = await getBuyerByEmail(user.email);
        if (data) {
          setProfile(data);
          setFormData({
            name: data.name,
            phone: data.phone,
            email: data.email,
          });
          // Load avatar dari localStorage (dummy)
          const savedAvatar = localStorage.getItem('buyer_avatar');
          if (savedAvatar) setAvatar(savedAvatar);
        }
      } catch (error) {
        console.error('Gagal memuat profil:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user, isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ============================================================
  // AVATAR
  // ============================================================

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatar(result);
        localStorage.setItem('buyer_avatar', result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ============================================================
  // CHANGE PHONE (with OTP via Email)
  // ============================================================

  const handleRequestPhoneOtp = async () => {
    setOtpError(null);
    setOtpSuccess(null);
    setIsOtpLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setOtpSuccess(`Kode OTP telah dikirim ke email ${profile?.email} (dummy: ${DUMMY_OTP})`);
      setOtpStep('verify');
    } catch (err) {
      setOtpError('Gagal mengirim OTP. Silakan coba lagi.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setOtpError(null);
    setOtpSuccess(null);
    setIsOtpLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (otpCode !== DUMMY_OTP) {
        setOtpError('Kode OTP salah. Gunakan 7777 untuk dummy.');
        setIsOtpLoading(false);
        return;
      }

      // Update phone
      if (profile) {
        const updatedProfile = { ...profile, phone: otpValue };
        setProfile(updatedProfile);
        setFormData({ ...formData, phone: otpValue });
        // Simpan ke localStorage dummy
        localStorage.setItem('buyer_profile', JSON.stringify(updatedProfile));
      }

      setOtpSuccess('Nomor WhatsApp berhasil diperbarui!');
      setTimeout(() => {
        setShowOtpModal(false);
        setOtpStep('input');
        setOtpCode('');
        setOtpValue('');
        setOtpField(null);
        setIsEditing(false);
      }, 1500);
    } catch (err) {
      setOtpError('Gagal verifikasi OTP. Silakan coba lagi.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  // ============================================================
  // CHANGE EMAIL (with OTP via WhatsApp)
  // ============================================================

  const handleRequestEmailOtp = async () => {
    setOtpError(null);
    setOtpSuccess(null);
    setIsOtpLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setOtpSuccess(`Kode OTP telah dikirim ke WhatsApp ${profile?.phone} (dummy: ${DUMMY_OTP})`);
      setOtpStep('verify');
    } catch (err) {
      setOtpError('Gagal mengirim OTP. Silakan coba lagi.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setOtpError(null);
    setOtpSuccess(null);
    setIsOtpLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (otpCode !== DUMMY_OTP) {
        setOtpError('Kode OTP salah. Gunakan 7777 untuk dummy.');
        setIsOtpLoading(false);
        return;
      }

      // Update email
      if (profile) {
        const updatedProfile = { ...profile, email: otpValue };
        setProfile(updatedProfile);
        setFormData({ ...formData, email: otpValue });
        localStorage.setItem('buyer_profile', JSON.stringify(updatedProfile));
      }

      setOtpSuccess('Email berhasil diperbarui!');
      setTimeout(() => {
        setShowOtpModal(false);
        setOtpStep('input');
        setOtpCode('');
        setOtpValue('');
        setOtpField(null);
        setIsEditing(false);
      }, 1500);
    } catch (err) {
      setOtpError('Gagal verifikasi OTP. Silakan coba lagi.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwordData.new.length < 6) {
      setPasswordError('Password baru minimal 6 karakter');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('Konfirmasi password tidak cocok');
      return;
    }

    setIsChangingPassword(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (profile) {
        await updateBuyerPassword(profile.email, passwordData.new);
      }
      setPasswordSuccess('Password berhasil diperbarui!');
      setPasswordData({ current: '', new: '', confirm: '' });
      setTimeout(() => {
        setPasswordSuccess(null);
        setIsChangingPassword(false);
        setEditField(null);
      }, 2000);
    } catch (err) {
      setPasswordError('Gagal mengubah password. Silakan coba lagi.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-gray-500">Profil tidak ditemukan</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-[#d85b30] hover:text-[#c04e28] transition"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // OTP Modal
  if (showOtpModal && otpField) {
    const isPhoneField = otpField === 'phone';
    const title = isPhoneField ? 'Ubah Nomor WhatsApp' : 'Ubah Email';
    const placeholder = isPhoneField ? 'Masukkan nomor WhatsApp baru' : 'Masukkan email baru';
    const currentValue = isPhoneField ? profile.phone : profile.email;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[#4b2417]">{title}</h2>
            <button
              onClick={() => {
                setShowOtpModal(false);
                setOtpStep('input');
                setOtpCode('');
                setOtpValue('');
                setOtpField(null);
                setOtpError(null);
                setOtpSuccess(null);
              }}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {otpStep === 'input' ? (
            <div className="mt-4">
              <p className="text-sm text-[#6f5448]">
                {isPhoneField
                  ? `Masukkan nomor WhatsApp baru. Kode OTP akan dikirim ke email ${profile.email}`
                  : `Masukkan email baru. Kode OTP akan dikirim ke WhatsApp ${profile.phone}`}
              </p>
              <input
                type={isPhoneField ? 'tel' : 'email'}
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                placeholder={placeholder}
                className="mt-3 w-full rounded-xl border border-[#d0bfaf] px-4 py-3 text-sm outline-none focus:border-[#c95b31]"
              />
              {otpError && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {otpError}
                </div>
              )}
              {otpSuccess && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {otpSuccess}
                </div>
              )}
              <button
                onClick={handleRequestPhoneOtp}
                disabled={isOtpLoading || !otpValue.trim()}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white hover:bg-[#c04e28] disabled:opacity-60"
              >
                {isOtpLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim OTP...
                  </>
                ) : (
                  'Kirim OTP'
                )}
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-[#6f5448]">
                Masukkan kode OTP yang dikirim ke {isPhoneField ? 'email' : 'WhatsApp'} Anda
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Masukkan kode OTP (dummy: 7777)"
                className="mt-3 w-full rounded-xl border border-[#d0bfaf] px-4 py-3 text-center text-xl font-bold outline-none focus:border-[#c95b31]"
              />
              <p className="mt-1 text-xs text-[#8b7166]">Gunakan kode dummy <span className="font-mono font-bold">7777</span></p>
              {otpError && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {otpError}
                </div>
              )}
              {otpSuccess && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {otpSuccess}
                </div>
              )}
              <button
                onClick={isPhoneField ? handleVerifyPhoneOtp : handleVerifyEmailOtp}
                disabled={isOtpLoading || otpCode.length < 4}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white hover:bg-[#c04e28] disabled:opacity-60"
              >
                {isOtpLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  'Verifikasi OTP'
                )}
              </button>
              <button
                onClick={() => setOtpStep('input')}
                className="mt-2 w-full text-center text-sm text-[#d85b30] hover:text-[#c04e28] transition"
              >
                Kirim ulang OTP
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-black text-[#4b2417]">Profil Saya</h1>
      <p className="mt-1 text-sm text-[#6f5448]">Kelola informasi akun Anda</p>

      <div className="mt-6">
        {/* Profile Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-[#ead8ca]">
          {/* Avatar */}
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <div className="relative">
              <div
                className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-full bg-[#d85b30] text-4xl font-black text-white overflow-hidden"
                onClick={handleAvatarClick}
              >
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  profile.name.charAt(0)
                )}
              </div>
              <button
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 rounded-full bg-white p-1.5 shadow-md border border-gray-200 hover:bg-gray-50 transition"
              >
                <Camera className="h-4 w-4 text-[#6f5448]" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[#4b2417]">{profile.name}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  <CheckCircle className="h-3 w-3" />
                  Terverifikasi
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {/* Phone */}
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-[#6f5448]" />
                  <span className="text-[#6f5448]">Nomor WhatsApp</span>
                  <span className="font-medium text-[#4b2417]">{profile.phone}</span>
                  <button
                    onClick={() => {
                      setOtpField('phone');
                      setOtpValue('');
                      setOtpCode('');
                      setOtpStep('input');
                      setOtpError(null);
                      setOtpSuccess(null);
                      setShowOtpModal(true);
                    }}
                    className="ml-auto text-xs font-semibold text-[#d85b30] hover:text-[#c04e28] transition"
                  >
                    Ubah
                  </button>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-[#6f5448]" />
                  <span className="text-[#6f5448]">Email</span>
                  <span className="font-medium text-[#4b2417]">{profile.email}</span>
                  <button
                    onClick={() => {
                      setOtpField('email');
                      setOtpValue('');
                      setOtpCode('');
                      setOtpStep('input');
                      setOtpError(null);
                      setOtpSuccess(null);
                      setShowOtpModal(true);
                    }}
                    className="ml-auto text-xs font-semibold text-[#d85b30] hover:text-[#c04e28] transition"
                  >
                    Ubah
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-[#ead8ca]" />

          {/* Change Password */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#6f5448]" />
                <span className="text-sm font-semibold text-[#4b2417]">Ganti Password</span>
              </div>
              {editField !== 'password' && (
                <button
                  onClick={() => setEditField('password')}
                  className="text-xs font-semibold text-[#d85b30] hover:text-[#c04e28] transition"
                >
                  Ubah Password
                </button>
              )}
            </div>

            {editField === 'password' && (
              <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#4b2417]">Password Baru</label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                      placeholder="Minimal 6 karakter"
                      className="w-full rounded-xl border border-[#d0bfaf] px-4 py-2 pr-10 text-sm outline-none focus:border-[#c95b31]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#4b2417]">Konfirmasi Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    placeholder="Ulangi password baru"
                    className="mt-1 w-full rounded-xl border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#c95b31]"
                  />
                </div>

                {passwordError && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {passwordSuccess}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex-1 rounded-xl bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-60"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Password'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditField(null);
                      setPasswordData({ current: '', new: '', confirm: '' });
                      setPasswordError(null);
                      setPasswordSuccess(null);
                    }}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Logout */}
          <div className="mt-6 pt-6 border-t border-[#ead8ca]">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}