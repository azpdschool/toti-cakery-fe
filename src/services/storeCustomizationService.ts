import { apiClient } from '@/api/client';

export interface StoreCustomizationLocale {
  hero_title: string | null;
  hero_subtitle: string | null;
  about_title: string | null;
  about_description: string | null;
}

export interface StoreCustomizationContent {
  id: StoreCustomizationLocale;
  en: StoreCustomizationLocale;
}

export interface StoreCustomizationData {
  content: StoreCustomizationContent;
  hero_image_url: string | null;
  store_address: string | null;
  maps_embed_url: string | null;
  updated_at: string;
}

export interface StoreCustomizationPatchPayload {
  content?: {
    id?: Partial<StoreCustomizationLocale>;
    en?: Partial<StoreCustomizationLocale>;
  };
  hero_image_url?: string | null;
  store_address?: string | null;
  maps_embed_url?: string | null;
}

/**
 * Standard fallback values matching initial store content.
 * Used when backend endpoints are unmigrated, unavailable (500/503), or return null fields.
 */
export const DEFAULT_STORE_CUSTOMIZATION: StoreCustomizationData = {
  content: {
    id: {
      hero_title: 'Kue Lezat,\nMomen Berkesan',
      hero_subtitle: 'Toti Cakery hadir dengan kue berkualitas, dibuat dari bahan pilihan untuk setiap momen spesial Anda.',
      about_title: 'Tentang Toti Cakery',
      about_description:
        'Toti Cakery adalah toko kue rumahan yang berdedikasi menghadirkan kue lezat dengan cita rasa istimewa. Setiap kue kami dibuat dengan penuh cinta dan perhatian pada detail, menggunakan bahan berkualitas terbaik.',
    },
    en: {
      hero_title: 'Delicious Cakes,\nMemorable Moments',
      hero_subtitle: 'Toti Cakery is here with quality cakes, made from selected ingredients for your every special moment.',
      about_title: 'About Toti Cakery',
      about_description:
        'Toti Cakery is a home bakery dedicated to presenting delicious cakes with a special taste. Every cake is made with love and attention to detail, using the best quality ingredients.',
    },
  },
  hero_image_url:
    'https://res.cloudinary.com/mrje22up/image/upload/v1790318553/SaveClip.App_618505350_17958279306045799_2574558123171612005_n.jpg',
  store_address: null,
  maps_embed_url:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.157534596183!2d103.95726197941448!3d1.0427912962325454!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31d98da3b87ec2f7%3A0x280a84339839dd69!2sToti%20Cakery!5e0!3m2!1sen!2sid!4v1782278391706!5m2!1sen!2sid',
  updated_at: new Date().toISOString(),
};

const CUSTOMIZATION_TTL_MS = 60_000;
let cachedCustomization: StoreCustomizationData | null = null;
let lastCustomizationFetchTime = 0;
let activeCustomizationRequest: Promise<StoreCustomizationData> | null = null;

export function invalidateStoreCustomizationCache(): void {
  cachedCustomization = null;
  lastCustomizationFetchTime = 0;
}

/**
 * Fetch public homepage CMS customization (bilingual content, banner, map & address).
 * Safely falls back to default store content if the server returns 500, 503, or network errors.
 */
export async function getStoreCustomization(forceRefresh: boolean = false): Promise<StoreCustomizationData> {
  const now = Date.now();
  if (!forceRefresh && cachedCustomization && now - lastCustomizationFetchTime < CUSTOMIZATION_TTL_MS) {
    return cachedCustomization;
  }

  if (!forceRefresh && activeCustomizationRequest) {
    return activeCustomizationRequest;
  }

  activeCustomizationRequest = (async () => {
    try {
      const response = await apiClient.get<StoreCustomizationData>('/public/store-customization');
      const data = response.data;
      if (!data || typeof data !== 'object') {
        cachedCustomization = DEFAULT_STORE_CUSTOMIZATION;
        lastCustomizationFetchTime = Date.now();
        return DEFAULT_STORE_CUSTOMIZATION;
      }

      const resolved: StoreCustomizationData = {
        content: {
          id: {
            hero_title: data.content?.id?.hero_title ?? DEFAULT_STORE_CUSTOMIZATION.content.id.hero_title,
            hero_subtitle: data.content?.id?.hero_subtitle ?? DEFAULT_STORE_CUSTOMIZATION.content.id.hero_subtitle,
            about_title: data.content?.id?.about_title ?? DEFAULT_STORE_CUSTOMIZATION.content.id.about_title,
            about_description: data.content?.id?.about_description ?? DEFAULT_STORE_CUSTOMIZATION.content.id.about_description,
          },
          en: {
            hero_title: data.content?.en?.hero_title ?? DEFAULT_STORE_CUSTOMIZATION.content.en.hero_title,
            hero_subtitle: data.content?.en?.hero_subtitle ?? DEFAULT_STORE_CUSTOMIZATION.content.en.hero_subtitle,
            about_title: data.content?.en?.about_title ?? DEFAULT_STORE_CUSTOMIZATION.content.en.about_title,
            about_description: data.content?.en?.about_description ?? DEFAULT_STORE_CUSTOMIZATION.content.en.about_description,
          },
        },
        hero_image_url: data.hero_image_url ?? DEFAULT_STORE_CUSTOMIZATION.hero_image_url,
        store_address: data.store_address ?? null,
        maps_embed_url: data.maps_embed_url ?? DEFAULT_STORE_CUSTOMIZATION.maps_embed_url,
        updated_at: data.updated_at || DEFAULT_STORE_CUSTOMIZATION.updated_at,
      };

      cachedCustomization = resolved;
      lastCustomizationFetchTime = Date.now();
      return resolved;
    } catch (err) {
      console.warn('[storeCustomizationService] GET /public/store-customization failed, using default fallbacks:', err);
      return DEFAULT_STORE_CUSTOMIZATION;
    } finally {
      activeCustomizationRequest = null;
    }
  })();

  return activeCustomizationRequest;
}

/**
 * Upload banner image to Cloudinary (Owner JWT required).
 * Constraints: JPEG, PNG, or WEBP, max 5 MB.
 */
export async function uploadHeroImage(file: File): Promise<{ hero_image_url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<{ hero_image_url: string }>(
    '/settings/store-customization/hero-image',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

/**
 * Partial update homepage CMS customization (Owner JWT required).
 * Pass null for fields to restore default fallbacks. Rate limit 5 req/min.
 */
export async function updateStoreCustomization(
  payload: StoreCustomizationPatchPayload
): Promise<StoreCustomizationData> {
  const response = await apiClient.patch<StoreCustomizationData>(
    '/settings/store-customization',
    payload
  );
  cachedCustomization = response.data;
  lastCustomizationFetchTime = Date.now();
  return response.data;
}
