// src/pages/seller/SellerSettingsPage.tsx

import { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Users,
  Edit,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Plus,
  X,
} from 'lucide-react';
import {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  uploadAvatar,
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  type UserProfile,
} from '@/services/sellerSettingsService';
import { useAuth } from '@/hooks/useAuth';
import type React from 'react';

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
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition border-b-2 ${
        isActive
          ? 'border-[#d85b30] text-[#d85b30]'
          : 'border-transparent text-[#6f5448] hover:text-[#4b2417]'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// ============================================================
// TAB 1: PROFIL
// ============================================================

function ProfileTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_number: '',
    nomor_wa_admin: '',
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyProfile();
      setProfile(data);
      setFormData({
        username: data.username || '',
        email: data.email || '',
        phone_number: data.phone_number || '',
        nomor_wa_admin: data.nomor_wa_admin || '',
      });
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat profil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (formData.username && !/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      setError('Username hanya boleh menggunakan huruf, angka, underscore (_), atau tanda hubung (-). Tidak boleh ada spasi.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const payload = {
        username: formData.username || undefined,
        email: formData.email || undefined,
        phone_number: formData.phone_number || undefined,
        nomor_wa_admin: formData.nomor_wa_admin || undefined,
      };

      const updated = await updateMyProfile(payload);
      setProfile(updated);
      alert('Profil berhasil diperbarui!');
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
        setError('Gagal memperbarui profil.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      setError(null);
      const updated = await uploadAvatar(file);
      setProfile(updated);
      alert('Avatar berhasil diperbarui!');
    } catch (err: any) {
      setError('Gagal mengupload avatar.');
    }
  };

  if (loading) return <div className="py-8 text-center text-gray-500">Memuat profil...</div>;
  if (!profile) return <div className="py-8 text-center text-red-500">Gagal memuat profil.</div>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-16 w-16 rounded-full object-cover border border-[#d0bfaf]" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d85b30] text-2xl font-black text-white">
                {profile.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-xs text-white">Ubah</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#4b2417]">{profile.username}</h3>
            <p className="text-sm capitalize text-[#6f5448]">{profile.role_name || (profile.role_id === 1 ? 'Owner' : profile.role_id === 2 ? 'Admin' : 'Staff')}</p>
            {profile.is_active ? (
              <p className="text-sm text-green-600 font-semibold">Aktif</p>
            ) : (
              <p className="text-sm text-red-600 font-semibold">Nonaktif</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-bold uppercase text-[#6f5448]">Data Personal</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">Username <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">Nomor Telepon</label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">Nomor WA Admin</label>
            <input
              type="tel"
              value={formData.nomor_wa_admin}
              onChange={(e) => setFormData({ ...formData, nomor_wa_admin: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              placeholder="Contoh: +62812..."
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-gray-200 pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 2: KEAMANAN
// ============================================================

function SecurityTab() {
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdatePassword = async () => {
    if (!passwordData.current) {
      setError('Password lama wajib diisi');
      return;
    }
    if (passwordData.new.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setError('Konfirmasi password tidak cocok');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      await changeMyPassword({
        old_password: passwordData.current,
        new_password: passwordData.new,
      });
      alert('Password berhasil diperbarui!');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Gagal memperbarui password.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase text-[#6f5448]">Ganti Password</h3>
        <p className="mt-1 text-xs text-[#8b7166]">
          Tips: kombinasikan huruf besar, huruf kecil, angka, dan simbol.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">Password Saat Ini</label>
            <div className="relative mt-1">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={passwordData.current}
                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                placeholder="Masukkan password lama"
                className="w-full rounded-lg border border-[#d0bfaf] px-4 py-2 pr-10 text-sm outline-none focus:border-[#d85b30]"
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
            <label className="block text-sm font-semibold text-[#4b2417]">Password Baru</label>
            <div className="relative mt-1">
              <input
                type={showNew ? 'text' : 'password'}
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                placeholder="Minimal 8 karakter, huruf kapital, simbol, angka"
                className="w-full rounded-lg border border-[#d0bfaf] px-4 py-2 pr-10 text-sm outline-none focus:border-[#d85b30]"
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
            <label className="block text-sm font-semibold text-[#4b2417]">Konfirmasi Password Baru</label>
            <div className="relative mt-1">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                placeholder="Ulangi password baru"
                className="w-full rounded-lg border border-[#d0bfaf] px-4 py-2 pr-10 text-sm outline-none focus:border-[#d85b30]"
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

          <button
            onClick={handleUpdatePassword}
            disabled={saving}
            className="w-full rounded-lg bg-[#d85b30] py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-50"
          >
            {saving ? 'Memperbarui...' : 'Perbarui Password'}
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase text-[#6f5448]">Info</h3>
        <p className="mt-2 text-sm text-[#6f5448]">Pastikan password yang Anda gunakan aman dan tidak mudah ditebak.</p>
        
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TAB 3: PENGGUNA (dengan modal tambah/edit)
// ============================================================

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: UserProfile | null;
}

function UserModal({ isOpen, onClose, onSave, initialData }: UserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_number: '',
    role_id: 3,
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username,
        email: initialData.email || '',
        phone_number: initialData.phone_number || '',
        role_id: initialData.role_id,
        password: '',
      });
    } else {
      setFormData({
        username: '',
        email: '',
        phone_number: '',
        role_id: 3,
        password: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.phone_number) {
      alert('Semua field wajib diisi');
      return;
    }
    
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(formData.username)) {
      alert('Username hanya boleh menggunakan huruf, angka, underscore (_), atau tanda hubung (-). Tidak boleh ada spasi.');
      return;
    }

    if (!initialData && !formData.password) {
      alert('Password wajib diisi untuk user baru');
      return;
    }
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#4b2417]">
            {initialData ? 'Edit Pengguna' : 'Tambah Pengguna'}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: rina"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="rina@toticakery.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">
              Nomor WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="0812-3456-7890"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role_id}
              onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value, 10) })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            >
              <option value={2}>Admin</option>
              <option value={3}>Staff</option>
            </select>
          </div>

          {!initialData && (
            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-[#d0bfaf] px-4 py-2 pr-10 text-sm outline-none focus:border-[#d85b30]"
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
          )}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28]"
            >
              {initialData ? 'Simpan Perubahan' : 'Tambah Pengguna'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsersTab() {
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.role === 'owner';
  const canManageUsers = isOwner;

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('Semua role');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Gagal memuat pengguna (Mungkin Endpoint belum tersedia)", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone_number && u.phone_number.includes(searchQuery)) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    let targetRoleId = 0;
    if (filterRole === 'admin') targetRoleId = 2;
    if (filterRole === 'staff') targetRoleId = 3;
    const matchRole = filterRole === 'Semua role' || u.role_id === targetRoleId;
    return matchSearch && matchRole;
  });

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <span className="text-xs font-semibold text-green-600">Aktif</span>;
    }
    return <span className="text-xs font-semibold text-red-600">Nonaktif</span>;
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
      setToastMessage('Pengguna berhasil ditambahkan!');
      closeModal();
    } catch (error: any) {
      alert(extractErrorMessage(error, 'Gagal menambahkan pengguna.'));
    }
  };

  const handleEditUser = async (data: any) => {
    if (!editingUser) return;
    try {
      const updated = await updateUser(editingUser.id, data);
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
      alert('Pengguna berhasil diperbarui!');
    } catch (error: any) {
      alert(extractErrorMessage(error, 'Gagal memperbarui pengguna.'));
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Yakin ingin menghapus pengguna ini?')) return;
    try {
      await deleteUser(id);
      setUsers(users.filter((u) => u.id !== id));
      alert('Pengguna berhasil dihapus.');
    } catch (error: any) {
      alert(extractErrorMessage(error, 'Gagal menghapus pengguna.'));
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

  if (loading) return <div className="py-8 text-center">Memuat...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b7166]" />
          <input
            type="text"
            placeholder="Cari nama atau username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#d0bfaf] py-2 pl-9 pr-4 text-sm outline-none focus:border-[#d85b30]"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-lg border border-[#d0bfaf] px-3 py-2 text-sm outline-none focus:border-[#d85b30]"
        >
          <option value="Semua role">Semua role</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
        </select>
        {canManageUsers && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-1 rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28]"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="flex flex-wrap items-center justify-between rounded-xl bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3e2d7] text-sm font-black text-[#4b2417] uppercase">
                {user.username.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-[#4b2417]">{user.username}</p>
                <p className="text-xs text-[#6f5448]">
                  @{user.username} · {user.phone_number} · {getStatusBadge(user.is_active)}
                  {user.email && <span className="ml-2">{user.email}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#f3e2d7] px-2 py-0.5 text-xs font-bold capitalize text-[#4b2417]">
                {user.role_id === 1 ? 'Owner' : user.role_id === 2 ? 'Admin' : 'Staff'}
              </span>
              {canManageUsers && user.role_id !== 1 && (
                <>
                  <button
                    onClick={() => openEditModal(user)}
                    className="rounded p-1 text-[#6f5448] hover:bg-gray-100"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="rounded p-1 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
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
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-green-500 px-4 py-3 text-white shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

// ============================================================
// KOMPONEN UTAMA SETTINGS
// ============================================================

type SettingsTab = 'profile' | 'security' | 'users';

export default function SellerSettingsPage() {
  const tabs = [
    { key: 'profile' as const, label: 'Profil Saya', icon: User },
    { key: 'security' as const, label: 'Keamanan', icon: Shield },
    { key: 'users' as const, label: 'Pengguna', icon: Users },
  ];

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1 rounded-xl bg-white p-2 shadow-sm">
        {tabs.map((tab) => (
          <TabButton
            key={tab.key}
            label={tab.label}
            icon={tab.icon}
            isActive={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          />
        ))}
      </div>

      <div>
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'users' && <UsersTab />}
      </div>
    </div>
  );
}