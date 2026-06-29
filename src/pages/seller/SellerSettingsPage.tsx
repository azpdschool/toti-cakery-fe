// src/pages/seller/SellerSettingsPage.tsx

import { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Users,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Plus,
  X,
} from 'lucide-react';
import {
  getShopProfile,
  updateShopProfile,
  getUsers,
  getUserByUsername,
  addUser,
  updateUser,
  deleteUser,
  type UserProfile,
  type ShopProfile,
  type UserRole,
  type UserStatus,
} from '@/services/sellerSettingsService';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission } from '@/services/rbacService';

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
  const [formData, setFormData] = useState<ShopProfile>({
    name: '',
    phone: '',
    address: '',
    description: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    async function loadProfile() {
      const data = await getShopProfile();
      setFormData(data);
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      await updateShopProfile(formData);
      alert('Profil berhasil diperbarui!');
    } catch (error) {
      alert('Gagal memperbarui profil.');
    }
  };

  if (loading) return <div className="py-8 text-center">Memuat...</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d85b30] text-2xl font-black text-white">
            {user?.name?.charAt(0) || 'J'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#4b2417]">{user?.name || 'Jake'}</h3>
            <p className="text-sm capitalize text-[#6f5448]">{user?.role || 'Owner'}</p>
            <p className="text-sm text-green-600">Aktif</p>
            <p className="text-xs text-[#8b7166]">Bergabung 10 Jan 2026</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-bold uppercase text-[#6f5448]">Data Personal</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">
              Nama lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">
              Nomor WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">Alamat</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">Deskripsi Singkat</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-gray-200 pt-6">
          <button
            onClick={handleSave}
            className="rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28]"
          >
            Simpan
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

  const handleUpdatePassword = () => {
    if (passwordData.new.length < 8) {
      alert('Password baru minimal 8 karakter');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      alert('Konfirmasi password tidak cocok');
      return;
    }
    alert('Password berhasil diperbarui! (dummy)');
    setPasswordData({ current: '', new: '', confirm: '' });
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
            className="w-full rounded-lg bg-[#d85b30] py-2 text-sm font-semibold text-white hover:bg-[#c04e28]"
          >
            Perbarui Password
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase text-[#6f5448]">Info Akun</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-gray-100 py-2">
            <span className="text-[#6f5448]">Role</span>
            <span className="font-semibold capitalize text-[#4b2417]">Owner</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 py-2">
            <span className="text-[#6f5448]">Level</span>
            <span className="font-semibold text-[#4b2417]">1</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 py-2">
            <span className="text-[#6f5448]">Dibuat</span>
            <span className="font-semibold text-[#4b2417]">10 Jan 2026, 10:15 WIB</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 py-2">
            <span className="text-[#6f5448]">Status</span>
            <span className="font-semibold text-green-600">Aktif</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[#6f5448]">Login terakhir</span>
            <span className="font-semibold text-[#4b2417]">25 Mei 2026, 09:12 WIB</span>
          </div>
        </div>
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
    name: '',
    username: '',
    email: '',
    phone: '',
    role: 'staff' as UserRole,
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        username: initialData.username,
        email: initialData.email || '',
        phone: initialData.phone,
        role: initialData.role,
        password: '',
      });
    } else {
      setFormData({
        name: '',
        username: '',
        email: '',
        phone: '',
        role: 'staff',
        password: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.email || !formData.phone) {
      alert('Semua field wajib diisi');
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
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Rina Staff"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            />
          </div>

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
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
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

  const loadUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchRole = filterRole === 'Semua role' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const getStatusBadge = (status: UserStatus) => {
    if (status === 'active') {
      return <span className="text-xs font-semibold text-green-600">Aktif</span>;
    }
    return <span className="text-xs font-semibold text-red-600">Nonaktif</span>;
  };

  const handleAddUser = async (data: any) => {
    try {
      const existing = await getUserByUsername(data.username);
      if (existing) {
        alert('Username sudah digunakan. Silakan pilih username lain.');
        return;
      }
      const newUser = await addUser(data);
      setUsers([newUser, ...users]);
      alert('Pengguna berhasil ditambahkan!');
    } catch (error) {
      alert('Gagal menambahkan pengguna.');
    }
  };

  const handleEditUser = async (data: any) => {
    if (!editingUser) return;
    try {
      if (data.username !== editingUser.username) {
        const existing = await getUserByUsername(data.username);
        if (existing) {
          alert('Username sudah digunakan. Silakan pilih username lain.');
          return;
        }
      }
      const updated = await updateUser(editingUser.id, data);
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
      alert('Pengguna berhasil diperbarui!');
    } catch (error) {
      alert('Gagal memperbarui pengguna.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pengguna ini?')) return;
    try {
      await deleteUser(id);
      setUsers(users.filter((u) => u.id !== id));
      alert('Pengguna berhasil dihapus.');
    } catch (error) {
      alert('Gagal menghapus pengguna.');
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3e2d7] text-sm font-black text-[#4b2417]">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-[#4b2417]">{user.name}</p>
                <p className="text-xs text-[#6f5448]">
                  @{user.username} · {user.phone} · {getStatusBadge(user.status)}
                  {user.email && <span className="ml-2">{user.email}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#f3e2d7] px-2 py-0.5 text-xs font-bold capitalize text-[#4b2417]">
                {user.role}
              </span>
              {canManageUsers && user.role !== 'owner' && (
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