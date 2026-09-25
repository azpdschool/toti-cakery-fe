import { apiClient } from './client';
import type { NotificationItem, UnreadCountResponse } from '@/types/notification';

export async function fetchNotificationsApi(limit = 20, offset = 0): Promise<NotificationItem[]> {
  const res = await apiClient.get<NotificationItem[]>('/notifications', {
    params: { limit, offset },
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchUnreadCountApi(): Promise<number> {
  const res = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
  return res.data?.unread_count ?? 0;
}

export async function markNotificationReadApi(id: number): Promise<NotificationItem> {
  const res = await apiClient.patch<NotificationItem>(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsReadApi(): Promise<{ status: string; marked_read_count: number }> {
  const res = await apiClient.post('/notifications/read-all');
  return res.data;
}
