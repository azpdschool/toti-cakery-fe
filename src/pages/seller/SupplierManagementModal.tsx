import { useEffect, useState } from 'react';
import type React from 'react';
import { X, Plus, Edit, Trash2 } from 'lucide-react';
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
  const [formData, setFormData] = useState({ nama_supplier: '' });
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

  if (!isOpen) return null;

  const handleAdd = () => {
    setFormData({ nama_supplier: '' });
    setMode('add');
  };

  const handleEdit = (supplier: SupplierOut) => {
    setFormData({ nama_supplier: supplier.nama_supplier });
    setEditingId(supplier.id);
    setMode('edit');
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Hapus supplier "${name}"?`)) return;
    
    try {
      setError(null);
      await supplierService.deleteSupplier(id);
      await loadSuppliers();
    } catch (err) {
      console.error(err);
      setError('Gagal menghapus supplier');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_supplier.trim()) {
      alert('Nama supplier wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      if (mode === 'add') {
        await supplierService.createSupplier({ nama_supplier: formData.nama_supplier.trim() });
      } else if (mode === 'edit' && editingId !== null) {
        await supplierService.updateSupplier(editingId, { nama_supplier: formData.nama_supplier.trim() });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#4b2417]">
            {mode === 'list' ? 'Manajemen Supplier' : mode === 'add' ? 'Tambah Supplier' : 'Edit Supplier'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {mode === 'list' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAdd}
                className="flex items-center gap-1 rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28]"
              >
                <Plus className="h-4 w-4" /> Tambah
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-gray-500">Memuat...</div>
            ) : suppliers.length === 0 ? (
              <div className="py-8 text-center text-gray-500">Tidak ada supplier.</div>
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Nama Supplier</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map(supplier => (
                      <tr key={supplier.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-gray-800">{supplier.nama_supplier}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(supplier)}
                              className="rounded p-1 text-gray-500 hover:bg-gray-100"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(supplier.id, supplier.nama_supplier)}
                              className="rounded p-1 text-red-500 hover:bg-red-50"
                              title="Hapus"
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">Nama Supplier</label>
              <input
                type="text"
                value={formData.nama_supplier}
                onChange={e => setFormData({ nama_supplier: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#d0bfaf] px-4 py-3 text-sm outline-none focus:border-[#d85b30]"
                placeholder="Masukkan nama supplier"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setMode('list')}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-60"
              >
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
