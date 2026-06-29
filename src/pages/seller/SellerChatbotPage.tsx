// src/pages/seller/SellerChatbotPage.tsx

import { useState, useEffect, useMemo } from 'react';
import {
  MessageCircle,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  getChatbotFaqs,
  getChatbotStats,
  addFaq,
  updateFaq,
  deleteFaq,
  toggleFaqStatus,
  getFaqCategories,
  type Faq,
  type FaqStatus,
  type FaqCategory,
} from '@/services/sellerChatbotService';
import { hasPermission } from '@/services/rbacService';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/services/sellerSettingsService';

// ============================================================
// STAT CARD
// ============================================================

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-[#6f5448]">{subtitle}</span>
      </div>
      <p className="mt-2 text-3xl font-black text-[#4b2417]">{value}</p>
      <p className="text-sm text-[#6f5448]">{title}</p>
    </div>
  );
}

// ============================================================
// MODAL TAMBAH / EDIT
// ============================================================

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: Faq | null;
  categories: string[];
}

function FaqModal({ isOpen, onClose, onSave, initialData, categories }: FaqModalProps) {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: categories[0] || 'Umum',
    status: 'active' as FaqStatus,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        question: initialData.question,
        answer: initialData.answer,
        category: initialData.category,
        status: initialData.status,
      });
    } else {
      setFormData({
        question: '',
        answer: '',
        category: categories[0] || 'Umum',
        status: 'active',
      });
    }
  }, [initialData, categories, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      alert('Pertanyaan dan Jawaban wajib diisi');
      return;
    }
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#4b2417]">
            {initialData ? 'Edit FAQ' : 'Tambah FAQ'}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Pertanyaan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Bagaimana cara memesan?"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Jawaban <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Tulis jawaban lengkap..."
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as FaqCategory })
                }
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">Status</label>
              <div className="mt-1 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={formData.status === 'active'}
                    onChange={() => setFormData({ ...formData, status: 'active' })}
                  />
                  Aktif
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={formData.status === 'inactive'}
                    onChange={() => setFormData({ ...formData, status: 'inactive' })}
                  />
                  Nonaktif
                </label>
              </div>
              <p className="mt-1 text-xs text-[#6f5448]">
                FAQ aktif akan ditampilkan di chatbot customer
              </p>
            </div>
          </div>

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
              {initialData ? 'Simpan Perubahan' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SellerChatbotPage() {
  const { user } = useAuth();
  const userRole = user?.role as UserRole;

  const canManageChatbot = hasPermission(userRole, 'manage_chatbot_faq');
  const canDelete = hasPermission(userRole, 'delete_data');

  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    activePercentage: number;
    inactivePercentage: number;
    usedInChatbot: number;
  } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua Kategori');
  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [faqsData, statsData, categoriesData] = await Promise.all([
          getChatbotFaqs(),
          getChatbotStats(),
          getFaqCategories(),
        ]);
        const sorted = [...faqsData].sort((a, b) => a.order - b.order);
        setFaqs(sorted);
        setStats(statsData);
        setCategories(['Semua Kategori', ...categoriesData]);
      } catch (error) {
        console.error('Gagal memuat data FAQ:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredFaqs = useMemo(() => {
    let result = faqs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      );
    }
    if (filterCategory !== 'Semua Kategori') {
      result = result.filter((f) => f.category === filterCategory);
    }
    if (filterStatus !== 'Semua Status') {
      result = result.filter((f) => f.status === filterStatus);
    }
    return result;
  }, [faqs, searchQuery, filterCategory, filterStatus]);

  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFaqs = filteredFaqs.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleAdd = async (data: any) => {
    try {
      const newFaq = await addFaq(data);
      const sorted = [...faqs, newFaq].sort((a, b) => a.order - b.order);
      setFaqs(sorted);
      alert('FAQ berhasil ditambahkan!');
    } catch (error) {
      alert('Gagal menambahkan FAQ.');
    }
  };

  const handleEdit = async (data: any) => {
    if (!editingFaq) return;
    try {
      const updated = await updateFaq(editingFaq.id, data);
      const sorted = faqs.map((f) => (f.id === updated.id ? updated : f)).sort((a, b) => a.order - b.order);
      setFaqs(sorted);
      alert('FAQ berhasil diperbarui!');
    } catch (error) {
      alert('Gagal memperbarui FAQ.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus FAQ ini?')) return;
    try {
      await deleteFaq(id);
      const remaining = faqs.filter((f) => f.id !== id);
      setFaqs(remaining);
      alert('FAQ berhasil dihapus.');
    } catch (error) {
      alert('Gagal menghapus FAQ.');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await toggleFaqStatus(id);
      const sorted = faqs.map((f) => (f.id === updated.id ? updated : f)).sort((a, b) => a.order - b.order);
      setFaqs(sorted);
    } catch (error) {
      alert('Gagal mengubah status FAQ.');
    }
  };

  const openEditModal = (faq: Faq) => {
    setEditingFaq(faq);
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingFaq(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFaq(null);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
      </div>
    );
  }

  const categoryOptions = categories.filter((c) => c !== 'Semua Kategori');

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total FAQ"
          value={stats?.total || 0}
          subtitle="Semua pertanyaan"
          icon={MessageCircle}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Aktif"
          value={stats?.active || 0}
          subtitle={`${stats?.activePercentage || 0}% dari total FAQ`}
          icon={CheckCircle}
          color="bg-green-50 text-green-700"
        />
        <StatCard
          title="Nonaktif"
          value={stats?.inactive || 0}
          subtitle={`${stats?.inactivePercentage || 0}% dari total FAQ`}
          icon={XCircle}
          color="bg-red-50 text-red-700"
        />
        <StatCard
          title="Digunakan Chatbot"
          value={stats?.usedInChatbot || 0}
          subtitle="FAQ aktif yang digunakan"
          icon={MessageCircle}
          color="bg-purple-50 text-purple-700"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b7166]" />
          <input
            type="text"
            placeholder="Cari pertanyaan atau jawaban..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#d0bfaf] py-2 pl-9 pr-4 text-sm outline-none focus:border-[#d85b30]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-[#d0bfaf] px-3 py-2 text-sm outline-none focus:border-[#d85b30]"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-[#d0bfaf] px-3 py-2 text-sm outline-none focus:border-[#d85b30]"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>

          {canManageChatbot && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28]"
            >
              <Plus className="h-4 w-4" />
              Tambah FAQ
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
                <th className="pb-3 pr-4 w-12">NO</th>
                <th className="pb-3 pr-4">PERTANYAAN</th>
                <th className="pb-3 pr-4">DIUBAH OLEH</th>
                <th className="pb-3 pr-4">TERAKHIR DIUBAH</th>
                <th className="pb-3 pr-4">STATUS</th>
                <th className="pb-3">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFaqs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-[#6f5448]">
                    Tidak ada FAQ ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedFaqs.map((faq, idx) => (
                  <tr key={faq.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 text-[#6f5448] align-top">
                      {startIndex + idx + 1}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-[#4b2417]">{faq.question}</p>
                      <p className="mt-1 text-xs text-[#6f5448] leading-relaxed">
                        {faq.answer}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-[#6f5448] align-top">
                      <p className="font-medium text-[#4b2417]">{faq.updatedBy.name}</p>
                      <p className="text-xs text-[#8b7166]">{faq.updatedBy.role}</p>
                    </td>
                    <td className="py-3 pr-4 text-[#6f5448] align-top whitespace-nowrap">
                      {faq.updatedAt}
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                          faq.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {faq.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 align-top">
                      <div className="flex items-center gap-1">
                        {canManageChatbot && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(faq.id)}
                              className="rounded p-1 text-[#6f5448] hover:bg-gray-100"
                              title={faq.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                            >
                              {faq.status === 'active' ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openEditModal(faq)}
                              className="rounded p-1 text-[#6f5448] hover:bg-gray-100"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(faq.id)}
                            className="rounded p-1 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[#6f5448]">
            <div>
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredFaqs.length)} dari{' '}
              {filteredFaqs.length} FAQ
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`rounded px-2.5 py-0.5 text-xs font-bold ${
                    page === currentPage
                      ? 'bg-[#d85b30] text-white'
                      : 'bg-gray-200 text-[#6f5448] hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {canManageChatbot && (
        <FaqModal
          isOpen={showModal}
          onClose={closeModal}
          onSave={editingFaq ? handleEdit : handleAdd}
          initialData={editingFaq}
          categories={categoryOptions}
        />
      )}
    </div>
  );
}