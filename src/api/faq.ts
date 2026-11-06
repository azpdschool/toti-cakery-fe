// src/api/faq.ts
import { apiClient } from './client'

export interface FaqOut {
  id: number
  pertanyaan: string
  jawaban: string
  pertanyaan_en?: string | null
  jawaban_en?: string | null
  created_by: number
  is_active: boolean
  created_at: string
  updated_at: string | null
  created_by_username: string
}

export interface FaqCreatePayload {
  pertanyaan: string
  jawaban: string
  pertanyaan_en?: string | null
  jawaban_en?: string | null
  is_active?: boolean
}

export interface FaqUpdatePayload {
  pertanyaan?: string
  jawaban?: string
  pertanyaan_en?: string | null
  jawaban_en?: string | null
  is_active?: boolean
}

const FAQ_CACHE_TTL = 15_000; // 15 seconds

interface FaqCacheEntry {
  data: FaqOut[];
  timestamp: number;
}

const faqsCache = new Map<string, FaqCacheEntry>();
const activeFaqsRequests = new Map<string, Promise<FaqOut[]>>();

export function invalidateFaqsCache(): void {
  faqsCache.clear();
  activeFaqsRequests.clear();
}

export async function getAllFaqs(
  onlyActive: boolean = false,
  forceRefresh: boolean = false
): Promise<FaqOut[]> {
  const key = String(onlyActive);
  const now = Date.now();

  if (!forceRefresh) {
    const cached = faqsCache.get(key);
    if (cached && now - cached.timestamp < FAQ_CACHE_TTL) {
      return cached.data;
    }
    if (activeFaqsRequests.has(key)) {
      return activeFaqsRequests.get(key)!;
    }
  }

  const promise = apiClient.get<FaqOut[]>('/faq', {
    params: { only_active: onlyActive },
  })
    .then(response => {
      const data = response.data;
      faqsCache.set(key, { data, timestamp: Date.now() });
      return data;
    })
    .finally(() => {
      activeFaqsRequests.delete(key);
    });

  activeFaqsRequests.set(key, promise);
  return promise;
}

export async function getFaqById(id: number): Promise<FaqOut> {
  const response = await apiClient.get<FaqOut>(`/faq/${id}`)
  return response.data
}

export async function createFaq(payload: FaqCreatePayload): Promise<FaqOut> {
  invalidateFaqsCache();
  const response = await apiClient.post<FaqOut>('/faq', payload)
  return response.data
}

export async function editFaq(
  id: number,
  payload: FaqUpdatePayload,
): Promise<FaqOut> {
  invalidateFaqsCache();
  const response = await apiClient.put<FaqOut>(`/faq/${id}`, payload)
  return response.data
}

export async function removeFaq(id: number): Promise<void> {
  invalidateFaqsCache();
  await apiClient.delete(`/faq/${id}`)
}
