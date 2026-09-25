import {
  createReviewAPI,
  getProductReviewsAPI,
  getLatestReviewsAPI,
  deleteReviewImageAPI,
  CreateReviewPayload,
  ReviewResponse,
  ReviewImageOut,
} from '@/api/review';

export interface ReviewImage {
  id: number;
  reviewId?: number;
  imageUrl: string;
  createdAt?: string;
}

export interface SubmitReviewRequest {
  orderId: number;
  productId: number;
  rating: number;
  comment: string;
  images?: File[];
}

export function mapReviewImageOutToReviewImage(img: ReviewImageOut): ReviewImage {
  return {
    id: img.id,
    reviewId: img.review_id,
    imageUrl: img.image_url,
    createdAt: img.created_at,
  };
}

export async function submitReview(request: SubmitReviewRequest): Promise<ReviewResponse> {
  const payload: CreateReviewPayload = {
    order_id: request.orderId,
    product_id: request.productId,
    rating: request.rating,
    comment: request.comment,
    images: request.images,
  };
  return await createReviewAPI(payload);
}

export async function deleteReviewImage(reviewId: number, imageId: number): Promise<boolean> {
  const result = await deleteReviewImageAPI(reviewId, imageId);
  return result.deleted;
}

export async function getProductReviews(productId: number): Promise<ReviewResponse[]> {
  return await getProductReviewsAPI(productId);
}

export async function getLatestReviews(limit: number = 6): Promise<ReviewResponse[]> {
  return await getLatestReviewsAPI(limit);
}
