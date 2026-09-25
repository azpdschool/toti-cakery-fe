import { SellerModal } from '@/components/ui/SellerModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import type React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supplierService } from '@/services/supplierService';
import type { SupplierOut } from '@/api/supplier';

interface SupplierManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupplierManagementModal({ isOpen, onClose }: SupplierManagementModalProps) {
  const [suppliers, setSuppliers] = useState<SupplierOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ 
    nama_supplier: '',
    kontak_person: '',
    nomor_telepon: '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supplierService.fetchSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat supplier');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMode('list');
      void loadSuppliers();
    }
  }, [isOpen]);

  const handleAdd = () => {
    setFormData({ nama_supplier: '', kontak_person: '', nomor_telepon: '', email: '' });
    setMode('add');
  };

  const handleEdit = (supplier: SupplierOut) => {
    setFormData({ 
      nama_supplier: supplier.nama_supplier,
      kontak_person: supplier.kontak_person || '',
      nomor_telepon: supplier.nomor_telepon || '',
      email: supplier.email || '',
    });
    setEditingId(supplier.id);
    setMode('edit');
  };

  const [supplierToDelete, setSupplierToDelete] = useState<{ id: number; name: string } | null>(null);

  const confirmDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    const { id } = supplierToDelete;
    setSupplierToDelete(null);
    try {
      setError(null);
      await supplierService.deleteSupplier(id);
      await loadSuppliers();
      toast.success('Supplier berhasil dihapus');
    } catch (err) {
      console.error(err);
      setError('Gagal menghapus supplier');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_supplier.trim()) {
      toast.error('Nama supplier wajib diisi');
      return;
    }

    const payload = {
      nama_supplier: formData.nama_supplier.trim(),
      kontak_person: formData.kontak_person.trim() || undefined,
      nomor_telepon: formData.nomor_telepon.trim() || undefined,
      email: formData.email.trim() || undefined,
    };

    try {
      setSubmitting(true);
      setError(null);
      if (mode === 'add') {
        await supplierService.createSupplier(payload);
      } else if (mode === 'edit' && editingId !== null) {
        await supplierService.updateSupplier(editingId, payload);
      }
      setMode('list');
      await loadSuppliers();
    } catch (err) {
      console.error(err);
      setError(mode === 'add' ? 'Gagal menambah supplier' : 'Gagal mengupdate supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === 'list' ? 'Supplier Management' : mode === 'add' ? 'Add Supplier' : 'Edit Supplier';

  return (
    <SellerModal isOpen={isOpen} onClose={onClose} title={title} size="2xl">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
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
              Add Supplier
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading...</div>
          ) : suppliers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
              No suppliers found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#ead8ca]">
              <table className="w-full text-left text-sm text-[#4b2417]">
                <thead className="bg-[#f8eee5] text-[#6f5448]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Contact</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ead8ca]">
                  {suppliers.map(supplier => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{supplier.nama_supplier}</td>
                      <td className="px-4 py-3">{supplier.kontak_person || '-'}</td>
                      <td className="px-4 py-3">{supplier.nomor_telepon || '-'}</td>
                      <td className="px-4 py-3">{supplier.email || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="rounded p-1 text-[#d85b30] hover:bg-orange-50 transition"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setSupplierToDelete({ id: supplier.id, name: supplier.nama_supplier })}
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
        <form onSubmit={handleSubmit} className="space-y-4" id="supplier-form">
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">Supplier Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.nama_supplier}
              onChange={e => setFormData({ ...formData, nama_supplier: e.target.value })}
              className="mt-1 w-full rounded-xl border border-[#d0bfaf] px-4 py-3 text-sm outline-none focus:border-[#d85b30]"
              placeholder="Enter supplier name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">Contact Person</label>
            <input
              type="text"
              value={formData.kontak_person}
              onChange={e => setFormData({ ...formData, kontak_person: e.target.value })}
              className="mt-1 w-full rounded-xl border border-[#d0bfaf] px-4 py-3 text-sm outline-none focus:border-[#d85b30]"
              placeholder="Enter contact name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">Phone Number</label>
            <input
              type="tel"
              value={formData.nomor_telepon}
              onChange={e => setFormData({ ...formData, nomor_telepon: e.target.value })}
              className="mt-1 w-full rounded-xl border border-[#d0bfaf] px-4 py-3 text-sm outline-none focus:border-[#d85b30]"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 w-full rounded-xl border border-[#d0bfaf] px-4 py-3 text-sm outline-none focus:border-[#d85b30]"
              placeholder="Enter email address"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-[#ead8ca] pt-4">
            <button
              type="button"
              onClick={() => {
                setMode('list');
                setError(null);
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
              {submitting ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      )}

      <ConfirmationModal
        isOpen={supplierToDelete !== null}
        title="Hapus Supplier"
        message={`Are you sure you want to delete supplier "${supplierToDelete?.name || ''}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={confirmDeleteSupplier}
        onCancel={() => setSupplierToDelete(null)}
      />
    </SellerModal>
  );
}
