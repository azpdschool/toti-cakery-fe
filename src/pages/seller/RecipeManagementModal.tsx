import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { SellerModal } from '@/components/ui/SellerModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
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
      setError('Ingredient quantity must be greater than 0');
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
      setError(err.response?.data?.detail || err.message || 'Failed to add ingredient');
    } finally {
      setSaving(false);
    }
  };

  const [recipeToDeleteId, setRecipeToDeleteId] = useState<number | null>(null);

  const confirmDeleteRecipe = async () => {
    if (!recipeToDeleteId) return;
    const recipeId = recipeToDeleteId;
    setRecipeToDeleteId(null);
    setError(null);
    try {
      await deleteRecipeIngredient(productId, recipeId);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete material.');
    }
  };

  return (
    <SellerModal isOpen={true} onClose={onClose} title={`Recipe: ${productName}`} size="2xl">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="mb-6 rounded-lg border bg-gray-50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Add Ingredient</h3>
        <div className="flex items-end gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex-1 w-full sm:w-auto">
            <label className="mb-1 block text-xs text-gray-500">Select Ingredient (from Inventory)</label>
            <select
              value={selectedStockId}
              onChange={e => setSelectedStockId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded border px-3 py-2 text-sm outline-none bg-white"
            >
              <option value="">-- Select Ingredient --</option>
              {ingredients.map(ing => (
                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-32">
            <label className="mb-1 block text-xs text-gray-500">Quantity</label>
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
            className="flex w-full sm:w-auto justify-center items-center gap-2 rounded bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#b84a24] transition-colors h-[38px]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </button>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-left text-sm relative">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-2 font-semibold">Ingredient Name</th>
              <th className="px-4 py-2 font-semibold text-right">Quantity</th>
              <th className="px-4 py-2 font-semibold">Unit</th>
              <th className="px-4 py-2 font-semibold text-center">Actions</th>
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
                  No ingredients in this recipe yet.
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
                      onClick={() => setRecipeToDeleteId(recipe.id)}
                      className="rounded p-1 text-red-500 hover:bg-red-50"
                      title="Delete"
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

      <ConfirmationModal
        isOpen={recipeToDeleteId !== null}
        title="Hapus Bahan"
        message="Are you sure you want to delete this ingredient from the recipe?"
        confirmText="Hapus"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={confirmDeleteRecipe}
        onCancel={() => setRecipeToDeleteId(null)}
      />
    </SellerModal>
  );
}
