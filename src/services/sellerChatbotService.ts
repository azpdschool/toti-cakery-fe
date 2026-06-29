// src/services/sellerChatbotService.ts

export type FaqStatus = 'active' | 'inactive';

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  status: FaqStatus;
  order: number; // auto-generated, tidak perlu diinput user
  updatedBy: {
    name: string;
    role: string;
  };
  updatedAt: string;
  createdAt: string;
}

export interface FaqStats {
  total: number;
  active: number;
  inactive: number;
  activePercentage: number;
  inactivePercentage: number;
  usedInChatbot: number;
}

export type FaqCategory = 'Umum' | 'Pesanan' | 'Pengiriman' | 'Pembayaran' | 'Produk' | 'Lainnya';

// ============================================================
// DUMMY DATA
// ============================================================

const formatDate = (date: Date) => {
  return (
    date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) +
    ' · ' +
    date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  );
};

// Order sudah diatur berurutan (1, 2, 3, ...)
const dummyFaqs: Faq[] = [
  {
    id: '1',
    question: 'Apakah Toti Cakery menerima pesanan custom?',
    answer:
      'Ya, kami menerima pesanan custom untuk ulang tahun, wedding, hampers, dan acara lainnya.',
    category: 'Pesanan',
    status: 'inactive',
    order: 1,
    updatedBy: { name: 'Jake', role: 'Owner' },
    updatedAt: formatDate(new Date(2026, 4, 24, 10, 55)),
    createdAt: '2026-01-10',
  },
  {
    id: '2',
    question: 'Berapa lama proses pembuatan kue?',
    answer: 'Estimasi produksi 1–3 hari tergantung jenis dan jumlah pesanan.',
    category: 'Pesanan',
    status: 'active',
    order: 2,
    updatedBy: { name: 'Jake', role: 'Owner' },
    updatedAt: formatDate(new Date(2026, 4, 21, 10, 55)),
    createdAt: '2026-01-12',
  },
  {
    id: '3',
    question: 'Apakah bisa request desain sendiri?',
    answer: 'Bisa. Anda dapat mengirim referensi desain melalui WhatsApp atau Instagram.',
    category: 'Produk',
    status: 'active',
    order: 3,
    updatedBy: { name: 'Jake', role: 'Owner' },
    updatedAt: formatDate(new Date(2026, 4, 20, 11, 10)),
    createdAt: '2026-01-15',
  },
  {
    id: '4',
    question: 'Minimal order di Toti Cakery berapa?',
    answer: 'Minimal order custom cake mulai dari Rp150.000.',
    category: 'Pesanan',
    status: 'active',
    order: 4,
    updatedBy: { name: 'Jake', role: 'Owner' },
    updatedAt: formatDate(new Date(2026, 4, 20, 19, 20)),
    createdAt: '2026-01-18',
  },
  {
    id: '5',
    question: 'Metode pembayaran apa saja yang tersedia?',
    answer: 'Kami menerima QRIS, VA, serta pembayaran secara langsung di Toko.',
    category: 'Pembayaran',
    status: 'active',
    order: 5,
    updatedBy: { name: 'Jake', role: 'Owner' },
    updatedAt: formatDate(new Date(2026, 4, 20, 13, 40)),
    createdAt: '2026-01-20',
  },
  {
    id: '6',
    question: 'Apakah tersedia layanan delivery?',
    answer: 'Ya, kami menggunakan pihak ketiga untuk pengantaran kue.',
    category: 'Pengiriman',
    status: 'active',
    order: 6,
    updatedBy: { name: 'Jake', role: 'Owner' },
    updatedAt: formatDate(new Date(2026, 4, 20, 13, 40)),
    createdAt: '2026-01-22',
  },
  {
    id: '7',
    question: 'Apakah kue bisa same day order?',
    answer: 'Same day order hanya tersedia untuk produk ready stock tertentu.',
    category: 'Pesanan',
    status: 'active',
    order: 7,
    updatedBy: { name: 'Jake', role: 'Owner' },
    updatedAt: formatDate(new Date(2026, 4, 20, 13, 40)),
    createdAt: '2026-01-25',
  },
  {
    id: '8',
    question: 'Jam operasional Toti Cakery kapan?',
    answer: 'Kami buka setiap hari pukul 08.00–20.00 WIB.',
    category: 'Umum',
    status: 'active',
    order: 8,
    updatedBy: { name: 'Jake', role: 'Owner' },
    updatedAt: formatDate(new Date(2026, 4, 20, 13, 40)),
    createdAt: '2026-01-28',
  },
  {
    id: '9',
    question: 'Apakah bahan yang digunakan halal?',
    answer: 'Ya, seluruh bahan yang digunakan halal dan berkualitas premium.',
    category: 'Umum',
    status: 'active',
    order: 9,
    updatedBy: { name: 'Jake', role: 'Owner' },
    updatedAt: formatDate(new Date(2026, 4, 20, 13, 40)),
    createdAt: '2026-02-01',
  },
  {
    id: '10',
    question: 'Apakah bisa request tulisan di kue?',
    answer: 'Bisa, Anda dapat menambahkan tulisan sesuai keinginan.',
    category: 'Produk',
    status: 'active',
    order: 10,
    updatedBy: { name: 'Jake', role: 'Owner' },
    updatedAt: formatDate(new Date(2026, 4, 20, 13, 40)),
    createdAt: '2026-02-05',
  },
];

const categoryOptions: FaqCategory[] = ['Umum', 'Pesanan', 'Pengiriman', 'Pembayaran', 'Produk', 'Lainnya'];

// ============================================================
// SERVICE FUNCTIONS
// ============================================================

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getChatbotFaqs(): Promise<Faq[]> {
  await delay();
  return dummyFaqs;
}

export async function getChatbotStats(): Promise<FaqStats> {
  await delay();
  const total = dummyFaqs.length;
  const active = dummyFaqs.filter((f) => f.status === 'active').length;
  const inactive = dummyFaqs.filter((f) => f.status === 'inactive').length;
  const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;
  const inactivePercentage = total > 0 ? Math.round((inactive / total) * 100) : 0;
  return {
    total,
    active,
    inactive,
    activePercentage,
    inactivePercentage,
    usedInChatbot: active,
  };
}

export async function getFaqCategories(): Promise<FaqCategory[]> {
  await delay();
  return categoryOptions;
}

// ============================================================
// AUTO-GENERATE ORDER: ambil order tertinggi + 1
// ============================================================

export async function addFaq(
  data: Omit<Faq, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy' | 'order'>
): Promise<Faq> {
  await delay(500);
  const now = new Date();

  // Cari order tertinggi dari semua FAQ (termasuk yang nonaktif)
  const maxOrder = dummyFaqs.reduce((max, f) => Math.max(max, f.order), 0);
  const nextOrder = maxOrder + 1;

  const newFaq: Faq = {
    id: `faq-${Date.now()}`,
    ...data,
    order: nextOrder,
    updatedBy: { name: 'Jake', role: 'Owner' }, // nanti dari auth
    updatedAt: formatDate(now),
    createdAt: now.toISOString().split('T')[0],
  };
  dummyFaqs.unshift(newFaq);
  return newFaq;
}

export async function updateFaq(
  id: string,
  data: Partial<Omit<Faq, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy' | 'order'>>
): Promise<Faq> {
  await delay(500);
  const index = dummyFaqs.findIndex((f) => f.id === id);
  if (index === -1) throw new Error('FAQ tidak ditemukan');
  const updated = {
    ...dummyFaqs[index],
    ...data,
    // order TIDAK diubah saat edit
    updatedBy: { name: 'Jake', role: 'Owner' },
    updatedAt: formatDate(new Date()),
  };
  dummyFaqs[index] = updated;
  return updated;
}

export async function deleteFaq(id: string): Promise<void> {
  await delay(500);
  const index = dummyFaqs.findIndex((f) => f.id === id);
  if (index !== -1) dummyFaqs.splice(index, 1);
  // order tidak di-reorder, jadi ada gap (sesuai keinginan: "nomor urut tetap, yang nonaktif dilewati")
}

export async function toggleFaqStatus(id: string): Promise<Faq> {
  await delay(300);
  const faq = dummyFaqs.find((f) => f.id === id);
  if (!faq) throw new Error('FAQ tidak ditemukan');
  faq.status = faq.status === 'active' ? 'inactive' : 'active';
  faq.updatedBy = { name: 'Jake', role: 'Owner' };
  faq.updatedAt = formatDate(new Date());
  // order tetap, tidak berubah
  return faq;
}