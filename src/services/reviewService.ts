import { createReviewAPI, getProductReviewsAPI, CreateReviewPayload, ReviewResponse } from '@/api/review';

export interface SubmitReviewRequest {
  orderId: number;
  productId: number;
  rating: number;
  comment: string;
}

export async function submitReview(request: SubmitReviewRequest): Promise<ReviewResponse> {
  const payload: CreateReviewPayload = {
    order_id: request.orderId,
    product_id: request.productId,
    rating: request.rating,
    comment: request.comment,
  };
  return await createReviewAPI(payload);
}

export async function getProductReviews(productId: number): Promise<ReviewResponse[]> {
  return await getProductReviewsAPI(productId);
}
