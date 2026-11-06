import { useState, useEffect, useMemo, useRef } from 'react';
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
  Filter,
  AlertTriangle,
  MoreVertical,
} from 'lucide-react';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { SellerSortDropdown } from '@/components/ui/SellerSortDropdown';
import { SellerFilterSelect } from '@/components/ui/SellerFilterSelect';
import { HorizontalCardScroller } from '@/components/common/HorizontalCardScroller';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  getChatbotFaqs,
  getChatbotStatsFromFaqs,
  addFaq,
  updateFaq,
  deleteFaq,
  toggleFaqStatus,
  type Faq,
  type FaqStatus,
} from '@/services/sellerChatbotService';
import { hasPermission } from '@/services/rbacService';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/services/sellerSettingsService';
import { useToast } from '@/components/ui/Toast';

// ============================================================
// MORE ACTIONS DROPDOWN (MOBILE)
// ============================================================

interface FaqMoreActionsDropdownProps {
  faq: Faq;
  canDelete: boolean;
  onDelete: () => void;
}

function FaqMoreActionsDropdown({
  faq,
  canDelete,
  onDelete,
}: FaqMoreActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  if (!canDelete) return null;

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        aria-label={`More actions for FAQ #${faq.id}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-white p-1.5 shadow-xl border border-gray-100 z-50 focus:outline-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4 text-red-500 shrink-0" />
            <span>Delete FAQ</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MODAL COMPONENTS
// ============================================================

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: Faq | null;
}

function FaqModal({ isOpen, onClose, onSave, initialData }: FaqModalProps) {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    question_en: '',
    answer_en: '',
    status: 'active' as FaqStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          question: initialData.question,
          answer: initialData.answer,
          question_en: initialData.question_en || '',
          answer_en: initialData.answer_en || '',
          status: initialData.status,
        });
      } else {
        setFormData({
          question: '',
          answer: '',
          question_en: '',
          answer_en: '',
          status: 'active',
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 shrink-0">
          <h2 className="text-xl font-black text-[#4b2417]">
            {initialData ? 'Edit FAQ' : 'Add FAQ'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          {/* Indonesian (Default Required) */}
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/30 p-3.5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-[#4b2417] uppercase tracking-wider">
              <span>🇮🇩</span> Indonesian Content
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#6f5448]">
                Question (Indonesian) <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full rounded-lg border border-[#d0bfaf] bg-white px-3 py-2 text-sm outline-none focus:border-[#d85b30]"
                placeholder="Contoh: Berapa lama estimasi pengiriman kue?"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#6f5448]">
                Answer (Indonesian) <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                className="w-full rounded-lg border border-[#d0bfaf] bg-white px-3 py-2 text-sm outline-none focus:border-[#d85b30]"
                placeholder="Jawaban lengkap dalam Bahasa Indonesia..."
              />
            </div>
          </div>

          {/* English (Optional) */}
          <div className="rounded-xl border border-blue-200/60 bg-blue-50/30 p-3.5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-[#4b2417] uppercase tracking-wider">
              <span>🇬🇧</span> English Translation
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#6f5448]">
                Question (English) <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.question_en}
                onChange={(e) => setFormData({ ...formData, question_en: e.target.value })}
                className="w-full rounded-lg border border-[#d0bfaf] bg-white px-3 py-2 text-sm outline-none focus:border-[#d85b30]"
                placeholder="e.g. How long is cake delivery estimation?"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#6f5448]">
                Answer (English) <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={formData.answer_en}
                onChange={(e) => setFormData({ ...formData, answer_en: e.target.value })}
                className="w-full rounded-lg border border-[#d0bfaf] bg-white px-3 py-2 text-sm outline-none focus:border-[#d85b30]"
                placeholder="Complete answer in English (leave blank to fall back to Indonesian)..."
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#6f5448]">
              Status <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as FaqStatus })}
                  className="text-[#d85b30] focus:ring-[#d85b30]"
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as FaqStatus })}
                  className="text-[#d85b30] focus:ring-[#d85b30]"
                />
                <span className="text-sm">Inactive</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-[#8b7166]">
              Active FAQs will be displayed to customers.
            </p>
          </div>

        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 p-6 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#d85b30] px-4 py-2 font-bold text-white hover:bg-[#c04e28] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
      </form>
    </div>
  );
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-[#4b2417] mb-2">Delete FAQ</h3>
        <p className="text-sm text-[#6f5448] mb-6">
          Are you sure you want to delete this FAQ? This action cannot be undone.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-lg bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: any;
  color: string;
}) {
  return (
    <div className="flex min-w-[160px] sm:min-w-[240px] items-start gap-2.5 sm:gap-4 rounded-xl bg-white p-3 sm:p-4 shadow-sm snap-start">
      <div className={`rounded-lg p-2 sm:p-3 shrink-0 ${color}`}>
        <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-semibold text-[#6f5448] truncate">{title}</p>
        <h3 className="text-lg sm:text-2xl font-black text-[#4b2417] truncate">{value}</h3>
        {subtitle && <p className="text-[10px] sm:text-xs text-[#8b7166] mt-0.5 sm:mt-1 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function SellerFaqPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const userRole = user?.role as UserRole;
  const canManageChatbot = hasPermission(userRole, 'manage_chatbot_faq');
  const canDelete = canManageChatbot;

  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState('order_asc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const faqsData = await getChatbotFaqs();
      const statsData = getChatbotStatsFromFaqs(faqsData);
      const sorted = [...faqsData].sort((a, b) => a.order - b.order);
      setFaqs(sorted);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load FAQs:', error);
      showToast({ message: 'Unable to load FAQs right now.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const faqsData = await getChatbotFaqs();
        if (ignore) return;
        const statsData = getChatbotStatsFromFaqs(faqsData);
        const sorted = [...faqsData].sort((a, b) => a.order - b.order);
        setFaqs(sorted);
        setStats(statsData);
      } catch (error) {
        if (ignore) return;
        console.error('Failed to load FAQs:', error);
        showToast({ message: 'Unable to load FAQs right now.', type: 'error' });
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => { ignore = true; };
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredFaqs = useMemo(() => {
    let result = faqs;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(
        (faq) =>
          faq.question.toLowerCase().includes(q) ||
          faq.answer.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') {
      result = result.filter((faq) => faq.status === filterStatus);
    }
    switch (sortBy) {
      case 'question_asc':
        result = [...result].sort((a, b) => a.question.localeCompare(b.question));
        break;
      case 'question_desc':
        result = [...result].sort((a, b) => b.question.localeCompare(a.question));
        break;
      case 'newest':
        result = [...result].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        break;
      case 'oldest':
        result = [...result].sort((a, b) => new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime());
        break;
      case 'order_asc':
      default:
        result = [...result].sort((a, b) => (a.order || 0) - (b.order || 0));
        break;
    }

    return result;
  }, [faqs, debouncedSearch, filterStatus, sortBy]);

  // Reset page when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterStatus, itemsPerPage, sortBy]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFaqs = filteredFaqs.slice(startIndex, startIndex + itemsPerPage);

  const handleAdd = async (data: any) => {
    try {
      await addFaq(data);
      await loadData();
      showToast({ message: 'FAQ created successfully.', type: 'success' });
      setShowModal(false);
    } catch (error) {
      showToast({ message: 'Unable to create FAQ.', type: 'error' });
    }
  };

  const handleEdit = async (data: any) => {
    if (!editingFaq) return;
    try {
      await updateFaq(editingFaq.id, data);
      await loadData();
      showToast({ message: 'FAQ updated successfully.', type: 'success' });
      setShowModal(false);
    } catch (error) {
      showToast({ message: 'Unable to update FAQ.', type: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteFaq(deletingId);
      await loadData();
      showToast({ message: 'FAQ deleted successfully.', type: 'success' });
    } catch (error) {
      showToast({ message: 'Unable to delete FAQ.', type: 'error' });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleFaqStatus(id);
      await loadData();
      showToast({ message: 'FAQ status updated.', type: 'success' });
    } catch (error) {
      showToast({ message: 'Unable to update FAQ status.', type: 'error' });
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

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#d85b30]" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <PageHeader
        title="FAQ Management"
        description="Create, organize, and maintain answers for your customers."
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4"
        actions={
          canManageChatbot ? (
            <button
              type="button"
              onClick={openAddModal}
              className="flex items-center justify-center gap-1 rounded-lg bg-[#d85b30] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#c04e28] whitespace-nowrap shrink-0 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add FAQ
            </button>
          ) : undefined
        }
      />

      <HorizontalCardScroller scrollContainerClassName="gap-3 sm:gap-4 pb-2 snap-mandatory">
        <StatCard
          title="Total FAQ"
          value={stats?.total || 0}
          subtitle="All questions"
          icon={MessageCircle}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Active"
          value={stats?.active || 0}
          subtitle="Visible to customers"
          icon={CheckCircle}
          color="bg-green-50 text-green-700"
        />
        <StatCard
          title="Inactive"
          value={stats?.inactive || 0}
          subtitle="Hidden from customers"
          icon={XCircle}
          color="bg-red-50 text-red-700"
        />
        <StatCard
          title="Used in Chatbot"
          value={stats?.usedInChatbot || 0}
          subtitle="Active FAQs synced"
          icon={MessageCircle}
          color="bg-purple-50 text-purple-700"
        />
      </HorizontalCardScroller>

      <div className="flex items-center gap-2 sm:gap-3 rounded-xl bg-white p-2.5 sm:p-4 shadow-sm border border-gray-100">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b7166]" />
          <input
            type="text"
            placeholder="Search questions or answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#d0bfaf] py-2 pl-9 pr-3 sm:pr-4 text-xs sm:text-sm outline-none focus:border-[#d85b30]"
          />
        </div>

        {/* Sort By Dropdown */}
        <SellerSortDropdown
          id="faq-sort"
          value={sortBy}
          onChange={(val) => {
            setSortBy(val);
            setCurrentPage(1);
          }}
          options={[
            { label: 'Default', value: 'order_asc' },
            { label: 'Question: A-Z', value: 'question_asc' },
            { label: 'Question: Z-A', value: 'question_desc' },
            { label: 'Newest', value: 'newest' },
            { label: 'Oldest', value: 'oldest' },
          ]}
          ariaLabel="Sort FAQs"
        />

        <div className="shrink-0 relative">
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-[#d0bfaf] bg-white px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#4b2417] hover:bg-gray-50 cursor-pointer shrink-0"
            aria-label="Filter FAQs"
          >
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8b7166] shrink-0" />
            <span className="hidden sm:inline">Filter</span>
            {filterStatus !== 'all' && (
              <span className="rounded-full bg-[#d85b30] text-white px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold">
                1
              </span>
            )}
          </button>
          
          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-2 w-[min(300px,calc(100vw-2rem))] sm:w-80 rounded-2xl border border-[#e6d5c5] bg-white p-3.5 sm:p-5 shadow-xl max-h-[75dvh] overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <h3 className="font-bold text-sm text-[#4b2417]">Filters</h3>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
                  aria-label="Close filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <SellerFilterSelect
                  label="Status"
                  value={filterStatus}
                  onChange={(val) => setFilterStatus(val || 'all')}
                  options={[
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' },
                  ]}
                  placeholder="All Status"
                />
              </div>
              <div className="flex gap-2 pt-3 mt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setFilterStatus('all'); setIsFilterOpen(false); }}
                  className="flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-[#d85b30] hover:bg-[#c04e28] transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-hidden border border-gray-100">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 pr-4">Question & Answer</th>
                <th className="py-3 pr-4">Updated By</th>
                <th className="py-3 pr-4">Last Updated</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFaqs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#6f5448]">
                    {searchQuery || filterStatus !== 'all' 
                      ? 'No FAQs match your current filters.' 
                      : 'No FAQs found.'}
                  </td>
                </tr>
              ) : (
                paginatedFaqs.map((faq, idx) => (
                  <tr key={faq.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 text-[#6f5448] align-top">
                      {startIndex + idx + 1}
                    </td>
                    <td className="py-4 pr-4 align-top max-w-md">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-[#4b2417]">{faq.question}</p>
                        {faq.question_en?.trim() ? (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
                            ID & EN
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 border border-stone-200">
                            ID Only
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#6f5448] line-clamp-3 leading-relaxed">
                        {faq.answer}
                      </p>
                      {faq.question_en?.trim() && (
                        <p className="text-xs text-stone-400 mt-1 italic line-clamp-1">
                          EN: {faq.question_en}
                        </p>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-[#6f5448] align-top">
                      <p className="font-medium text-[#4b2417]">{faq.updatedBy.name}</p>
                      <p className="text-xs text-[#8b7166] mt-0.5">{faq.updatedBy.role}</p>
                    </td>
                    <td className="py-4 pr-4 text-[#6f5448] align-top whitespace-nowrap">
                      {faq.updatedAt}
                    </td>
                    <td className="py-4 pr-4 align-top">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          faq.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {faq.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 pr-4 align-top">
                      <div className="flex items-center gap-1">
                        {canManageChatbot && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(faq.id)}
                              className="rounded-lg p-2 text-[#6f5448] hover:bg-white hover:shadow-sm hover:text-[#4b2417] transition-all"
                              title={faq.status === 'active' ? 'Deactivate' : 'Activate'}
                              aria-label={faq.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {faq.status === 'active' ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openEditModal(faq)}
                              className="rounded-lg p-2 text-[#6f5448] hover:bg-white hover:shadow-sm hover:text-blue-600 transition-all"
                              title="Edit"
                              aria-label="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              setDeletingId(faq.id);
                              setShowDeleteModal(true);
                            }}
                            className="rounded-lg p-2 text-[#6f5448] hover:bg-white hover:shadow-sm hover:text-red-600 transition-all"
                            title="Delete"
                            aria-label="Delete"
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

        {/* Mobile Card List View */}
        <div className="block md:hidden divide-y divide-gray-100 p-3 space-y-3">
          {paginatedFaqs.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#6f5448]">
              {searchQuery || filterStatus !== 'all' 
                ? 'No FAQs match your current filters.' 
                : 'No FAQs found.'}
            </div>
          ) : (
            paginatedFaqs.map((faq, idx) => (
              <div key={faq.id} className="p-3.5 bg-white border border-gray-100 rounded-xl space-y-3 shadow-xs">
                {/* Top Row: #Index, Question, Status badge, and ⋮ Menu */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-gray-100 text-[10px] font-semibold text-gray-600">
                        #{startIndex + idx + 1}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          faq.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {faq.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      {faq.question_en?.trim() ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
                          ID & EN
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 border border-stone-200">
                          ID Only
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-[#4b2417] text-sm leading-snug">
                      {faq.question}
                    </h4>
                  </div>
                  {canDelete && (
                    <div className="shrink-0">
                      <FaqMoreActionsDropdown
                        faq={faq}
                        canDelete={canDelete}
                        onDelete={() => {
                          setDeletingId(faq.id);
                          setShowDeleteModal(true);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Middle Row: Answer Preview & Metadata */}
                <div className="bg-[#fcf8f5] p-2.5 rounded-lg border border-[#f3e9e2]/60 space-y-2">
                  <p className="text-xs text-[#6f5448] line-clamp-3 leading-relaxed">
                    {faq.answer}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#8b7166] pt-1.5 border-t border-[#f3e9e2]">
                    <span>By: <strong className="font-medium text-[#4b2417]">{faq.updatedBy.name}</strong></span>
                    <span>&bull;</span>
                    <span>{faq.updatedAt}</span>
                  </div>
                </div>

                {/* Bottom Row: 2 Primary Action Buttons */}
                {canManageChatbot && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(faq.id)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                        faq.status === 'active'
                          ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                          : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {faq.status === 'active' ? (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3.5 w-3.5" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(faq)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg border border-[#d85b30]/30 bg-[#fdf5f0] text-[#d85b30] hover:bg-[#faeae0] transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit FAQ</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {filteredFaqs.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            limit={itemsPerPage}
            totalItems={filteredFaqs.length}
            onPageChange={setCurrentPage}
            onLimitChange={setItemsPerPage}
          />
        )}
      </div>

      <FaqModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={editingFaq ? handleEdit : handleAdd}
        initialData={editingFaq}
      />
      
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
