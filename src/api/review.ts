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
  order_id: number;
  product_id: number;
  customer_id: number;
  rating: number;
  comment: string;
  created_at: string;
  images?: ReviewImageOut[];
  product_name?: string;
  customer_name?: string;
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
  return response.data;
}

export async function deleteReviewImageAPI(reviewId: number, imageId: number): Promise<{ deleted: boolean; review_id: number; image_id: number }> {
  const response = await apiClient.delete<{ deleted: boolean; review_id: number; image_id: number }>(`/reviews/${reviewId}/images/${imageId}`);
  return response.data;
}

export async function getProductReviewsAPI(productId: number): Promise<ReviewResponse[]> {
  const response = await apiClient.get<ReviewResponse[]>(`/reviews/product/${productId}`);
  return response.data;
}

export async function getLatestReviewsAPI(limit: number = 6): Promise<ReviewResponse[]> {
  const response = await apiClient.get<ReviewResponse[]>(`/reviews/latest`, { params: { limit } });
  return response.data;
}
