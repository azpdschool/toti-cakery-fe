import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { getProductRecipes, addRecipeIngredient, deleteRecipeIngredient, type RecipeOut } from '@/api/recipe';
import { getInventoryOptions, type InventoryOption } from '@/services/sellerInventoryService';

interface RecipeManagementModalProps {
  productId: number;
  productName: string;
  onClose: () => void;
}

export default function RecipeManagementModal({ productId, productName, onClose }: RecipeManagementModalProps) {
  const [recipes, setRecipes] = useState<RecipeOut[]>([]);
  const [ingredients, setIngredients] = useState<InventoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStockId, setSelectedStockId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recipeData, stockData] = await Promise.all([
        getProductRecipes(productId),
        getInventoryOptions()
      ]);
      setRecipes(recipeData.bahan || []);
      setIngredients(stockData || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load recipe data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedStockId || !quantity) return;
    const qtyNum = Number(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError('Jumlah bahan harus lebih dari 0');
      return;
    }
    
    setSaving(true);
    setError(null);
    try {
      await addRecipeIngredient(productId, {
        stock_item_id: Number(selectedStockId),
        jumlah_dibutuhkan: qtyNum
      });
      setSelectedStockId('');
      setQuantity('');
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || 'Gagal menambah bahan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recipeId: number) => {
    if (!window.confirm('Hapus bahan ini dari resep?')) return;
    setError(null);
    try {
      await deleteRecipeIngredient(productId, recipeId);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError('Gagal menghapus bahan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-bold text-[#4b2417]">Resep: {productName}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="mb-6 rounded-lg border bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Tambah Bahan Baku</h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Pilih Bahan (dari Stok)</label>
              <select
                value={selectedStockId}
                onChange={e => setSelectedStockId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded border px-3 py-2 text-sm outline-none"
              >
                <option value="">-- Pilih Bahan --</option>
                {ingredients.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="mb-1 block text-xs text-gray-500">Jumlah/Qty</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm outline-none"
                placeholder="0.00"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={saving || !selectedStockId || !quantity || Number(quantity) <= 0}
              className="flex items-center gap-2 rounded bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#b84a24] transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tambah
            </button>
          </div>
        </div>

        <div className="max-h-[45vh] overflow-y-auto rounded-lg border">
          <table className="w-full text-left text-sm relative">
            <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
              <tr>
                <th className="px-4 py-2 font-semibold">Nama Bahan</th>
                <th className="px-4 py-2 font-semibold text-right">Jumlah</th>
                <th className="px-4 py-2 font-semibold">Satuan</th>
                <th className="px-4 py-2 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : recipes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    Belum ada bahan dalam resep ini.
                  </td>
                </tr>
              ) : (
                recipes.map(recipe => (
                  <tr key={recipe.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{recipe.nama_bahan}</td>
                    <td className="px-4 py-3 text-right">{String(recipe.jumlah_dibutuhkan)}</td>
                    <td className="px-4 py-3 text-gray-500">{recipe.satuan}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(recipe.id)}
                        className="rounded p-1 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
