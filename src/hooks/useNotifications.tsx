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
import type { NotificationItem, NotificationMetadata } from '@/types/notification';

const POLLING_INTERVAL_MS = 12000; // 12 seconds

export function useNotifications() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const seenNotificationIdsRef = useRef<Set<number>>(new Set());
  const initialFetchDoneRef = useRef<boolean>(false);

  const formatStatus = useCallback((statusKey?: string): string => {
    if (!statusKey) return '';
    const map: Record<string, string> = {
      pending: t('orders.status_pending', 'Menunggu'),
      in_process: t('orders.status_processed', 'Diproses'),
      ready: t('orders.status_ready', 'Siap'),
      delivered: t('orders.status_delivered', 'Dikirim'),
      picked_up: t('orders.status_picked_up', 'Selesai / Diambil'),
      completed: t('orders.status_picked_up', 'Selesai'),
      cancelled: t('orders.status_cancelled', 'Dibatalkan'),
      refunded: t('orders.status_refunded', 'Direfund'),
    };
    return map[statusKey] || statusKey;
  }, [t]);

  const parseMetadata = (jsonStr?: string | null): NotificationMetadata => {
    if (!jsonStr) return {};
    try {
      return JSON.parse(jsonStr);
    } catch {
      return {};
    }
  };

  const getNotificationText = useCallback((n: NotificationItem) => {
    const meta = parseMetadata(n.metadata_json);
    const orderNum = meta.order_number || (n.order_id ? `ORDER-${n.order_id}` : '');

    if (n.type === 'order_created') {
      return {
        title: t('notifications.order_created_title', 'Pesanan Baru'),
        message: t('notifications.order_created_msg', { orderNumber: orderNum, defaultValue: `Pesanan ${orderNum} telah dibuat.` }),
      };
    }

    if (n.type === 'order_status_updated') {
      const statusLabel = formatStatus(meta.status);
      return {
        title: t('notifications.order_status_updated_title', 'Status Pesanan Diperbarui'),
        message: t('notifications.order_status_updated_msg', { orderNumber: orderNum, status: statusLabel, defaultValue: `Status pesanan ${orderNum} sekarang ${statusLabel}.` }),
      };
    }

    if (n.type === 'order_cancelled') {
      return {
        title: t('notifications.order_cancelled_title', 'Pesanan Dibatalkan'),
        message: t('notifications.order_cancelled_msg', { orderNumber: orderNum, defaultValue: `Pesanan ${orderNum} telah dibatalkan.` }),
      };
    }

    return {
      title: t('notifications.title', 'Notifikasi'),
      message: meta.order_number ? `Order ${meta.order_number}` : '',
    };
  }, [t, formatStatus]);

  const loadNotifications = useCallback(async (showLoading = false) => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const [listRes, countRes] = await Promise.all([
        fetchNotificationsApi(30, 0),
        fetchUnreadCountApi(),
      ]);

      const list = Array.isArray(listRes) ? listRes : [];
      const count = typeof countRes === 'number' ? countRes : 0;

      setNotifications(list);
      setUnreadCount(count);

      // Trigger subtler toast for brand new unread persistent notifications discovered during polling
      list.forEach((n) => {
        if (!n.read_at && !seenNotificationIdsRef.current.has(n.id)) {
          if (initialFetchDoneRef.current) {
            const { title, message } = getNotificationText(n);
            toast.custom((tToast) => (
              <div
                className={`${
                  tToast.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-3`}
              >
                <div className="flex-1 w-0">
                  <p className="text-xs font-bold text-[#3A1F16]">{title}</p>
                  <p className="mt-0.5 text-xs text-[#6B4A3C]">{message}</p>
                </div>
              </div>
            ), { duration: 4000 });
          }
          seenNotificationIdsRef.current.add(n.id);
        }
      });

      initialFetchDoneRef.current = true;
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError(t('notifications.error', 'Gagal memuat notifikasi.'));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user, getNotificationText, t]);

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
    if (!user) return;

    loadNotifications(true);

    const interval = setInterval(() => {
      loadNotifications(false);
    }, POLLING_INTERVAL_MS);

    const handleFocus = () => {
      loadNotifications(false);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user, loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: () => loadNotifications(true),
    markAsRead,
    markAllAsRead,
    getNotificationText,
  };
}
