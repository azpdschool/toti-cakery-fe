import { apiClient } from './client';
import type { ProductOut } from './product';

export async function getBuyerWishlistApi(): Promise<ProductOut[]> {
  const { data } = await apiClient.get<ProductOut[]>('/buyers/me/wishlist');
  return data;
}

export async function addToWishlistApi(productId: number): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(`/buyers/me/wishlist/${productId}`);
  return data;
}

export async function removeFromWishlistApi(productId: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(`/buyers/me/wishlist/${productId}`);
  return data;
}
