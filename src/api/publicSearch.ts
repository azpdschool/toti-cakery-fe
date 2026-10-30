// src/api/publicSearch.ts
import { apiClient } from './client'

export interface PublicProductSearchResult {
  id: number
  nama_produk: string
  slug: string | null
  deskripsi: string | null
  kategori: string | null
  harga_jual: number | null
  image_url: string | null
}

export interface PublicFaqSearchResult {
  id: number
  pertanyaan: string
  jawaban: string
}

export interface PublicStoreInfoSearchResult {
  key: 'contact'
  title: string
  description: string
  action: 'fetch_contact_endpoint'
}

export interface PublicSearchResponse {
  query: string
  products: PublicProductSearchResult[]
  faqs: PublicFaqSearchResult[]
  store_info: PublicStoreInfoSearchResult[]
  total: number
}

export async function publicSearch(
  query: string,
  signal?: AbortSignal,
): Promise<PublicSearchResponse> {
  const response = await apiClient.get<PublicSearchResponse>('/public/search', {
    params: { q: query },
    signal,
  })
  return response.data
}
