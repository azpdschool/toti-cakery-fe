import { apiClient } from './client';
import type { ProductOut } from './product';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const WISHLIST_CACHE_TTL = 10_000; // 10 seconds

let wishlistCache: CacheEntry<ProductOut[]> | null = null;
let wishlistInFlight: Promise<ProductOut[]> | null = null;

export function invalidateWishlistCache(): void {
  wishlistCache = null;
  wishlistInFlight = null;
}

export async function getBuyerWishlistApi(forceRefresh = false): Promise<ProductOut[]> {
  const now = Date.now();
  if (!forceRefresh && wishlistCache && now - wishlistCache.timestamp < WISHLIST_CACHE_TTL) {
    return wishlistCache.data;
  }

  if (!forceRefresh && wishlistInFlight) {
    return wishlistInFlight;
  }

  const promise = apiClient
    .get<ProductOut[]>('/buyers/me/wishlist')
    .then((res) => {
      const data = res.data;
      wishlistCache = { data, timestamp: Date.now() };
      return data;
    })
    .finally(() => {
      wishlistInFlight = null;
    });

  wishlistInFlight = promise;
  return promise;
}

export async function addToWishlistApi(productId: number): Promise<{ message: string }> {
  invalidateWishlistCache();
  const { data } = await apiClient.post<{ message: string }>(`/buyers/me/wishlist/${productId}`);
  return data;
}

export async function removeFromWishlistApi(productId: number): Promise<{ message: string }> {
  invalidateWishlistCache();
  const { data } = await apiClient.delete<{ message: string }>(`/buyers/me/wishlist/${productId}`);
  return data;
}
