// src/api/recipe.ts
import { apiClient } from './client';

export type ApiDecimal = string | number;

export interface RecipeCreate {
  stock_item_id: number;
  jumlah_dibutuhkan: number | string;
}

export interface RecipeUpdate {
  jumlah_dibutuhkan: number | string;
}

export interface RecipeOut {
  id: number;
  product_id: number;
  stock_item_id: number;
  jumlah_dibutuhkan: ApiDecimal;

  nama_bahan: string | null;
  satuan: string | null;
  harga_per_satuan: ApiDecimal | null;
  biaya_bahan: ApiDecimal | null;

  created_at: string | null;
}

export interface RecipeSummary {
  product_id: number;
  nama_produk: string;
  hpp_total: ApiDecimal;
  bahan: RecipeOut[];
}

export async function getProductRecipes(
  productId: number
): Promise<RecipeSummary> {
  const response = await apiClient.get<RecipeSummary>(
    `/recipes/${productId}/recipes/`
  );

  return response.data;
}

export async function addRecipeIngredient(
  productId: number,
  payload: RecipeCreate
): Promise<RecipeSummary> {
  const response = await apiClient.post<RecipeSummary>(
    `/recipes/${productId}/recipes/`,
    payload
  );

  return response.data;
}

export async function updateRecipeIngredient(
  productId: number,
  recipeId: number,
  payload: RecipeUpdate
): Promise<RecipeSummary> {
  const response = await apiClient.put<RecipeSummary>(
    `/recipes/${productId}/recipes/${recipeId}`,
    payload
  );

  return response.data;
}

export async function deleteRecipeIngredient(
  productId: number,
  recipeId: number
): Promise<RecipeSummary> {
  const response = await apiClient.delete<RecipeSummary>(
    `/recipes/${productId}/recipes/${recipeId}`
  );

  return response.data;
}
