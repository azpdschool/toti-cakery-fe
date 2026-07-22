// src/services/sellerChatbotService.ts
import {
  createFaq,
  editFaq,
  getAllFaqs,
  getFaqById,
  removeFaq,
  type FaqOut,
} from '@/api/faq'

export type FaqStatus = 'active' | 'inactive'

export interface Faq {
  id: string
  question: string
  answer: string
  category: string
  status: FaqStatus
  order: number
  updatedBy: {
    name: string
    role: string
  }
  updatedAt: string
  createdAt: string
}

export interface FaqStats {
  total: number
  active: number
  inactive: number
  activePercentage: number
  inactivePercentage: number
  usedInChatbot: number
}

export type FaqCategory =
  | 'Umum'
  | 'Pesanan'
  | 'Pengiriman'
  | 'Pembayaran'
  | 'Produk'
  | 'Lainnya'

const categoryOptions: FaqCategory[] = [
  'Umum',
  'Pesanan',
  'Pengiriman',
  'Pembayaran',
  'Produk',
  'Lainnya',
]

function formatDateString(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return (
    date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) +
    ' · ' +
    date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  )
}

function mapFaqOutToFaq(item: FaqOut, index: number): Faq {
  return {
    id: String(item.id),
    question: item.pertanyaan,
    answer: item.jawaban,

    // Backend FAQ kamu belum punya field category.
    // Jadi sementara semua dibuat "Umum".
    category: 'Umum',

    status: item.is_active ? 'active' : 'inactive',

    // Backend belum punya field order.
    // Jadi order pakai urutan dari hasil API.
    order: index + 1,

    updatedBy: {
      name: item.created_by_username || 'Unknown',
      role: 'Admin/Owner',
    },

    updatedAt: formatDateString(item.updated_at || item.created_at),
    createdAt: formatDateString(item.created_at),
  }
}

export async function getChatbotFaqs(): Promise<Faq[]> {
  // Untuk halaman manage, ambil semua FAQ: aktif + nonaktif.
  const data = await getAllFaqs(false)

  return data.map(mapFaqOutToFaq)
}

export async function getChatbotStats(): Promise<FaqStats> {
  const faqs = await getAllFaqs(false)

  const total = faqs.length
  const active = faqs.filter((f) => f.is_active).length
  const inactive = faqs.filter((f) => !f.is_active).length

  const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0
  const inactivePercentage = total > 0 ? Math.round((inactive / total) * 100) : 0

  return {
    total,
    active,
    inactive,
    activePercentage,
    inactivePercentage,
    usedInChatbot: active,
  }
}

export async function getFaqCategories(): Promise<FaqCategory[]> {
  return categoryOptions
}

export async function addFaq(
  data: Omit<Faq, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy' | 'order'>,
): Promise<Faq> {
  const created = await createFaq({
    pertanyaan: data.question,
    jawaban: data.answer,
    is_active: data.status === 'active',
  })

  return mapFaqOutToFaq(created, 0)
}

export async function updateFaq(
  id: string,
  data: Partial<
    Omit<Faq, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy' | 'order'>
  >,
): Promise<Faq> {
  const updated = await editFaq(Number(id), {
    pertanyaan: data.question,
    jawaban: data.answer,
    is_active: data.status ? data.status === 'active' : undefined,
  })

  return mapFaqOutToFaq(updated, 0)
}

export async function deleteFaq(id: string): Promise<void> {
  await removeFaq(Number(id))
}

export async function toggleFaqStatus(id: string): Promise<Faq> {
  const current = await getFaqById(Number(id))

  const updated = await editFaq(Number(id), {
    is_active: !current.is_active,
  })

  return mapFaqOutToFaq(updated, 0)
}
