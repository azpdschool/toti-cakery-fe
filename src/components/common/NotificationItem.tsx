import React from 'react';
import { ShoppingBag, RefreshCw, XCircle, Bell } from 'lucide-react';
import type { NotificationItem as NotificationItemType } from '@/types/notification';

interface NotificationItemProps {
  notification: NotificationItemType;
  title: string;
  message: string;
  onClick: (notification: NotificationItemType) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  title,
  message,
  onClick,
}) => {
  const isUnread = !notification.read_at;

  const getIcon = () => {
    switch (notification.type) {
      case 'order_created':
        return <ShoppingBag className="h-4 w-4 text-[#9B4A2F]" />;
      case 'order_status_updated':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case 'order_cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-amber-600" />;
    }
  };

  const timeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={() => onClick(notification)}
      className={`group flex items-start gap-3 p-3 text-left transition cursor-pointer border-b border-[#F0E6DD] last:border-b-0 hover:bg-[#FDF9F5] ${
        isUnread ? 'bg-[#FAF0E6]/60 font-medium' : 'bg-white text-gray-700'
      }`}
    >
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        isUnread ? 'bg-[#F5E6D8]' : 'bg-gray-100'
      }`}>
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs ${isUnread ? 'font-bold text-[#3A1F16]' : 'font-semibold text-gray-800'} truncate`}>
            {title}
          </p>
          {isUnread && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#9B4A2F]" aria-label="Unread" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-[#6B4A3C] line-clamp-2 leading-relaxed">
          {message}
        </p>
        <span className="mt-1 block text-[10px] text-[#9C8478]">
          {timeAgo(notification.created_at)}
        </span>
      </div>
    </div>
  );
};
