// src/api/faq.ts
import { apiClient } from './client';

export interface FaqOut {
  id: number;
  pertanyaan: string;
  jawaban: string;
  created_by: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  created_by_username: string;
}

export async function getAllFaqs(onlyActive: boolean = true): Promise<FaqOut[]> {
  const response = await apiClient.get<FaqOut[]>('/faq', {
    params: { only_active: onlyActive },
  });
  return response.data;
}