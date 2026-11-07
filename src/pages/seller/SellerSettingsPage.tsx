import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { useToast } from '@/components/ui/Toast';
import { toast } from 'react-hot-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SellerModal } from '@/components/ui/SellerModal';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  User,
  Users,
  MessageCircle,
  Edit,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Plus,
  Mail,
  AlertCircle,
  Store,
  Upload,
  Image as ImageIcon,
  MapPin,
  Globe,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { SellerSortDropdown } from '@/components/ui/SellerSortDropdown';
import { SellerFilterDropdown } from '@/components/ui/SellerFilterDropdown';
import {
  getStoreCustomization,
  uploadHeroImage,
  updateStoreCustomization,
  type StoreCustomizationPatchPayload,
} from '@/services/storeCustomizationService';
import {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  uploadAvatar,
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  getEmailSenderSettings,
  updateEmailSenderSettings,
  updateTakeoverHandler,
  type UserProfile,
  type UserProfileUpdate,
} from '@/services/sellerSettingsService';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useWhatsApp } from '@/context/WhatsAppContext';
import {
  getWhatsAppStatus,
  getWhatsAppQr,
  resetWhatsAppNumber,
  invalidatePublicContactCache,
  type WhatsAppStatus
} from "@/services/whatsappService";
import ImageCropper from '@/components/common/ImageCropper';
import { roleLabel } from '@/lib/roles';

// ============================================================
// KOMPONEN TAB NAVIGATION
// ============================================================

interface TabButtonProps {
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ label, icon: Icon, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition border-b-2 whitespace-nowrap shrink-0 ${
        isActive
          ? 'border-[#d85b30] text-[#d85b30]'
          : 'border-transparent text-[#6f5448] hover:text-[#4b2417]'
      }`}
    >
      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      {label}
    </button>
  );
}

// ============================================================
// TAB 1: MY PROFILE
// ============================================================

function ProfileTab() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user: currentUser, updateUser, isOwner } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const isOwnerUser = isOwner || profile?.role_id === 1 || currentUser?.role === 'owner';
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_number: '',
    nomor_wa_admin: '',
    handles_takeover: false,
  });

  // Avatar Modal State
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMyProfile(true);
        if (ignore) return;
        setProfile(data);
        setFormData({
          username: data.username || currentUser?.username || '',
          email: data.email || currentUser?.email || '',
          phone_number: data.phone_number || currentUser?.phone || '',
          nomor_wa_admin: data.nomor_wa_admin || '',
          handles_takeover: data.handles_takeover ?? false,
        });
      } catch (err: any) {
        if (ignore) return;
        console.error(err);
        setError('Failed to load profile.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [currentUser?.email, currentUser?.phone, currentUser?.username]);

  const handleEditClick = () => {
    if (profile || currentUser) {
      setFormData({
        username: profile?.username || currentUser?.username || '',
        email: profile?.email || currentUser?.email || '',
        phone_number: profile?.phone_number || currentUser?.phone || '',
        nomor_wa_admin: profile?.nomor_wa_admin || '',
        handles_takeover: profile?.handles_takeover ?? false,
      });
    }
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    if (profile || currentUser) {
      setFormData({
        username: profile?.username || currentUser?.username || '',
        email: profile?.email || currentUser?.email || '',
        phone_number: profile?.phone_number || currentUser?.phone || '',
        nomor_wa_admin: profile?.nomor_wa_admin || '',
        handles_takeover: profile?.handles_takeover ?? false,
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const hasChanges = profile ? (
    formData.username !== (profile.username || '') ||
    formData.email !== (profile.email || '') ||
    formData.phone_number !== (profile.phone_number || '') ||
    formData.nomor_wa_admin !== (profile.nomor_wa_admin || '') ||
    formData.handles_takeover !== (profile.handles_takeover ?? false)
  ) : false;

  const handleSaveProfile = async () => {
    if (formData.username && !/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, underscore (_), or hyphen (-). No spaces allowed.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const payload: UserProfileUpdate = {};
      if (formData.username !== (profile?.username || '')) payload.username = formData.username;
      if (formData.email !== (profile?.email || '')) payload.email = formData.email;
      if (formData.phone_number !== (profile?.phone_number || '')) payload.phone_number = formData.phone_number;
      if (formData.nomor_wa_admin !== (profile?.nomor_wa_admin || '')) payload.nomor_wa_admin = formData.nomor_wa_admin;

      let updated = profile;
      if (Object.keys(payload).length > 0) {
        updated = await updateMyProfile(payload);
      }

      const takeoverChanged = profile ? formData.handles_takeover !== profile.handles_takeover : false;
      if (profile && takeoverChanged) {
        const takeoverRes = await updateTakeoverHandler(profile.id, formData.handles_takeover);
        if (updated) {
          updated = { ...updated, handles_takeover: takeoverRes.handles_takeover };
        }
      }

      if (updated) {
        setProfile(updated);
        updateUser({
          name: updated.username,
          username: updated.username,
          email: updated.email ?? undefined,
          phone: updated.phone_number ?? undefined,
          avatar_url: updated.avatar_url ?? undefined,
        });
      }
      setIsEditing(false);
      showToast({ message: 'Profile updated successfully.', type: 'success' });
    } catch (err: any) {
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          setError(detail.map((d: any) => {
            const field = d.loc && d.loc.length > 1 ? d.loc[d.loc.length - 1] : 'Field';
            return `${field}: ${d.msg}`;
          }).join(', '));
        } else {
          setError(detail);
        }
      } else {
        setError('Unable to update your profile right now.');
      }
      showToast({ message: 'Unable to update your profile right now.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Avatar Handlers
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setAvatarPreviewUrl(url);
      setShowAvatarModal(true);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAvatarConfirm = async (croppedFile: File) => {
    try {
      setIsUploadingAvatar(true);
      const updated = await uploadAvatar(croppedFile);
      setProfile(updated);
      updateUser({
        avatar_url: updated.avatar_url ?? undefined,
      });
      showToast({ message: 'Profile photo updated successfully.', type: 'success' });
      setShowAvatarModal(false);
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
    } catch (err) {
      console.error(err);
      showToast({ message: 'Unable to update profile photo right now.', type: 'error' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarCancel = () => {
    setShowAvatarModal(false);
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setAvatarPreviewUrl(null);
  };

  if (loading) return <div className="py-8 text-center text-gray-500">Loading profile...</div>;
  if (!profile) return <div className="py-8 text-center text-red-500">Failed to load profile.</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Profile Header */}
      <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative group">
            {profile?.avatar_url || currentUser?.avatar_url ? (
              <img
                src={profile?.avatar_url || currentUser?.avatar_url!}
                alt="Avatar"
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover border border-[#d0bfaf]"
              />
            ) : (
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#d85b30] text-xl sm:text-2xl font-black text-white">
                {(currentUser?.name || currentUser?.username || profile?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity hover:opacity-100">
              <span className="text-xs text-white">Edit Photo</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleAvatarFileSelect} 
              />
            </label>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#4b2417]">
              {currentUser?.name || currentUser?.username || profile?.username}
            </h3>
            <p className="text-xs sm:text-sm capitalize text-[#6f5448]">
              {profile?.role_name || (currentUser?.role ? roleLabel(currentUser.role) : (profile?.role_id === 1 ? 'Owner' : profile?.role_id === 2 ? 'Admin' : 'Staff'))}
            </p>
            {profile?.is_active ?? true ? (
              <p className="text-xs sm:text-sm text-green-600 font-semibold">Active</p>
            ) : (
              <p className="text-xs sm:text-sm text-red-600 font-semibold">Inactive</p>
            )}
          </div>
        </div>
      </div>

      {/* Personal Data Section */}
      <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs sm:text-sm font-bold uppercase text-[#6f5448]">Personal Data</h3>
          {!isEditing && (
            <button
              onClick={handleEditClick}
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-[#d85b30] hover:text-[#c04e28]"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>
        
        {error && isEditing && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#4b2417]">Username <span className="text-red-500 ml-0.5">*</span></label>
            <input
              type="text"
              value={isEditing ? formData.username : (profile?.username || currentUser?.username || '')}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              readOnly={!isEditing}
              className={`mt-1 w-full rounded-lg border px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none ${
                isEditing 
                  ? 'border-[#d0bfaf] focus:border-[#d85b30]' 
                  : 'border-transparent bg-gray-50 text-gray-700 focus:border-transparent'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#4b2417]">Email <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span></label>
            <input
              type="email"
              value={isEditing ? formData.email : (profile?.email || currentUser?.email || '')}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              readOnly={!isEditing}
              className={`mt-1 w-full rounded-lg border px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none ${
                isEditing 
                  ? 'border-[#d0bfaf] focus:border-[#d85b30]' 
                  : 'border-transparent bg-gray-50 text-gray-700 focus:border-transparent'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#4b2417]">Phone Number <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span></label>
            <input
              type="tel"
              value={isEditing ? formData.phone_number : (profile?.phone_number || currentUser?.phone || '')}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              readOnly={!isEditing}
              className={`mt-1 w-full rounded-lg border px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none ${
                isEditing 
                  ? 'border-[#d0bfaf] focus:border-[#d85b30]' 
                  : 'border-transparent bg-gray-50 text-gray-700 focus:border-transparent'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#4b2417]">Admin WhatsApp Number <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span></label>
            <input
              type="tel"
              value={isEditing ? formData.nomor_wa_admin : (profile?.nomor_wa_admin || '')}
              onChange={(e) => setFormData({ ...formData, nomor_wa_admin: e.target.value })}
              readOnly={!isEditing}
              placeholder={isEditing ? "Example: +62812..." : ""}
              className={`mt-1 w-full rounded-lg border px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none ${
                isEditing 
                  ? 'border-[#d0bfaf] focus:border-[#d85b30]' 
                  : 'border-transparent bg-gray-50 text-gray-700 focus:border-transparent'
              }`}
            />
          </div>

          {isOwnerUser && (
            <div className="pt-1">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#4b2417] cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isEditing}
                  checked={isEditing ? formData.handles_takeover : (profile?.handles_takeover ?? false)}
                  onChange={(e) => setFormData({ ...formData, handles_takeover: e.target.checked })}
                  className="h-4 w-4 rounded accent-[#d85b30] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                />
                <span>Receives WhatsApp escalations (human takeover)</span>
              </label>
              <p className="mt-1 text-[11px] sm:text-xs text-stone-500 pl-6">
                When enabled, incoming customer escalations and takeover requests on WhatsApp will be routed to your Admin WhatsApp Number.
              </p>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 border-t border-gray-200 pt-4 sm:pt-6">
            <button
              onClick={handleCancelClick}
              disabled={saving}
              className="w-full sm:w-auto rounded-lg border border-gray-300 px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving || !hasChanges}
              className="w-full sm:w-auto rounded-lg bg-[#d85b30] px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Avatar Edit Modal */}
      {showAvatarModal && avatarPreviewUrl && (
        <ImageCropper
          imageSrc={avatarPreviewUrl}
          title={t('profile.change_avatar_title', 'Ubah Foto Profil')}
          cropShape="round"
          aspectRatio={1}
          onCrop={handleAvatarConfirm}
          onCancel={handleAvatarCancel}
          isUploading={isUploadingAvatar}
        />
      )}
    </div>
  );
}

// ============================================================
// TAB 2: SECURITY (PASSWORD & SECURITY)
// ============================================================

function SecurityTab() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleEditPasswordClick = () => {
    setPasswordData({ current: '', new: '', confirm: '' });
    setPasswordError(null);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setIsEditingPassword(true);
  };

  const handleCancelPasswordClick = () => {
    setPasswordData({ current: '', new: '', confirm: '' });
    setPasswordError(null);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setIsEditingPassword(false);
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.current) {
      setPasswordError(t('settings.error_current_password_required', 'Current password is required'));
      return;
    }
    if (passwordData.new.length < 8) {
      setPasswordError(t('settings.error_new_password_min_length', 'New password must be at least 8 characters'));
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError(t('settings.error_passwords_not_match', 'Passwords do not match'));
      return;
    }
    
    try {
      setSavingPassword(true);
      setPasswordError(null);
      await changeMyPassword({
        old_password: passwordData.current,
        new_password: passwordData.new,
      });
      showToast({ message: t('settings.password_updated_success', 'Password updated successfully.'), type: 'success' });
      setPasswordData({ current: '', new: '', confirm: '' });
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setIsEditingPassword(false);
    } catch (err) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      if (axiosError.response?.data?.detail) {
        setPasswordError(axiosError.response.data.detail);
      } else {
        setPasswordError(t('settings.error_update_password', 'Failed to update password.'));
      }
      showToast({ message: t('settings.error_update_password_toast', 'Unable to update password right now.'), type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase text-[#6f5448]">Password & Security</h3>
            <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-[#8b7166]">
              Change your account password to keep your account secure.
            </p>
          </div>
          {!isEditingPassword && (
            <button
              type="button"
              onClick={handleEditPasswordClick}
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-[#d85b30] hover:text-[#c04e28] shrink-0"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        {passwordError && isEditingPassword && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700">
            {passwordError}
          </div>
        )}

        {!isEditingPassword ? (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#4b2417]">Password</label>
              <input
                type="text"
                value="••••••••••••"
                readOnly
                className="mt-1 w-full rounded-lg border border-transparent bg-gray-50 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 outline-none focus:border-transparent"
              />
            </div>
            <div className="pt-1">
              <Link
                to={ROUTES.AUTH_SELLER_FORGOT_PASSWORD}
                className="text-xs font-medium text-[#d85b30] hover:underline inline-flex items-center gap-1"
              >
                {t('settings.forgot_old_password', 'Forgot old password?')}
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-semibold text-[#4b2417]">Current Password <span className="text-red-500 ml-0.5">*</span></label>
                  <Link
                    to={ROUTES.AUTH_SELLER_FORGOT_PASSWORD}
                    className="text-[11px] sm:text-xs font-medium text-[#d85b30] hover:underline"
                  >
                    {t('settings.forgot_old_password', 'Forgot old password?')}
                  </Link>
                </div>
                <div className="relative mt-1">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={passwordData.current}
                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full rounded-lg border border-[#d0bfaf] px-3 sm:px-4 py-2 pr-10 text-xs sm:text-sm outline-none focus:border-[#d85b30]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166]"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#4b2417]">New Password <span className="text-red-500 ml-0.5">*</span></label>
                <div className="relative mt-1">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                    placeholder="Min. 8 characters"
                    minLength={8}
                    className="w-full rounded-lg border border-[#d0bfaf] px-3 sm:px-4 py-2 pr-10 text-xs sm:text-sm outline-none focus:border-[#d85b30]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166]"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#4b2417]">Confirm New Password <span className="text-red-500 ml-0.5">*</span></label>
                <div className="relative mt-1">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    placeholder="Repeat new password"
                    minLength={8}
                    className="w-full rounded-lg border border-[#d0bfaf] px-3 sm:px-4 py-2 pr-10 text-xs sm:text-sm outline-none focus:border-[#d85b30]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166]"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 border-t border-gray-200 pt-4 sm:pt-6">
              <button
                type="button"
                onClick={handleCancelPasswordClick}
                disabled={savingPassword}
                className="w-full sm:w-auto rounded-lg border border-gray-300 px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdatePassword}
                disabled={savingPassword || !passwordData.current || !passwordData.new || !passwordData.confirm}
                className="w-full sm:w-auto rounded-lg bg-[#d85b30] px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingPassword ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TAB 3: USERS (with add/edit modal)
// ============================================================

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void> | void;
  initialData?: UserProfile | null;
}

function UserModal({ isOpen, onClose, onSave, initialData }: UserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_number: '',
    role_id: 3,
    handles_takeover: false,
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username,
        email: initialData.email || '',
        phone_number: initialData.phone_number || '',
        role_id: initialData.role_id,
        handles_takeover: initialData.handles_takeover,
        password: '',
      });
    } else {
      setFormData({
        username: '',
        email: '',
        phone_number: '',
        role_id: 3,
        handles_takeover: false,
        password: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }
    
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(formData.username)) {
      toast.error('Username can only contain letters, numbers, underscore (_), or hyphen (-). No spaces allowed.');
      return;
    }

    if (!initialData && (!formData.password || formData.password.length < 8)) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (initialData && formData.password && formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(formData);
      onClose();
    } catch {
      // Keep modal open, preserving form data on error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SellerModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit User' : 'Add User'}
      size="lg"
      footer={
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto rounded-lg border border-gray-300 px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={isSubmitting}
            className="w-full sm:w-auto rounded-lg bg-[#d85b30] px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#c04e28] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add User')}
          </button>
        </div>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#4b2417]">
            Username <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.username}
            onChange={e => setFormData({...formData, username: e.target.value})}
            className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:border-[#d85b30]"
            placeholder="johndoe"
          />
        </div>
        
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#4b2417]">
            Email <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:border-[#d85b30]"
            placeholder="johndoe@example.com"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#4b2417]">
            Phone Number <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.phone_number}
            onChange={e => setFormData({...formData, phone_number: e.target.value})}
            className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:border-[#d85b30]"
            placeholder="628123456789"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#4b2417]">
            Role <span className="text-red-500 ml-0.5">*</span>
          </label>
          <select
            value={formData.role_id}
            onChange={e => setFormData({...formData, role_id: Number(e.target.value)})}
            className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:border-[#d85b30]"
          >
            <option value={2}>Admin</option>
            <option value={3}>Staff</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#4b2417]">
          <input
            type="checkbox"
            checked={formData.handles_takeover}
            onChange={e => setFormData({...formData, handles_takeover: e.target.checked})}
            className="h-4 w-4 accent-[#d85b30]"
          />
          Receives WhatsApp escalations (human takeover)
        </label>

        {!initialData && (
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#4b2417]">
              Password <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                minLength={8}
                className="w-full rounded-lg border border-[#d0bfaf] px-3 sm:px-4 py-2 pr-10 text-xs sm:text-sm outline-none focus:border-[#d85b30]"
                placeholder="Enter password (min. 8 characters)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </form>
    </SellerModal>  );
}

function UsersTab() {
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.role === 'owner';
  const canManageUsers = isOwner;

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [userSortBy, setUserSortBy] = useState('name_asc');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    if (toastMessage) {
      showToast({ message: toastMessage, type: 'success' });
      setToastMessage('');
    }
  }, [toastMessage, showToast]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users (Endpoint might not be available)", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const result = users.filter((u) => {
      const matchSearch =
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone_number && u.phone_number.includes(searchQuery)) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
      let targetRoleId = 0;
      if (filterRole === 'owner') targetRoleId = 1;
      if (filterRole === 'admin') targetRoleId = 2;
      if (filterRole === 'staff') targetRoleId = 3;
      const matchRole = filterRole === 'all' || filterRole === 'All roles' || u.role_id === targetRoleId;
      return matchSearch && matchRole;
    });

    switch (userSortBy) {
      case 'name_asc':
        result.sort((a, b) => a.username.localeCompare(b.username));
        break;
      case 'name_desc':
        result.sort((a, b) => b.username.localeCompare(a.username));
        break;
      case 'role_asc':
        result.sort((a, b) => (a.role_id || 0) - (b.role_id || 0));
        break;
      case 'role_desc':
        result.sort((a, b) => (b.role_id || 0) - (a.role_id || 0));
        break;
      case 'newest':
        result.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
        break;
      case 'oldest':
        result.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
        break;
      default:
        break;
    }

    return result;
  }, [users, searchQuery, filterRole, userSortBy]);

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <span className="text-xs font-semibold text-green-600">Active</span>;
    }
    return <span className="text-xs font-semibold text-red-600">Inactive</span>;
  };

  const extractErrorMessage = (error: any, defaultMsg: string) => {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (Array.isArray(detail)) {
        // Validation error from FastAPI
        return detail.map((d: any) => {
          const field = d.loc && d.loc.length > 1 ? d.loc[d.loc.length - 1] : 'Field';
          return `${field}: ${d.msg}`;
        }).join('\n');
      }
      return detail;
    }
    return defaultMsg;
  };

  const handleAddUser = async (data: any) => {
    try {
      await addUser(data);
      await loadUsers(); // Refetch data
      showToast({ message: 'User successfully added!', type: 'success' });
      closeModal();
    } catch (error: any) {
      showToast({ message: extractErrorMessage(error, 'Failed to add user.'), type: 'error' });
      throw error;
    }
  };

  const handleEditUser = async (data: any) => {
    if (!editingUser) return;
    try {
      const updated = await updateUser(editingUser.id, data);
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
      showToast({ message: 'User successfully updated!', type: 'success' });
      closeModal();
    } catch (error: any) {
      showToast({ message: extractErrorMessage(error, 'Failed to update user.'), type: 'error' });
      throw error;
    }
  };

  const [userToDeleteId, setUserToDeleteId] = useState<number | null>(null);

  const confirmDeleteUser = async () => {
    if (!userToDeleteId) return;
    const id = userToDeleteId;
    setUserToDeleteId(null);
    try {
      await deleteUser(id);
      setUsers(users.filter((u) => u.id !== id));
      showToast({ message: 'User deleted successfully.', type: 'success' });
    } catch (error: any) {
      showToast({ message: extractErrorMessage(error, 'Failed to delete user.'), type: 'error' });
    }
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  if (loading) return <div className="py-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 rounded-xl bg-white p-2.5 sm:p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#8b7166]" />
            <input
              type="text"
              placeholder="Search name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#d0bfaf] py-1.5 sm:py-2 pl-8 sm:pl-9 pr-2 sm:pr-4 text-xs sm:text-sm outline-none focus:border-[#d85b30]"
            />
          </div>
          {canManageUsers && (
            <button
              type="button"
              onClick={openAddModal}
              className="sm:hidden shrink-0 flex items-center gap-1 rounded-lg bg-[#d85b30] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#c04e28] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add User</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:items-center sm:gap-2.5 shrink-0">
          <SellerSortDropdown
            id="users-sort"
            value={userSortBy}
            onChange={(val) => setUserSortBy(val)}
            options={[
              { label: 'Name: A-Z', value: 'name_asc' },
              { label: 'Name: Z-A', value: 'name_desc' },
              { label: 'Role: Owner to Staff', value: 'role_asc' },
              { label: 'Role: Staff to Owner', value: 'role_desc' },
              { label: 'Newest', value: 'newest' },
              { label: 'Oldest', value: 'oldest' },
            ]}
            align="left"
            ariaLabel="Sort users"
            className="w-full [&>div]:w-full [&>div>button]:w-full sm:w-auto sm:[&>div]:w-auto sm:[&>div>button]:w-auto"
          />
          <SellerFilterDropdown
            id="users-role-filter"
            value={filterRole}
            onChange={(val) => setFilterRole(val)}
            options={[
              { label: 'All roles', value: 'all' },
              { label: 'Owner', value: 'owner' },
              { label: 'Admin', value: 'admin' },
              { label: 'Staff', value: 'staff' },
            ]}
            align="right"
            ariaLabel="Filter users by role"
            className="w-full [&>div]:w-full [&>div>button]:w-full sm:w-auto sm:[&>div]:w-auto sm:[&>div>button]:w-auto"
          />
          {canManageUsers && (
            <button
              type="button"
              onClick={openAddModal}
              className="hidden sm:flex shrink-0 items-center gap-1.5 rounded-lg bg-[#d85b30] px-3.5 sm:px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add User</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {filteredUsers.length === 0 ? (
           <div className="py-8 text-center text-gray-500">No users found.</div>
        ) : filteredUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-white p-3.5 sm:p-4 shadow-sm border border-gray-100/80"
          >
            {/* Left info block */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-[#f3e2d7] text-xs sm:text-sm font-black text-[#4b2417] uppercase">
                {user.username.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-[#4b2417] truncate">{user.username}</p>
                  <span className="shrink-0">{getStatusBadge(user.is_active)}</span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#6f5448] truncate block mt-0.5">
                  @{user.username} · {user.phone_number}
                  {user.email && <span className="ml-1 sm:ml-1.5">· {user.email}</span>}
                </p>
              </div>
            </div>

            {/* Right actions block (permanently anchored) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="rounded bg-[#f3e2d7] px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold capitalize text-[#4b2417]">
                {user.role_id === 1 ? 'Owner' : user.role_id === 2 ? 'Admin' : 'Staff'}
              </span>
              {canManageUsers && user.role_id !== 1 && (
                <>
                  <button
                    onClick={() => openEditModal(user)}
                    aria-label={`Edit ${user.username}`}
                    className="rounded p-1 text-[#6f5448] hover:bg-gray-100 transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={() => setUserToDeleteId(user.id)}
                    aria-label={`Delete ${user.username}`}
                    className="rounded p-1 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <UserModal
        isOpen={showModal}
        onClose={closeModal}
        onSave={editingUser ? handleEditUser : handleAddUser}
        initialData={editingUser}
      />

      <ConfirmationModal
        isOpen={userToDeleteId !== null}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={confirmDeleteUser}
        onCancel={() => setUserToDeleteId(null)}
      />
    </div>
  );
}

// ============================================================
// TAB 4: WHATSAPP
// ============================================================

function WhatsAppTab() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.role === 'owner';

  // Chatbot Status State
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const { whatsappNumberDisplay, refetch: refetchWhatsAppNumber } = useWhatsApp();
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const [isResetting, setIsResetting] = useState(false);
  const [isPreparingQr, setIsPreparingQr] = useState(false);
  
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  
  const [showConfirm, setShowConfirm] = useState(false);

  // Owner Phone State
  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);
  const [isEditingOwnerPhone, setIsEditingOwnerPhone] = useState(false);
  const [ownerPhoneInput, setOwnerPhoneInput] = useState('');
  const [isSavingOwnerPhone, setIsSavingOwnerPhone] = useState(false);
  const [ownerPhoneError, setOwnerPhoneError] = useState<string | null>(null);

  const { showToast } = useToast();

  // Load Owner Profile
  const loadOwnerProfile = async () => {
    try {
      const data = await getMyProfile();
      setOwnerProfile(data);
      setOwnerPhoneInput(data.phone_number || '');
    } catch (err) {
      console.error("Failed to load owner profile", err);
    }
  };

  useEffect(() => {
    if (isOwner) {
      loadOwnerProfile();
    }
  }, [isOwner]);

  // Chatbot Status Polling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isActive = true;

    const fetchStatus = async () => {
      try {
        const data = await getWhatsAppStatus();
        if (!isActive) return;
        setStatus(data);
        setErrorStatus(null);
        
        // Clear preparing state if connected
        if (data.keadaan === 'tersambung') {
          setIsPreparingQr(false);
        }
      } catch (err: any) {
        if (!isActive) return;
        if (err.response?.status === 503) {
          setErrorStatus(t('whatsapp.qr_unavailable', 'WhatsApp service is unavailable'));
        } else if (err.response?.status === 403) {
          setErrorStatus(t('common.error', 'An error occurred'));
        } else {
          setErrorStatus(t('whatsapp.error_retry', 'Error connecting to WhatsApp. Retrying...'));
        }
      } finally {
        if (isActive) {
          setLoadingStatus(false);
          timeoutId = setTimeout(fetchStatus, 3000);
        }
      }
    };

    fetchStatus();

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [t]);

  // Handle Object URL cleanup
  useEffect(() => {
    return () => {
      if (qrUrl) {
        URL.revokeObjectURL(qrUrl);
      }
    };
  }, [qrUrl]);

  // QR Polling for Owner when menunggu_scan
  useEffect(() => {
    if (!isOwner) return;
    
    if (status?.keadaan !== 'menunggu_scan') {
      setQrUrl(null);
      setQrError(null);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let isActive = true;

    const fetchQr = async () => {
      try {
        const blob = await getWhatsAppQr();
        if (!isActive) return;
        
        const url = URL.createObjectURL(blob);
        setQrUrl((prevUrl) => {
          if (prevUrl) URL.revokeObjectURL(prevUrl);
          return url;
        });
        setQrError(null);
        setIsPreparingQr(false); // QR is ready
        
        if (isActive) {
          timeoutId = setTimeout(fetchQr, 5000);
        }
      } catch (err: any) {
        if (!isActive) return;
        
        if (err.response?.status === 404) {
          // QR not ready yet, continue polling
          timeoutId = setTimeout(fetchQr, 5000);
        } else if (err.response?.status === 503) {
          // Service unavailable, stop polling
          setQrError(t('whatsapp.qr_unavailable', 'WhatsApp service is unavailable'));
          setIsPreparingQr(false);
        } else if (err.response?.status === 403) {
          setQrError(t('common.error', 'An error occurred'));
          setIsPreparingQr(false);
        } else {
          timeoutId = setTimeout(fetchQr, 5000);
        }
      }
    };

    fetchQr();

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [status?.keadaan, isOwner, t]);


  const handleResetChatbot = async () => {
    setShowConfirm(false);
    try {
      setIsResetting(true);
      setQrError(null);
      await resetWhatsAppNumber();
      await refetchWhatsAppNumber();
      setIsPreparingQr(true);
      // Optimistic update
      setStatus((prev) => prev ? { ...prev, keadaan: 'terputus' } : null);
      showToast({ message: t('whatsapp.qr_instruction', 'Number reset successfully'), type: 'success' });
    } catch (err: any) {
      showToast({ message: t('whatsapp.error_retry', 'Error connecting to WhatsApp. Retrying...'), type: 'error' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveOwnerPhone = async () => {
    try {
      setIsSavingOwnerPhone(true);
      setOwnerPhoneError(null);
      const updated = await updateMyProfile({ phone_number: ownerPhoneInput });
      invalidatePublicContactCache();
      setOwnerProfile(updated);
      setIsEditingOwnerPhone(false);
      showToast({ message: t('whatsapp.owner_updated_success', 'Owner number updated successfully'), type: 'success' });
    } catch (err: any) {
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          setOwnerPhoneError(detail.map((d: any) => d.msg).join(', '));
        } else {
          setOwnerPhoneError(detail);
        }
      } else {
        setOwnerPhoneError(t('common.error', 'An error occurred'));
      }
    } finally {
      setIsSavingOwnerPhone(false);
    }
  };

  const isDisconnectedNormal = status?.keadaan === 'terputus' && !isPreparingQr && !isResetting;
  const isPreparing = isResetting || isPreparingQr || (status?.keadaan === 'menunggu_scan' && !qrUrl && !qrError && isOwner);

  if (loadingStatus && !status) {
    return <div className="py-8 text-center text-gray-500">{t('whatsapp.status_preparing_qr', 'Preparing WhatsApp...')}</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: CHATBOT WHATSAPP */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-bold uppercase text-[#6f5448]">{t('whatsapp.chatbot_section_title', 'WhatsApp Chatbot')}</h3>
        
        {errorStatus && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorStatus}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {status?.keadaan === 'tersambung' && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-green-800">{t('whatsapp.status_connected', 'Connected')}</h4>
                  <p className="text-sm text-green-700">{t('whatsapp.chatbot_phone', 'Chatbot WhatsApp Number')}: {whatsappNumberDisplay || '—'}</p>
                  <p className="text-sm text-green-700">{t('whatsapp.profile_name', 'Profile')}: {status.profile_name || '—'}</p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={isResetting || isPreparingQr}
                    className="shrink-0 rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-50"
                  >
                    {t('whatsapp.change_chatbot_number', 'Change Chatbot Number')}
                  </button>
                )}
              </div>
            </div>
          )}

          {isDisconnectedNormal && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-yellow-800">{t('whatsapp.status_disconnected', 'Disconnected')}</h4>
                  <p className="text-sm text-yellow-700">{t('whatsapp.chatbot_unavailable', 'Chatbot is currently unavailable')}</p>
                </div>
                {isOwner && (
                  <button
                    onClick={handleResetChatbot}
                    disabled={isResetting}
                    className="rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-50"
                  >
                    {t('whatsapp.show_qr', 'Show QR Code')}
                  </button>
                )}
              </div>
            </div>
          )}

          {isPreparing && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
              <p className="font-semibold text-blue-800">{t('whatsapp.status_preparing_qr', 'Preparing QR Code...')}</p>
            </div>
          )}

          {status?.keadaan === 'menunggu_scan' && !isPreparingQr && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center flex flex-col items-center">
              <h4 className="mb-2 font-bold text-yellow-800">{t('whatsapp.status_waiting_scan', 'Waiting for Scan')}</h4>
              
              {qrError && isOwner && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {qrError}
                </div>
              )}
              
              {isOwner && qrUrl && (
                <>
                  <p className="mb-4 text-sm text-yellow-700">
                    {t('whatsapp.qr_instruction', 'Please scan the QR code below to connect your WhatsApp number.')}
                  </p>
                  <div className="bg-white p-4 rounded-xl shadow-sm inline-block">
                    <img src={qrUrl} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: OWNER WHATSAPP */}
      {isOwner && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase text-[#6f5448]">{t('whatsapp.owner_section_title', 'Owner WhatsApp')}</h3>
          
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#4b2417]">{t('whatsapp.owner_phone', 'Owner WhatsApp Number')}</p>
                <p className="text-sm text-gray-700 mt-1">{ownerProfile?.phone_number || '—'}</p>
                
                <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                  <span className="flex items-center justify-center bg-green-100 text-green-700 rounded-full h-5 w-5">✓</span>
                  <span className="font-semibold">{t('whatsapp.registered_owner', 'Registered Owner')}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('whatsapp.owner_recognition_info', 'Messages from this registered Owner number can be recognized by the chatbot as Owner.')}
                </p>
              </div>
              
              <button
                onClick={() => setIsEditingOwnerPhone(true)}
                className="shrink-0 rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm font-semibold text-[#d85b30] hover:bg-gray-50"
              >
                {t('whatsapp.change_owner_number', 'Change Owner Number')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <ConfirmationModal
        isOpen={showConfirm}
        title={t('whatsapp.confirm_change_chatbot_title', 'Confirm Change Chatbot Number')}
        message={t('whatsapp.confirm_change_chatbot_desc', 'Are you sure you want to change the WhatsApp number? This will disconnect the current number.')}
        confirmText={t('whatsapp.btn_yes_change', 'Yes, Change Number')}
        cancelText={t('whatsapp.btn_cancel', 'Cancel')}
        onConfirm={handleResetChatbot}
        onCancel={() => setShowConfirm(false)}
        isDestructive={false}
      />
      
      {/* OWNER PHONE EDIT MODAL */}
      <SellerModal
        isOpen={isEditingOwnerPhone}
        onClose={() => {
          setIsEditingOwnerPhone(false);
          setOwnerPhoneInput(ownerProfile?.phone_number || '');
          setOwnerPhoneError(null);
        }}
        title={t('whatsapp.change_owner_number', 'Change Owner Number')}
        size="md"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button
              onClick={() => {
                setIsEditingOwnerPhone(false);
                setOwnerPhoneInput(ownerProfile?.phone_number || '');
                setOwnerPhoneError(null);
              }}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t('whatsapp.btn_cancel', 'Cancel')}
            </button>
            <button
              onClick={handleSaveOwnerPhone}
              disabled={isSavingOwnerPhone}
              className="rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-50"
            >
              {isSavingOwnerPhone ? '...' : t('whatsapp.save', 'Save')}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {ownerPhoneError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {ownerPhoneError}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-[#4b2417] mb-1">
              {t('whatsapp.owner_phone', 'Owner WhatsApp Number')}
            </label>
            <input
              type="tel"
              value={ownerPhoneInput}
              onChange={(e) => setOwnerPhoneInput(e.target.value)}
              placeholder="e.g., 628123456789"
              className="w-full rounded-lg border border-[#d0bfaf] px-4 py-2 outline-none focus:border-[#d85b30]"
            />
          </div>
          <p className="text-xs text-gray-500">
             {t('whatsapp.owner_recognition_info', 'Messages from this registered Owner number can be recognized by the chatbot as Owner.')}
          </p>
        </div>
      </SellerModal>

    </div>
  );
}

// ============================================================
// TAB 4: EMAIL SENDER (OWNER ONLY)
// ============================================================

function EmailSenderTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fromName, setFromName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [initialFromName, setInitialFromName] = useState('');
  const [initialFromEmail, setInitialFromEmail] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await getEmailSenderSettings();
        if (ignore) return;
        const name = data.from_name || '';
        const email = data.from_email || '';
        setFromName(name);
        setFromEmail(email);
        setInitialFromName(name);
        setInitialFromEmail(email);
        setUpdatedAt(data.updated_at || null);
      } catch (err: any) {
        if (ignore) return;
        console.error('Failed to load email sender settings:', err);
        if (err.response?.status === 403) {
          toast.error('Permission denied. Only Owner can modify email sender settings.');
        } else if (err.response?.status === 503) {
          toast.error('Email delivery service is currently not configured or unavailable.');
        } else {
          toast.error(err.response?.data?.detail || 'Failed to load email sender settings.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadSettings();
    return () => { ignore = true; };
  }, []);

  const isDirty = fromName.trim() !== initialFromName || fromEmail.trim() !== initialFromEmail;

  const handleCancel = () => {
    setFromName(initialFromName);
    setFromEmail(initialFromEmail);
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = fromName.trim();
    const trimmedEmail = fromEmail.trim();

    if (!trimmedName || !trimmedEmail) {
      toast.error('From Name and From Email are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    try {
      setSaving(true);
      const updated = await updateEmailSenderSettings({
        from_name: trimmedName,
        from_email: trimmedEmail,
      });
      setFromName(updated.from_name);
      setFromEmail(updated.from_email);
      setInitialFromName(updated.from_name);
      setInitialFromEmail(updated.from_email);
      setUpdatedAt(updated.updated_at || new Date().toISOString());
      setIsEditing(false);
      toast.success('Email sender settings updated successfully.');
    } catch (err: any) {
      console.error('Failed to update email sender settings:', err);
      if (err.response?.status === 429) {
        toast.error('Rate limit reached. You can only update email sender settings up to 5 times per minute.');
      } else if (err.response?.status === 403) {
        toast.error('Permission denied. Only Owner can modify email sender settings.');
      } else if (err.response?.status === 503) {
        toast.error('Email delivery service is currently not configured or unavailable.');
      } else {
        const detail = err.response?.data?.detail;
        if (Array.isArray(detail)) {
          const errorMsg = detail
            .map((d: any) => {
              if (typeof d === 'string') return d;
              const field = d.loc && d.loc.length > 0 ? d.loc[d.loc.length - 1] : '';
              return field && field !== 'body' ? `${field}: ${d.msg}` : (d.msg || JSON.stringify(d));
            })
            .join(', ');
          toast.error(errorMsg || 'Failed to update email sender settings.');
        } else if (typeof detail === 'string') {
          toast.error(detail);
        } else {
          toast.error('Failed to update email sender settings.');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading email sender settings...</div>;
  }

  // ------------------------------------------------------------
  // VIEW MODE: Tampilan Informasi Aktif Pengirim Email
  // ------------------------------------------------------------
  if (!isEditing) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#4b2417]">Store Email Sender</h2>
              {initialFromEmail ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Check className="h-3 w-3 text-emerald-600" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  <AlertCircle className="h-3 w-3 text-amber-600" />
                  Not Configured
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[#6f5448]">
              Used as the official sender identity for automated customer emails (order confirmations, payment invoices, and password resets).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-[#d0bfaf] bg-white px-4 py-2 text-sm font-semibold text-[#d85b30] shadow-xs hover:bg-[#fff7f2] hover:border-[#d85b30] transition self-start sm:self-auto"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
        </div>

        <div className="max-w-xl space-y-5">
          <div className="rounded-xl border border-[#d0bfaf]/60 bg-[#fbf9f8] p-5 space-y-4 shadow-xs">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-[#6f5448]">From Name</span>
              <p className="mt-1 text-base font-semibold text-[#4b2417]">{fromName || '—'}</p>
              <p className="mt-0.5 text-xs text-gray-500">Sender display name shown in customer email inboxes.</p>
            </div>

            <div className="border-t border-[#d0bfaf]/40 pt-4">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#6f5448]">From Email</span>
              <div className="mt-1">
                {fromEmail ? (
                  <p className="text-base font-semibold text-[#4b2417] flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#d85b30]" />
                    {fromEmail}
                  </p>
                ) : (
                  <p className="text-sm italic text-stone-500">
                    Not configured yet
                  </p>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-500">Sender address in the From header.</p>
            </div>

            {fromEmail && (
              <div className="border-t border-[#d0bfaf]/40 pt-4">
                <span className="block text-xs font-bold uppercase tracking-wider text-[#6f5448]">Customer Inbox Preview</span>
                <div className="mt-2 rounded-lg border border-stone-200 bg-white p-3 text-xs text-stone-700 font-mono space-y-1 shadow-xs">
                  <p><span className="text-stone-400">From:</span> <span className="font-semibold text-stone-900">{fromName || 'Store'}</span> &lt;{fromEmail}&gt;</p>
                  <p><span className="text-stone-400">Subject:</span> Order Confirmation #TC-1024</p>
                </div>
              </div>
            )}

            {updatedAt && (
              <div className="border-t border-[#d0bfaf]/40 pt-3 text-xs text-gray-500">
                Last updated: {new Date(updatedAt).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // EDIT MODE: Formulir Pengubahan Pengirim Email Toko
  // ------------------------------------------------------------
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#4b2417]">Edit Store Email Sender</h2>
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved Changes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                Editing
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#6f5448]">
            Configure the sender name and email address displayed on outgoing notifications and invoices.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCancel}
          disabled={saving}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 transition self-start sm:self-auto"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#4b2417] mb-1">
            From Name <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={100}
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="e.g. Toti Cakery"
            className="w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            disabled={saving}
          />
          <p className="mt-1 text-xs text-gray-500">Sender display name shown in customer email inboxes.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#4b2417] mb-1">
            From Email <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="email"
            required
            minLength={6}
            maxLength={255}
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="e.g. orders@toticakery.com"
            className="w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            disabled={saving}
          />
          <p className="mt-1 text-xs text-gray-500">
            Sender address in From header. Address/domain must be verified with your email provider before sending.
          </p>
        </div>

        <div className="space-y-1">
          {updatedAt && (
            <p className="text-xs text-gray-500">
              Last updated: {new Date(updatedAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          )}
          <p className="text-[11px] text-gray-400">
            Rate limit: Max. 5 updates per minute. SMTP credentials remain securely configured on server.
          </p>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving || !isDirty}
            className={`flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition shadow-sm ${
              !isDirty
                ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                : 'bg-[#B64827] text-white hover:bg-[#9c3c1e]'
            }`}
          >
            {!isDirty && !saving ? (
              <>
                <Check className="h-4 w-4 text-stone-500" />
                All Changes Saved
              </>
            ) : saving ? (
              'Saving...'
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// TAB 5: STORE CUSTOMIZATION (OWNER ONLY)
// ============================================================

function isGoogleMapsEmbedUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === 'www.google.com' &&
      parsed.pathname === '/maps/embed' &&
      Boolean(parsed.search) &&
      !parsed.hash
    );
  } catch {
    return false;
  }
}

interface StoreCustomizationFormState {
  heroImageUrl: string;
  storeAddress: string;
  mapsEmbedUrl: string;
  contentId: {
    hero_title: string;
    hero_subtitle: string;
    about_title: string;
    about_description: string;
  };
  contentEn: {
    hero_title: string;
    hero_subtitle: string;
    about_title: string;
    about_description: string;
  };
}

interface StoreCustomizationTabProps {
  onDirtyChange?: (isDirty: boolean) => void;
}

function StoreCustomizationTab({ onDirtyChange }: StoreCustomizationTabProps = {}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<'id' | 'en'>('id');

  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [mapsEmbedUrl, setMapsEmbedUrl] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const [contentId, setContentId] = useState({
    hero_title: '',
    hero_subtitle: '',
    about_title: '',
    about_description: '',
  });

  const [contentEn, setContentEn] = useState({
    hero_title: '',
    hero_subtitle: '',
    about_title: '',
    about_description: '',
  });

  const [initialCustomization, setInitialCustomization] = useState<StoreCustomizationFormState | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getStoreCustomization();
        if (ignore) return;
        const initial: StoreCustomizationFormState = {
          heroImageUrl: data.hero_image_url || '',
          storeAddress: data.store_address || '',
          mapsEmbedUrl: data.maps_embed_url || '',
          contentId: {
            hero_title: data.content?.id?.hero_title || '',
            hero_subtitle: data.content?.id?.hero_subtitle || '',
            about_title: data.content?.id?.about_title || '',
            about_description: data.content?.id?.about_description || '',
          },
          contentEn: {
            hero_title: data.content?.en?.hero_title || '',
            hero_subtitle: data.content?.en?.hero_subtitle || '',
            about_title: data.content?.en?.about_title || '',
            about_description: data.content?.en?.about_description || '',
          },
        };
        setHeroImageUrl(initial.heroImageUrl);
        setStoreAddress(initial.storeAddress);
        setMapsEmbedUrl(initial.mapsEmbedUrl);
        setUpdatedAt(data.updated_at || null);
        setContentId(initial.contentId);
        setContentEn(initial.contentEn);
        setInitialCustomization(initial);
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load store customization:', err);
          toast.error('Failed to load store customization settings.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const isDirty = useMemo(() => {
    if (!initialCustomization) return false;
    return (
      heroImageUrl.trim() !== initialCustomization.heroImageUrl.trim() ||
      storeAddress.trim() !== initialCustomization.storeAddress.trim() ||
      mapsEmbedUrl.trim() !== initialCustomization.mapsEmbedUrl.trim() ||
      contentId.hero_title !== initialCustomization.contentId.hero_title ||
      contentId.hero_subtitle !== initialCustomization.contentId.hero_subtitle ||
      contentId.about_title !== initialCustomization.contentId.about_title ||
      contentId.about_description !== initialCustomization.contentId.about_description ||
      contentEn.hero_title !== initialCustomization.contentEn.hero_title ||
      contentEn.hero_subtitle !== initialCustomization.contentEn.hero_subtitle ||
      contentEn.about_title !== initialCustomization.contentEn.about_title ||
      contentEn.about_description !== initialCustomization.contentEn.about_description
    );
  }, [
    initialCustomization,
    heroImageUrl,
    storeAddress,
    mapsEmbedUrl,
    contentId,
    contentEn,
  ]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const handleDiscard = () => {
    if (!initialCustomization) return;
    setHeroImageUrl(initialCustomization.heroImageUrl);
    setStoreAddress(initialCustomization.storeAddress);
    setMapsEmbedUrl(initialCustomization.mapsEmbedUrl);
    setContentId({ ...initialCustomization.contentId });
    setContentEn({ ...initialCustomization.contentEn });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExt = ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

    if (!allowedTypes.includes(file.type) && !validExt) {
      toast.error('Banner format must be JPEG, PNG, or WEBP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Banner file size exceeds 5 MB limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploadingImage(true);
      const res = await uploadHeroImage(file);
      setHeroImageUrl(res.hero_image_url);
      toast.success('Banner uploaded successfully! Click "Save Settings" to publish.');
    } catch (err: any) {
      console.error('Failed to upload hero banner:', err);
      if (err.response?.status === 429) {
        toast.error('Upload rate limit reached (max 5 uploads per minute). Please wait.');
      } else if (err.response?.status === 413) {
        toast.error('Banner file size is too large (max 5 MB).');
      } else {
        toast.error(err.response?.data?.detail || 'Failed to upload banner.');
      }
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalMapsUrl = mapsEmbedUrl.trim();
    const iframeMatch = finalMapsUrl.match(/<iframe.*?src=["']([^"']+)["']/i);
    if (iframeMatch) {
      finalMapsUrl = iframeMatch[1].trim();
      setMapsEmbedUrl(finalMapsUrl);
    }

    if (finalMapsUrl && !isGoogleMapsEmbedUrl(finalMapsUrl)) {
      toast.error('Google Maps must use a valid HTTPS embed URL (https://www.google.com/maps/embed?...).');
      return;
    }

    const payload: StoreCustomizationPatchPayload = {
      content: {
        id: {
          hero_title: contentId.hero_title.trim() || null,
          hero_subtitle: contentId.hero_subtitle.trim() || null,
          about_title: contentId.about_title.trim() || null,
          about_description: contentId.about_description.trim() || null,
        },
        en: {
          hero_title: contentEn.hero_title.trim() || null,
          hero_subtitle: contentEn.hero_subtitle.trim() || null,
          about_title: contentEn.about_title.trim() || null,
          about_description: contentEn.about_description.trim() || null,
        },
      },
      hero_image_url: heroImageUrl.trim() || null,
      store_address: storeAddress.trim() || null,
      maps_embed_url: finalMapsUrl || null,
    };

    try {
      setSaving(true);
      const updated = await updateStoreCustomization(payload);
      const nextSaved: StoreCustomizationFormState = {
        heroImageUrl: updated.hero_image_url || '',
        storeAddress: updated.store_address || '',
        mapsEmbedUrl: updated.maps_embed_url || '',
        contentId: {
          hero_title: updated.content?.id?.hero_title || '',
          hero_subtitle: updated.content?.id?.hero_subtitle || '',
          about_title: updated.content?.id?.about_title || '',
          about_description: updated.content?.id?.about_description || '',
        },
        contentEn: {
          hero_title: updated.content?.en?.hero_title || '',
          hero_subtitle: updated.content?.en?.hero_subtitle || '',
          about_title: updated.content?.en?.about_title || '',
          about_description: updated.content?.en?.about_description || '',
        },
      };
      setHeroImageUrl(nextSaved.heroImageUrl);
      setStoreAddress(nextSaved.storeAddress);
      setMapsEmbedUrl(nextSaved.mapsEmbedUrl);
      setContentId(nextSaved.contentId);
      setContentEn(nextSaved.contentEn);
      setInitialCustomization(nextSaved);
      setUpdatedAt(updated.updated_at);
      toast.success('Store customization settings saved successfully!');
    } catch (err: any) {
      console.error('Failed to update store customization:', err);
      if (err.response?.status === 429) {
        toast.error('Rate limit reached (max 5 updates per minute). Please wait a moment.');
      } else if (err.response?.status === 403) {
        toast.error('Permission denied. Only Owner can modify store customization.');
      } else {
        const detail = err.response?.data?.detail;
        if (Array.isArray(detail)) {
          const errorMsg = detail
            .map((d: any) => {
              if (typeof d === 'string') return d;
              const field = d.loc && d.loc.length > 0 ? d.loc[d.loc.length - 1] : '';
              return field && field !== 'body' ? `${field}: ${d.msg}` : d.msg || JSON.stringify(d);
            })
            .join(', ');
          toast.error(errorMsg || 'Failed to update store customization.');
        } else if (typeof detail === 'string') {
          toast.error(detail);
        } else {
          toast.error('Failed to update store customization.');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading store customization settings...</div>;
  }

  const isMapsValid = !mapsEmbedUrl.trim() || isGoogleMapsEmbedUrl(mapsEmbedUrl.trim());

  return (
    <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h2 className="text-base sm:text-xl font-bold text-[#4b2417] flex items-center gap-2">
              <Store className="h-5 w-5 sm:h-6 sm:w-6 text-[#d85b30] shrink-0" />
              Store Customization (Homepage CMS)
            </h2>
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved Changes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Check className="h-3 w-3 text-emerald-600" />
                Saved
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[#6f5448]">
            Configure the buyer homepage banner, bilingual content (ID/EN), physical address, and Google Maps location.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* BAGIAN 1: HERO BANNER IMAGE */}
        <div className="rounded-xl border border-[#e6d5c5]/80 bg-[#fcf8f5]/70 p-3.5 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#4b2417] flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[#d85b30]" />
                Main Banner (Hero Image)
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                Background image for the homepage hero section.
              </p>
            </div>
            {heroImageUrl && (
              <button
                type="button"
                onClick={() => setHeroImageUrl('')}
                className="rounded-lg border border-red-200 bg-red-50/60 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
              >
                Reset to Default Banner
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-12 md:gap-5 md:items-center">
            <div className="md:col-span-7 relative aspect-[16/7] w-full overflow-hidden rounded-lg border border-[#d0bfaf] bg-gray-100 shadow-inner">
              {heroImageUrl ? (
                <img
                  src={heroImageUrl}
                  alt="Hero Banner Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-gray-400">
                  <ImageIcon className="h-10 w-10 mb-1 opacity-60" />
                  <span className="text-xs font-medium">Using default store banner</span>
                </div>
              )}
            </div>

            <div className="md:col-span-5 space-y-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploadingImage || saving}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage || saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#d85b30] bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-[#d85b30] hover:bg-[#d85b30] hover:text-white transition disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {uploadingImage ? 'Uploading Banner...' : 'Select & Upload Banner'}
              </button>
              <p className="text-[10px] sm:text-[11px] text-gray-500 leading-normal">
                Supported formats: JPEG, PNG, or WEBP (max. 5 MB). Recommended aspect ratio: 16:9 or 21:9 (min. 1280x720px). If cleared, default store banner will be used.
              </p>
            </div>
          </div>
        </div>

        {/* BAGIAN 2: BILINGUAL CONTENT (ID & EN) */}
        <div className="rounded-xl border border-[#e6d5c5]/80 bg-[#fcf8f5]/70 p-3.5 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-[#e6d5c5]/60 pb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#4b2417] flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#d85b30]" />
                Bilingual Text Content
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                Manage Hero and About section copy in both Indonesian and English.
              </p>
            </div>

            {/* Language Switcher Tabs */}
            <div className="flex w-full sm:w-auto rounded-lg bg-[#efe4d6] p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveLangTab('id')}
                className={`flex-1 sm:flex-initial justify-center rounded-md px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  activeLangTab === 'id'
                    ? 'bg-white text-[#d85b30] shadow-sm'
                    : 'text-[#6f5448] hover:text-[#4b2417]'
                }`}
              >
                <span>🇮🇩</span> Indonesian (ID)
              </button>
              <button
                type="button"
                onClick={() => setActiveLangTab('en')}
                className={`flex-1 sm:flex-initial justify-center rounded-md px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  activeLangTab === 'en'
                    ? 'bg-white text-[#d85b30] shadow-sm'
                    : 'text-[#6f5448] hover:text-[#4b2417]'
                }`}
              >
                <span>🇬🇧</span> English (EN)
              </button>
            </div>
          </div>

          {/* ACTIVE LOCALE FORM FIELDS */}
          {activeLangTab === 'id' ? (
            <div className="space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4b2417] mb-1">
                  Hero Title (ID) <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={contentId.hero_title}
                  onChange={(e) => setContentId({ ...contentId, hero_title: e.target.value })}
                  placeholder="Kue Lezat,&#10;Momen Berkesan"
                  className="w-full rounded-lg border border-[#d0bfaf] bg-white px-3 sm:px-3.5 py-2 text-xs sm:text-sm text-[#4b2417] focus:border-[#d85b30] outline-none"
                  disabled={saving}
                />
                <p className="mt-1 text-[11px] text-[#8b7166]">Max. 120 characters. Newline breaks (\n) are supported.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4b2417] mb-1">
                  Hero Subtitle (ID) <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={600}
                  value={contentId.hero_subtitle}
                  onChange={(e) => setContentId({ ...contentId, hero_subtitle: e.target.value })}
                  placeholder="Toti Cakery hadir dengan kue berkualitas, dibuat dari bahan pilihan untuk setiap momen spesial Anda."
                  className="w-full rounded-lg border border-[#d0bfaf] bg-white px-3 sm:px-3.5 py-2 text-xs sm:text-sm text-[#4b2417] focus:border-[#d85b30] outline-none"
                  disabled={saving}
                />
                <p className="mt-1 text-[11px] text-[#8b7166]">Max. 600 characters.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4b2417] mb-1">
                  About Section Title (ID) <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={contentId.about_title}
                  onChange={(e) => setContentId({ ...contentId, about_title: e.target.value })}
                  placeholder="Tentang Toti Cakery"
                  className="w-full rounded-lg border border-[#d0bfaf] bg-white px-3 sm:px-3.5 py-2 text-xs sm:text-sm text-[#4b2417] focus:border-[#d85b30] outline-none"
                  disabled={saving}
                />
                <p className="mt-1 text-[11px] text-[#8b7166]">Max. 120 characters.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4b2417] mb-1">
                  About Description (ID) <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                </label>
                <textarea
                  rows={4}
                  maxLength={3000}
                  value={contentId.about_description}
                  onChange={(e) => setContentId({ ...contentId, about_description: e.target.value })}
                  placeholder="Toti Cakery adalah toko kue rumahan yang berdedikasi menghadirkan kue lezat dengan cita rasa istimewa..."
                  className="w-full rounded-lg border border-[#d0bfaf] bg-white px-3 sm:px-3.5 py-2 text-xs sm:text-sm text-[#4b2417] focus:border-[#d85b30] outline-none"
                  disabled={saving}
                />
                <p className="mt-1 text-[11px] text-[#8b7166]">Max. 3,000 characters. Paragraph formatting and line breaks will be rendered on the homepage.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4b2417] mb-1">
                  Hero Title (EN) <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={contentEn.hero_title}
                  onChange={(e) => setContentEn({ ...contentEn, hero_title: e.target.value })}
                  placeholder="Delicious Cakes,&#10;Memorable Moments"
                  className="w-full rounded-lg border border-[#d0bfaf] bg-white px-3 sm:px-3.5 py-2 text-xs sm:text-sm text-[#4b2417] focus:border-[#d85b30] outline-none"
                  disabled={saving}
                />
                <p className="mt-1 text-[11px] text-[#8b7166]">Max. 120 characters. Newline breaks (\n) are supported.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4b2417] mb-1">
                  Hero Subtitle (EN) <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={600}
                  value={contentEn.hero_subtitle}
                  onChange={(e) => setContentEn({ ...contentEn, hero_subtitle: e.target.value })}
                  placeholder="Toti Cakery is here with quality cakes, made from selected ingredients for your every special moment."
                  className="w-full rounded-lg border border-[#d0bfaf] bg-white px-3 sm:px-3.5 py-2 text-xs sm:text-sm text-[#4b2417] focus:border-[#d85b30] outline-none"
                  disabled={saving}
                />
                <p className="mt-1 text-[11px] text-[#8b7166]">Max. 600 characters.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4b2417] mb-1">
                  About Section Title (EN) <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={contentEn.about_title}
                  onChange={(e) => setContentEn({ ...contentEn, about_title: e.target.value })}
                  placeholder="About Toti Cakery"
                  className="w-full rounded-lg border border-[#d0bfaf] bg-white px-3 sm:px-3.5 py-2 text-xs sm:text-sm text-[#4b2417] focus:border-[#d85b30] outline-none"
                  disabled={saving}
                />
                <p className="mt-1 text-[11px] text-[#8b7166]">Max. 120 characters.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4b2417] mb-1">
                  About Description (EN) <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                </label>
                <textarea
                  rows={4}
                  maxLength={3000}
                  value={contentEn.about_description}
                  onChange={(e) => setContentEn({ ...contentEn, about_description: e.target.value })}
                  placeholder="Toti Cakery is a home bakery dedicated to presenting delicious cakes with a special taste..."
                  className="w-full rounded-lg border border-[#d0bfaf] bg-white px-3 sm:px-3.5 py-2 text-xs sm:text-sm text-[#4b2417] focus:border-[#d85b30] outline-none"
                  disabled={saving}
                />
                <p className="mt-1 text-[11px] text-[#8b7166]">Max. 3,000 characters. Paragraph formatting and line breaks will be rendered on the homepage.</p>
              </div>
            </div>
          )}
        </div>

        {/* BAGIAN 3: ALAMAT & GOOGLE MAPS EMBED */}
        <div className="rounded-xl border border-[#e6d5c5]/80 bg-[#fcf8f5]/70 p-3.5 sm:p-5 space-y-4">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#4b2417] flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#d85b30]" />
              Store Location & Google Maps
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
              Physical address and interactive map embed to help customers easily find your bakery.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4b2417] mb-1">
              Store Address <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              placeholder="e.g. Ruko Mahkota Niaga Blok C No. 5, Batam Center, Batam"
              className="w-full rounded-lg border border-[#d0bfaf] bg-white px-3 sm:px-3.5 py-2 text-xs sm:text-sm text-[#4b2417] focus:border-[#d85b30] outline-none"
              disabled={saving}
            />
            <p className="mt-1 text-[11px] text-[#8b7166]">Max. 500 characters. Leave empty to hide the text address badge.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4b2417] mb-1">
              Google Maps Embed URL <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
            </label>
            <input
              type="url"
              maxLength={2048}
              value={mapsEmbedUrl}
              onChange={(e) => {
                const val = e.target.value;
                const match = val.match(/<iframe.*?src=["']([^"']+)["']/i);
                setMapsEmbedUrl(match ? match[1] : val);
              }}
              placeholder="https://www.google.com/maps/embed?pb=..."
              className={`w-full rounded-lg border bg-white px-3 sm:px-3.5 py-2 text-xs sm:text-sm outline-none transition ${
                mapsEmbedUrl.trim() && !isMapsValid
                  ? 'border-red-400 focus:border-red-500 bg-red-50/50'
                  : 'border-[#d0bfaf] focus:border-[#d85b30] text-[#4b2417]'
              }`}
              disabled={saving}
            />
            
            {mapsEmbedUrl.trim() && !isMapsValid ? (
              <div className="mt-2 flex items-start gap-2 rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Invalid Embed URL Format!</p>
                  <p className="mt-0.5 text-[11px]">
                    URL must begin with <code>https://www.google.com/maps/embed?pb=...</code>. Short links (<code>maps.app.goo.gl</code>) and regular search links cannot be embedded in an iframe.
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-red-800">
                    How to get this: Open Google Maps &rarr; Search for your store &rarr; Click 'Share' &rarr; Select 'Embed a map' &rarr; Copy the URL inside <code>src="..."</code> from the iframe code.
                  </p>
                </div>
              </div>
            ) : mapsEmbedUrl.trim() ? (
              <p className="mt-1 text-[11px] text-green-700 flex items-center gap-1 font-medium">
                <Check className="h-3.5 w-3.5" /> Valid Google Maps Embed URL.
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-[#8b7166]">
                Leave empty to use the default store map location.
              </p>
            )}
          </div>

          {/* MAP LIVE PREVIEW */}
          {mapsEmbedUrl.trim() && isMapsValid && (
            <div className="mt-3 overflow-hidden rounded-lg border border-[#d0bfaf] shadow-sm">
              <div className="bg-[#efe4d6] px-3 py-1.5 text-[11px] font-bold text-[#4b2417] flex items-center justify-between">
                <span>Live Map Preview</span>
                <span className="text-[10px] text-[#9b4a2f]">Google Maps iframe</span>
              </div>
              <div className="h-44 sm:h-56 w-full bg-gray-100">
                <iframe
                  src={mapsEmbedUrl.trim()}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  scrolling="yes"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Store Location Preview"
                />
              </div>
            </div>
          )}
        </div>

        {/* TIMESTAMP & SUBMIT BUTTON */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-100">
          <div>
            {updatedAt ? (
              <p className="text-xs text-gray-500">
                Last updated: {new Date(updatedAt).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            ) : (
              <p className="text-xs text-gray-400">No customization updates recorded yet.</p>
            )}
            <p className="text-[11px] text-gray-400 mt-0.5">Rate limit: Maximum 5 updates per minute.</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {isDirty && !saving && (
              <button
                type="button"
                onClick={handleDiscard}
                className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg justify-center border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 transition"
              >
                Discard
              </button>
            )}
            <button
              type="submit"
              disabled={saving || !isDirty || (Boolean(mapsEmbedUrl.trim()) && !isMapsValid)}
              className={`w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg justify-center transition shadow-sm flex items-center gap-2 ${
                !isDirty
                  ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                  : 'bg-[#B64827] text-white hover:bg-[#9c3c1e]'
              }`}
            >
              {!isDirty && !saving ? (
                <>
                  <Check className="h-4 w-4 text-stone-500" />
                  All Changes Saved
                </>
              ) : saving ? (
                'Saving Changes...'
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// KOMPONEN UTAMA SETTINGS
// ============================================================

type SettingsTab = 'profile' | 'security' | 'users' | 'whatsapp' | 'email_sender' | 'store_customization';

export default function SellerSettingsPage() {
  const { user: currentUser } = useAuth();
  const isStaff = currentUser?.role === 'staff';
  const isOwner = currentUser?.role === 'owner';

  const tabs = useMemo(() => [
    { key: 'profile' as const, label: 'My Profile', icon: User },
    { key: 'security' as const, label: 'Security', icon: Lock },
    ...(isOwner ? [{ key: 'users' as const, label: 'Users', icon: Users }] : []),
    ...(!isStaff ? [{ key: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle }] : []),
    ...(isOwner ? [{ key: 'email_sender' as const, label: 'Email Sender', icon: Mail }] : []),
    ...(isOwner ? [{ key: 'store_customization' as const, label: 'Store Customization', icon: Store }] : []),
  ], [isOwner, isStaff]);

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isStoreCustomizationDirty, setIsStoreCustomizationDirty] = useState(false);

  const handleTabChange = (targetKey: SettingsTab) => {
    if (activeTab === 'store_customization' && targetKey !== 'store_customization' && isStoreCustomizationDirty) {
      const confirmLeave = window.confirm(
        'You have unsaved changes in Store Customization. Are you sure you want to leave without saving?'
      );
      if (!confirmLeave) return;
      setIsStoreCustomizationDirty(false);
    }
    setActiveTab(targetKey);
  };
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = tabsContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => checkScroll());
      ro.observe(el);
      Array.from(el.children).forEach((child) => ro?.observe(child));
    }

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      ro?.disconnect();
    };
  }, [checkScroll, tabs]);

  const scrollTabs = (direction: 'left' | 'right') => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -150 : 150;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your store profile, team members, and account settings."
      />

      <div className="relative group">
        {/* Left scroll chevron */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[#4b2417] shadow-md border border-gray-200 transition-all hover:bg-white active:scale-95"
            aria-label="Scroll tabs left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Left edge fade gradient */}
        {canScrollLeft && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent z-[5] rounded-l-xl" />
        )}

        {/* Tab container */}
        <div
          ref={tabsContainerRef}
          className="flex overflow-x-auto no-scrollbar gap-1 sm:gap-2 rounded-xl bg-white p-2 shadow-sm scroll-smooth"
        >
          {tabs.map((tab) => (
            <TabButton
              key={tab.key}
              label={tab.label}
              icon={tab.icon}
              isActive={activeTab === tab.key}
              onClick={() => handleTabChange(tab.key)}
            />
          ))}
        </div>

        {/* Right edge fade gradient */}
        {canScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-[5] rounded-r-xl" />
        )}

        {/* Right scroll chevron */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[#4b2417] shadow-md border border-gray-200 transition-all hover:bg-white active:scale-95"
            aria-label="Scroll tabs right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <div>
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'users' && isOwner && <UsersTab />}
        {activeTab === 'whatsapp' && !isStaff && <WhatsAppTab />}
        {activeTab === 'email_sender' && isOwner && <EmailSenderTab />}
        {activeTab === 'store_customization' && isOwner && (
          <StoreCustomizationTab onDirtyChange={setIsStoreCustomizationDirty} />
        )}
      </div>
    </div>
  );
}
