import { apiClient } from './client';
import type { NotificationItem, UnreadCountResponse } from '@/types/notification';

const NOTIF_CACHE_TTL = 15_000; // 15 seconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let notifCache: CacheEntry<NotificationItem[]> | null = null;
let notifInFlight: Promise<NotificationItem[]> | null = null;

let unreadCountCache: CacheEntry<number> | null = null;
let unreadCountInFlight: Promise<number> | null = null;

export function invalidateNotificationCache(): void {
  notifCache = null;
  unreadCountCache = null;
}

export async function fetchNotificationsApi(
  limit = 20,
  offset = 0,
  forceRefresh = false
): Promise<NotificationItem[]> {
  const now = Date.now();
  if (!forceRefresh && notifCache && now - notifCache.timestamp < NOTIF_CACHE_TTL) {
    return notifCache.data;
  }

  if (!forceRefresh && notifInFlight) {
    return notifInFlight;
  }

  const promise = apiClient
    .get<NotificationItem[]>('/notifications', {
      params: { limit, offset },
    })
    .then((res) => {
      const data = Array.isArray(res.data) ? res.data : [];
      notifCache = { data, timestamp: Date.now() };
      return data;
    })
    .finally(() => {
      notifInFlight = null;
    });

  notifInFlight = promise;
  return promise;
}

export async function fetchUnreadCountApi(forceRefresh = false): Promise<number> {
  const now = Date.now();
  if (!forceRefresh && unreadCountCache && now - unreadCountCache.timestamp < NOTIF_CACHE_TTL) {
    return unreadCountCache.data;
  }

  if (!forceRefresh && unreadCountInFlight) {
    return unreadCountInFlight;
  }

  const promise = apiClient
    .get<UnreadCountResponse>('/notifications/unread-count')
    .then((res) => {
      const count = res.data?.unread_count ?? 0;
      unreadCountCache = { data: count, timestamp: Date.now() };
      return count;
    })
    .finally(() => {
      unreadCountInFlight = null;
    });

  unreadCountInFlight = promise;
  return promise;
}

export async function markNotificationReadApi(id: number): Promise<NotificationItem> {
  invalidateNotificationCache();
  const res = await apiClient.patch<NotificationItem>(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsReadApi(): Promise<{ status: string; marked_read_count: number }> {
  invalidateNotificationCache();
  const res = await apiClient.post('/notifications/read-all');
  return res.data;
}

