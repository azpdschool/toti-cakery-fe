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

export interface NormalizedReview {
  id: number;
  productId: number;
  rating: number;
  comment: string;
  createdAt: string;
  customerName: string;
  productName: string;
  productImageUrl?: string | null;
  images: ReviewImage[];
}

export function getReviewCustomerName(r: ReviewResponse): string {
  return r.customer?.nama || r.customer_name || 'Pelanggan';
}

export function getReviewProductName(r: ReviewResponse): string {
  return r.product?.nama_produk || r.product_name || 'Produk';
}

export function getReviewProductImageUrl(r: ReviewResponse): string | null {
  return r.product?.image_url || null;
}

export function normalizeReview(r: ReviewResponse): NormalizedReview {
  return {
    id: r.id,
    productId: r.product_id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
    customerName: getReviewCustomerName(r),
    productName: getReviewProductName(r),
    productImageUrl: getReviewProductImageUrl(r),
    images: (r.images || []).map(mapReviewImageOutToReviewImage),
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
