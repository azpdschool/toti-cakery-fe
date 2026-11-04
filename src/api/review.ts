import { apiClient } from './client';

export interface ReviewImageOut {
  id: number;
  review_id?: number;
  image_url: string;
  created_at?: string;
}

export interface CreateReviewPayload {
  order_id: number;
  product_id: number;
  rating: number;
  comment: string;
  images?: File[];
}

export interface ReviewResponse {
  id: number;
  product_id: number;
  rating: number;
  comment: string;
  created_at: string;
  images?: ReviewImageOut[];
  product_name?: string;
  customer_name?: string;
  customer?: {
    nama: string;
  } | null;
  product?: {
    nama_produk: string;
    image_url?: string | null;
  } | null;
}

export async function createReviewAPI(payload: CreateReviewPayload): Promise<ReviewResponse> {
  if (payload.images && payload.images.length > 0) {
    const formData = new FormData();
    formData.append('order_id', String(payload.order_id));
    formData.append('product_id', String(payload.product_id));
    formData.append('rating', String(payload.rating));
    formData.append('comment', payload.comment);
    for (const image of payload.images) {
      formData.append('images', image);
    }
    const response = await apiClient.post<ReviewResponse>('/reviews/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  const response = await apiClient.post<ReviewResponse>('/reviews/', {
    order_id: payload.order_id,
    product_id: payload.product_id,
    rating: payload.rating,
    comment: payload.comment,
  });
  invalidateReviewsCache();
  return response.data;
}

export async function uploadReviewImagesAPI(reviewId: number, images: File[]): Promise<ReviewResponse> {
  const formData = new FormData();
  for (const img of images) {
    formData.append('images', img);
  }
  const response = await apiClient.post<ReviewResponse>(`/reviews/${reviewId}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  invalidateReviewsCache();
  return response.data;
}

export async function deleteReviewImageAPI(reviewId: number, imageId: number): Promise<{ deleted: boolean; review_id: number; image_id: number }> {
  const response = await apiClient.delete<{ deleted: boolean; review_id: number; image_id: number }>(`/reviews/${reviewId}/images/${imageId}`);
  invalidateReviewsCache();
  return response.data;
}

const REVIEW_CACHE_TTL = 10_000; // 10s short TTL

interface ReviewCacheEntry<T> {
  data: T;
  timestamp: number;
}

const productReviewsCache = new Map<number, ReviewCacheEntry<ReviewResponse[]>>();
const productReviewsInFlight = new Map<number, Promise<ReviewResponse[]>>();

const latestReviewsCache = new Map<number, ReviewCacheEntry<ReviewResponse[]>>();
const latestReviewsInFlight = new Map<number, Promise<ReviewResponse[]>>();

export function invalidateReviewsCache(): void {
  productReviewsCache.clear();
  productReviewsInFlight.clear();
  latestReviewsCache.clear();
  latestReviewsInFlight.clear();
}

export async function getProductReviewsAPI(
  productId: number,
  forceRefresh: boolean = false
): Promise<ReviewResponse[]> {
  const now = Date.now();
  if (!forceRefresh) {
    const cached = productReviewsCache.get(productId);
    if (cached && now - cached.timestamp < REVIEW_CACHE_TTL) {
      return cached.data;
    }
    if (productReviewsInFlight.has(productId)) {
      return productReviewsInFlight.get(productId)!;
    }
  }

  const promise = apiClient
    .get<ReviewResponse[]>(`/reviews/product/${productId}`)
    .then((response) => {
      const data = response.data;
      productReviewsCache.set(productId, { data, timestamp: Date.now() });
      return data;
    })
    .finally(() => {
      productReviewsInFlight.delete(productId);
    });

  productReviewsInFlight.set(productId, promise);
  return promise;
}

export async function getLatestReviewsAPI(
  limit: number = 6,
  forceRefresh: boolean = false
): Promise<ReviewResponse[]> {
  const now = Date.now();
  if (!forceRefresh) {
    const cached = latestReviewsCache.get(limit);
    if (cached && now - cached.timestamp < REVIEW_CACHE_TTL) {
      return cached.data;
    }
    if (latestReviewsInFlight.has(limit)) {
      return latestReviewsInFlight.get(limit)!;
    }
  }

  const promise = apiClient
    .get<ReviewResponse[]>(`/reviews/latest`, { params: { limit } })
    .then((response) => {
      const data = response.data;
      latestReviewsCache.set(limit, { data, timestamp: Date.now() });
      return data;
    })
    .finally(() => {
      latestReviewsInFlight.delete(limit);
    });

  latestReviewsInFlight.set(limit, promise);
  return promise;
}

