import { apiClient } from '@/api/client';

export type WhatsAppState = 'tersambung' | 'menunggu_scan' | 'terputus';

export interface WhatsAppStatus {
  keadaan: WhatsAppState;
  nomor: string | null;
  profile_name: string | null;
}

export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  const response = await apiClient.get('/admin/whatsapp/status');
  return response.data;
}

export async function getWhatsAppQr(): Promise<Blob> {
  const response = await apiClient.get('/admin/whatsapp/qr', {
    responseType: 'blob',
  });
  return response.data;
}

export async function resetWhatsAppNumber(): Promise<void> {
  await apiClient.post('/admin/whatsapp/ganti-nomor');
  invalidatePublicContactCache();
}

const CONTACT_TTL_MS = 60_000;

interface CachedContact {
  data: { whatsapp: string };
  timestamp: number;
}

let cachedContact: CachedContact | null = null;
let publicContactPromise: Promise<{ whatsapp: string }> | null = null;

export function invalidatePublicContactCache(): void {
  cachedContact = null;
  publicContactPromise = null;
}

export const clearPublicContactCache = invalidatePublicContactCache;

export async function getPublicContact(forceRefresh: boolean = false): Promise<{ whatsapp: string }> {
  const now = Date.now();
  if (!forceRefresh && cachedContact && now - cachedContact.timestamp < CONTACT_TTL_MS) {
    return cachedContact.data;
  }

  if (forceRefresh) {
    cachedContact = null;
    publicContactPromise = null;
  }

  if (!publicContactPromise) {
    publicContactPromise = apiClient
      .get<{ whatsapp: string }>('/public/kontak-toko')
      .then((res) => {
        cachedContact = { data: res.data, timestamp: Date.now() };
        return res.data;
      })
      .catch((err) => {
        cachedContact = null;
        publicContactPromise = null; // Clear cache on error so it can be retried
        throw err;
      })
      .finally(() => {
        publicContactPromise = null;
      });
  }
  return publicContactPromise;
}
