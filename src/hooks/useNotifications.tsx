import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
  fetchNotificationsApi,
  fetchUnreadCountApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from '@/api/notification';
import type { NotificationItem } from '@/types/notification';

import { getTranslatedNotification, type TranslatedNotification } from '@/utils/notificationTranslator';
import { calculateToastDuration } from '@/components/ui/SmartToastBar';

const POLLING_INTERVAL_MS = 12000; // 12 seconds

export function useNotifications() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const currentLanguageRef = useRef(i18n.language);
  currentLanguageRef.current = i18n.language;

  const seenNotificationIdsRef = useRef<Set<number>>(new Set());
  const initialFetchDoneRef = useRef<boolean>(false);
  const lastFetchedRef = useRef<number>(0);

  const getNotificationText = useCallback((n: NotificationItem): TranslatedNotification => {
    return getTranslatedNotification(n, i18n.language);
  }, [i18n.language]);

  const loadNotifications = useCallback(async (showLoading = false, forceRefresh = false) => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const [listRes, countRes] = await Promise.all([
        fetchNotificationsApi(30, 0, forceRefresh),
        fetchUnreadCountApi(forceRefresh),
      ]);

      lastFetchedRef.current = Date.now();
      const list = Array.isArray(listRes) ? listRes : [];
      const count = typeof countRes === 'number' ? countRes : 0;

      setNotifications(list);
      setUnreadCount(count);

      // Trigger subtler toast for brand new unread persistent notifications discovered during polling
      list.forEach((n) => {
        if (!n.read_at && !seenNotificationIdsRef.current.has(n.id)) {
          if (initialFetchDoneRef.current) {
            const { title, message } = getTranslatedNotification(n, currentLanguageRef.current);
            const fullText = `${title}. ${message}`;
            const duration = calculateToastDuration(fullText);
            toast(
              <div>
                <p className="font-bold text-[#3A1F16]">{title}</p>
                <p className="mt-0.5 text-xs text-[#6B4A3C]">{message}</p>
              </div>,
              { duration }
            );
          }
          seenNotificationIdsRef.current.add(n.id);
        }
      });

      initialFetchDoneRef.current = true;
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError('Gagal memuat notifikasi.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user?.id, user?.role]);

  const markAsRead = async (id: number) => {
    try {
      const updated = await markNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: updated.read_at || new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsReadApi();
      const nowIso = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || nowIso })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    // Reuse cached notifications if fetched within 15 seconds (initial mount/route navigation)
    loadNotifications(false, false);

    const interval = setInterval(() => {
      loadNotifications(false, true);
    }, POLLING_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastFetchedRef.current >= 20000) {
          loadNotifications(false, true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, user?.role, loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: () => loadNotifications(true, true),
    markAsRead,
    markAllAsRead,
    getNotificationText,
  };
}
