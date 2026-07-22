// src/api/faq.ts
import { apiClient } from './client'

export interface FaqOut {
  id: number
  pertanyaan: string
  jawaban: string
  created_by: number
  is_active: boolean
  created_at: string
  updated_at: string | null
  created_by_username: string
}

export interface FaqCreatePayload {
  pertanyaan: string
  jawaban: string
  is_active?: boolean
}

export interface FaqUpdatePayload {
  pertanyaan?: string
  jawaban?: string
  is_active?: boolean
}

export async function getAllFaqs(
  onlyActive: boolean = false,
): Promise<FaqOut[]> {
  const response = await apiClient.get<FaqOut[]>('/faq', {
    params: { only_active: onlyActive },
  })

  return response.data
}

export async function getFaqById(id: number): Promise<FaqOut> {
  const response = await apiClient.get<FaqOut>(`/faq/${id}`)
  return response.data
}

export async function createFaq(payload: FaqCreatePayload): Promise<FaqOut> {
  const response = await apiClient.post<FaqOut>('/faq', payload)
  return response.data
}

export async function editFaq(
  id: number,
  payload: FaqUpdatePayload,
): Promise<FaqOut> {
  const response = await apiClient.put<FaqOut>(`/faq/${id}`, payload)
  return response.data
}

export async function removeFaq(id: number): Promise<void> {
  await apiClient.delete(`/faq/${id}`)
}
