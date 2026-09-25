import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { NotificationDropdown } from './NotificationDropdown';
import type { NotificationItem } from '@/types/notification';

export const NotificationBell: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    getNotificationText,
  } = useNotifications();

  if (!user) return null;

  const handleNotificationClick = (n: NotificationItem) => {
    markAsRead(n.id);
    setIsOpen(false);

    if (user.role === 'buyer') {
      navigate('/orders');
    } else {
      navigate('/seller/orders');
    }
  };

  const ariaLabel = unreadCount > 0
    ? t('notifications.aria_label_count', { count: unreadCount, defaultValue: `Notifikasi, ${unreadCount} belum dibaca` })
    : t('notifications.aria_label', 'Notifikasi');

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#6B4A3C] transition hover:bg-[#FDF9F5] hover:text-[#9B4A2F] focus:outline-none focus:ring-2 focus:ring-[#9B4A2F]/20"
        aria-label={ariaLabel}
        title={t('notifications.title', 'Notifikasi')}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#9B4A2F] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={loading}
        error={error}
        onRefresh={refresh}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onItemClick={handleNotificationClick}
        getNotificationText={getNotificationText}
      />
    </div>
  );
};
