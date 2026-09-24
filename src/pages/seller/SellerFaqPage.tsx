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
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
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
    status: 'active' as FaqStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          question: initialData.question,
          answer: initialData.answer,
          status: initialData.status,
        });
      } else {
        setFormData({
          question: '',
          answer: '',
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
      <form onSubmit={handleSubmit} className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 shrink-0">
          <h2 className="text-xl font-black text-[#4b2417]">
            {initialData ? 'Edit FAQ' : 'Add FAQ'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#6f5448]">
              Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full rounded-lg border border-[#d0bfaf] px-3 py-2 outline-none focus:border-[#d85b30]"
              placeholder="Enter customer question"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#6f5448]">
              Answer <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              className="w-full rounded-lg border border-[#d0bfaf] px-3 py-2 outline-none focus:border-[#d85b30]"
              placeholder="Enter answer"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#6f5448]">
              Status <span className="text-red-500">*</span>
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
    <div className="flex min-w-[240px] items-start gap-4 rounded-xl bg-white p-4 shadow-sm snap-start">
      <div className={`rounded-lg p-3 ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#6f5448]">{title}</p>
        <h3 className="text-2xl font-black text-[#4b2417]">{value}</h3>
        {subtitle && <p className="text-xs text-[#8b7166] mt-1">{subtitle}</p>}
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    return result;
  }, [faqs, debouncedSearch, filterStatus]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterStatus, itemsPerPage]);

  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFaqs = filteredFaqs.slice(startIndex, startIndex + itemsPerPage);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#4b2417]">FAQ Management</h1>
          <p className="mt-1 text-sm text-[#6f5448]">
            Create, organize, and maintain answers for your customers.
          </p>
        </div>

        {canManageChatbot && (
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center gap-1 rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add FAQ
          </button>
        )}
      </div>

      <div className="relative group">
        <button 
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-10 hidden md:group-hover:flex bg-white shadow-md rounded-full p-1 text-[#4b2417] hover:bg-gray-50 border border-gray-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2"
        >
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
        </div>
        <button 
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 z-10 hidden md:group-hover:flex bg-white shadow-md rounded-full p-1 text-[#4b2417] hover:bg-gray-50 border border-gray-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b7166]" />
          <input
            type="text"
            placeholder="Search questions or answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#d0bfaf] py-2 pl-9 pr-4 text-sm outline-none focus:border-[#d85b30]"
          />
        </div>

        <div className="flex flex-wrap gap-2 relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm font-semibold text-[#6f5448] hover:bg-gray-50"
            aria-label="Filter FAQs"
          >
            <Filter className="w-4 h-4" />
            Filter
            {filterStatus !== 'all' && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d85b30] text-[10px] text-white">
                1
              </span>
            )}
          </button>
          
          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-gray-100 bg-white p-4 shadow-lg z-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#4b2417]">Filters</h3>
                <button onClick={() => setIsFilterOpen(false)}>
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6f5448] mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-[#d85b30]"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                {/* Note: Updated By and Last Updated filters are not supported by the backend yet */}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => { setFilterStatus('all'); setIsFilterOpen(false); }}
                  className="px-3 py-1.5 text-sm text-[#6f5448] hover:bg-gray-50 rounded-lg"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="px-3 py-1.5 text-sm bg-[#d85b30] text-white font-semibold rounded-lg hover:bg-[#c04e28]"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
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
                      <p className="font-bold text-[#4b2417] mb-1">{faq.question}</p>
                      <p className="text-sm text-[#6f5448] line-clamp-3 leading-relaxed">
                        {faq.answer}
                      </p>
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

        {filteredFaqs.length > 0 && (
          <div className="border-t border-gray-100 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-[#6f5448]">
              <span>Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded border border-gray-200 px-2 py-1 outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-[#6f5448]">
              <span>
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredFaqs.length)} of {filteredFaqs.length}
              </span>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <div className="flex items-center mx-2 gap-1 hidden sm:flex">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-7 min-w-[28px] rounded px-2 text-xs font-semibold ${
                        page === currentPage
                          ? 'bg-[#d85b30] text-white'
                          : 'text-[#6f5448] hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
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
