import { useEffect, useState } from 'react';
import type React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { SellerModal } from '@/components/ui/SellerModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import {
  getBackendCategories,
  createBackendCategory,
  updateBackendCategory,
  deleteBackendCategory,
  type CategoryResponse,
} from '@/api/product';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged: () => void;
}

export default function CategoryManagementModal({ isOpen, onClose, onCategoriesChanged }: CategoryManagementModalProps) {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBackendCategories();
      setCategories(data);
    } catch (err: unknown) {
      console.error(err);
      setError((err as any).response?.data?.detail || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMode('list');
      setSuccess(null);
      setError(null);
      void loadCategories();
    }
  }, [isOpen]);


  const handleAdd = () => {
    setMode('add');
    setFormData({ name: '', description: '' });
    setError(null);
    setSuccess(null);
  };

  const handleEdit = (cat: CategoryResponse) => {
    setMode('edit');
    setEditingId(cat.id);
    setFormData({ name: cat.name, description: cat.description || '' });
    setError(null);
    setSuccess(null);
  };

  const [categoryToDeleteId, setCategoryToDeleteId] = useState<number | null>(null);

  const confirmDeleteCategory = async () => {
    if (!categoryToDeleteId) return;
    const id = categoryToDeleteId;
    setCategoryToDeleteId(null);
    try {
      setError(null);
      await deleteBackendCategory(id);
      setSuccess('Category deleted successfully');
      onCategoriesChanged();
      void loadCategories();
    } catch (err: unknown) {
      console.error(err);
      setError((err as any).response?.data?.detail || 'Failed to delete category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (mode === 'add') {
        await createBackendCategory(formData);
        setSuccess('Category created successfully');
      } else if (mode === 'edit' && editingId) {
        await updateBackendCategory(editingId, formData);
        setSuccess('Category updated successfully');
      }
      onCategoriesChanged();
      setMode('list');
      void loadCategories();
    } catch (err: unknown) {
      console.error(err);
      setError((err as any).response?.data?.detail || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === 'list' ? 'Manage Categories' : mode === 'add' ? 'Add Category' : 'Edit Category';

  return (
    <SellerModal isOpen={isOpen} onClose={onClose} title={title} size="2xl">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {mode === 'list' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-xl bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c04e28]"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
              No categories found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#ead8ca]">
              <table className="w-full text-left text-sm text-[#4b2417]">
                <thead className="bg-[#f8eee5] text-[#6f5448]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ead8ca]">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{cat.name}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(cat)}
                            className="rounded p-1 text-[#d85b30] hover:bg-orange-50 transition"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setCategoryToDeleteId(cat.id)}
                            className="rounded p-1 text-red-600 hover:bg-red-50 transition"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {(mode === 'add' || mode === 'edit') && (
        <form onSubmit={handleSubmit} className="space-y-4" id="category-form">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-xl border border-[#d0bfaf] px-4 py-2 text-sm focus:border-[#c95b31] focus:ring-1 focus:ring-[#c95b31] outline-none"
              placeholder="e.g. Kue Basah"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-[#ead8ca] pt-4">
            <button
              type="button"
              onClick={() => {
                setMode('list');
                setError(null);
                setSuccess(null);
              }}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-[#6f5448] transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c04e28] disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      <ConfirmationModal
        isOpen={categoryToDeleteId !== null}
        title="Hapus Kategori"
        message="Are you sure you want to delete this category?"
        confirmText="Hapus"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={confirmDeleteCategory}
        onCancel={() => setCategoryToDeleteId(null)}
      />
    </SellerModal>
  );
}
