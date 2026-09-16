import { apiClient } from './client';

export interface CreateReviewPayload {
  order_id: number;
  product_id: number;
  rating: number;
  comment: string;
}

export interface ReviewResponse {
  id: number;
  order_id: number;
  product_id: number;
  customer_id: number;
  rating: number;
  comment: string;
  created_at: string;
}

export async function createReviewAPI(payload: CreateReviewPayload): Promise<ReviewResponse> {
  const response = await apiClient.post<ReviewResponse>('/reviews/', payload);
  return response.data;
}

export async function getProductReviewsAPI(productId: number): Promise<ReviewResponse[]> {
  const response = await apiClient.get<ReviewResponse[]>(`/reviews/product/${productId}`);
  return response.data;
}
