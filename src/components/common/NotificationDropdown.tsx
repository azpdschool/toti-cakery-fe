import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCheck, RefreshCw, BellOff } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import type { NotificationItem as NotificationItemType } from '@/types/notification';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItemType[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onItemClick: (notification: NotificationItemType) => void;
  getNotificationText: (n: NotificationItemType) => { title: string; message: string };
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  loading,
  error,
  onRefresh,
  onMarkAllAsRead,
  onItemClick,
  getNotificationText,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-transparent"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-label={t('notifications.title', 'Notifikasi')}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAD8CA] px-4 py-3 bg-[#FAF5EF]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#3A1F16]">
              {t('notifications.title', 'Notifikasi')}
            </h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#9B4A2F] px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 text-xs font-semibold text-[#9B4A2F] hover:text-[#7E3A24] transition"
              title={t('notifications.mark_all_read', 'Tandai Semua Dibaca')}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>{t('notifications.mark_all_read', 'Tandai Semua Dibaca')}</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="max-h-80 overflow-y-auto divide-y divide-[#F0E6DD]">
          {loading && notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#6B4A3C]">
              <RefreshCw className="mx-auto h-5 w-5 animate-spin text-[#9B4A2F] mb-2" />
              {t('notifications.loading', 'Memuat notifikasi...')}
            </div>
          ) : error ? (
            <div className="p-4 text-center text-xs text-red-600">
              <p>{error}</p>
              <button
                onClick={onRefresh}
                className="mt-2 rounded-md bg-[#9B4A2F] px-3 py-1 text-xs text-white font-semibold hover:bg-[#7E3A24]"
              >
                {t('notifications.retry', 'Coba Lagi')}
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#9C8478]">
              <BellOff className="mx-auto h-8 w-8 text-[#D0BFAF] mb-2" />
              <p className="font-semibold">{t('notifications.empty', 'Belum ada notifikasi')}</p>
            </div>
          ) : (
            notifications.map((n) => {
              const { title, message } = getNotificationText(n);
              return (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  title={title}
                  message={message}
                  onClick={onItemClick}
                />
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
