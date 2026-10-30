import type { NotificationItem, NotificationMetadata } from '@/types/notification';

export interface TranslatedNotification {
  title: string;
  message: string;
  statusLabel?: string;
  badgeLabel?: string;
}

export function parseNotificationMetadata(jsonStr?: string | null): NotificationMetadata {
  if (!jsonStr) return {};
  try {
    return JSON.parse(jsonStr);
  } catch {
    return {};
  }
}

export function formatNotificationStatus(statusKey?: string, lang: string = 'id'): string {
  if (!statusKey) return '';
  const isEn = lang === 'en';

  const map: Record<string, { id: string; en: string }> = {
    pending: { id: 'Menunggu Pembayaran', en: 'Pending Payment' },
    waiting_confirmation: { id: 'Menunggu Konfirmasi', en: 'Pending Confirmation' },
    in_process: { id: 'Sedang Diproses', en: 'In Process' },
    processed: { id: 'Sedang Diproses', en: 'In Process' },
    ready: { id: 'Siap Diambil', en: 'Ready for Pickup' },
    delivered: { id: 'Sedang Dikirim', en: 'Out for Delivery' },
    shipped: { id: 'Sedang Dikirim', en: 'Out for Delivery' },
    picked_up: { id: 'Telah Diambil', en: 'Picked Up' },
    completed: { id: 'Selesai', en: 'Completed' },
    cancelled: { id: 'Dibatalkan', en: 'Cancelled' },
    cancelled_settlement_expired: { id: 'Pelunasan Kedaluwarsa', en: 'Settlement Expired' },
    refunded: { id: 'Dana Dikembalikan', en: 'Refunded' },
  };

  const cleanKey = statusKey.toLowerCase().trim();
  if (map[cleanKey]) {
    return isEn ? map[cleanKey].en : map[cleanKey].id;
  }

  // Fallback: title-case snake_case keys
  return statusKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Translates message text containing common Indonesian or English patterns.
 */
export function translateNotificationMessage(rawText: string, lang: string = 'id'): string {
  if (!rawText) return '';
  const isEn = lang === 'en';

  if (isEn) {
    let text = rawText;
    text = text.replace(/pesanan dibuat/gi, 'order placed');
    text = text.replace(/pesanan baru/gi, 'new order');
    text = text.replace(/pembayaran diterima/gi, 'payment received');
    text = text.replace(/pembayaran berhasil/gi, 'payment verified');
    text = text.replace(/dp diterima/gi, 'down payment received');
    text = text.replace(/pesanan sedang diproses/gi, 'order is being processed');
    text = text.replace(/siap diambil/gi, 'ready for pickup');
    text = text.replace(/siap dikirim/gi, 'ready for delivery');
    text = text.replace(/sedang dikirim/gi, 'out for delivery');
    text = text.replace(/pesanan selesai/gi, 'order completed');
    text = text.replace(/pesanan dibatalkan/gi, 'order cancelled');
    text = text.replace(/pelunasan berakhir/gi, 'settlement deadline expired');
    text = text.replace(/pelunasan kedaluwarsa/gi, 'settlement expired');
    text = text.replace(/stok menipis/gi, 'stock is running low');
    text = text.replace(/melewati batas waktu/gi, 'past its fulfillment deadline');
    text = text.replace(/telah berhasil dibuat/gi, 'has been successfully placed');
    text = text.replace(/telah dibuat/gi, 'has been created');
    text = text.replace(/telah dibatalkan/gi, 'has been cancelled');
    text = text.replace(/sekarang/gi, 'is now');
    text = text.replace(/Pesanan/g, 'Order');
    return text;
  }

  // Indonesian translation if raw string has English patterns
  let text = rawText;
  text = text.replace(/order placed/gi, 'pesanan dibuat');
  text = text.replace(/new order/gi, 'pesanan baru');
  text = text.replace(/payment received/gi, 'pembayaran diterima');
  text = text.replace(/down payment received/gi, 'DP diterima');
  text = text.replace(/in process/gi, 'sedang diproses');
  text = text.replace(/ready for pickup/gi, 'siap diambil');
  text = text.replace(/out for delivery/gi, 'sedang dikirim');
  text = text.replace(/order completed/gi, 'pesanan selesai');
  text = text.replace(/order cancelled/gi, 'pesanan dibatalkan');
  text = text.replace(/settlement expired/gi, 'pelunasan kedaluwarsa');
  text = text.replace(/has been successfully placed/gi, 'telah berhasil dibuat');
  text = text.replace(/has been cancelled/gi, 'telah dibatalkan');
  text = text.replace(/Order/g, 'Pesanan');
  return text;
}

export function getTranslatedNotification(
  notification: NotificationItem,
  lang: string = 'id'
): TranslatedNotification {
  const isEn = lang === 'en';
  const meta = parseNotificationMetadata(notification.metadata_json);
  const orderNum = meta.order_number || (notification.order_id ? `ORDER-${notification.order_id}` : '');
  const type = (notification.type || '').toLowerCase();

  switch (type) {
    case 'order_created':
      return {
        title: isEn ? 'New Order Placed' : 'Pesanan Baru Dibuat',
        message: isEn
          ? `Order ${orderNum} has been placed successfully.`
          : `Pesanan ${orderNum} telah berhasil dibuat.`,
        badgeLabel: isEn ? 'New Order' : 'Pesanan Baru',
      };

    case 'order_status_updated': {
      const statusLabel = formatNotificationStatus(meta.status, lang);
      return {
        title: isEn ? 'Order Status Updated' : 'Status Pesanan Diperbarui',
        message: isEn
          ? `Order ${orderNum} is now ${statusLabel}.`
          : `Status pesanan ${orderNum} sekarang ${statusLabel}.`,
        statusLabel,
        badgeLabel: statusLabel,
      };
    }

    case 'order_cancelled':
      return {
        title: isEn ? 'Order Cancelled' : 'Pesanan Dibatalkan',
        message: isEn
          ? `Order ${orderNum} has been cancelled.`
          : `Pesanan ${orderNum} telah dibatalkan.`,
        badgeLabel: isEn ? 'Cancelled' : 'Dibatalkan',
      };

    case 'order_overdue':
      return {
        title: isEn ? 'Order Overdue' : 'Pesanan Melewati Batas Waktu',
        message: isEn
          ? `Order ${orderNum} is past its fulfillment deadline.`
          : `Pesanan ${orderNum} telah melewati batas waktu pemenuhan.`,
        badgeLabel: isEn ? 'Overdue' : 'Terlambat',
      };

    case 'order_cancelled_unpaid':
      return {
        title: isEn ? 'Order Cancelled (Payment Expired)' : 'Pesanan Dibatalkan Otomatis',
        message: isEn
          ? `Order ${orderNum} was automatically cancelled due to expired payment deadline.`
          : `Pesanan ${orderNum} dibatalkan otomatis karena batas waktu pembayaran habis.`,
        badgeLabel: isEn ? 'Payment Expired' : 'Pembayaran Kedaluwarsa',
      };

    case 'payment_received':
    case 'payment_success':
      return {
        title: isEn ? 'Payment Received' : 'Pembayaran Diterima',
        message: isEn
          ? `Payment for order ${orderNum} has been successfully verified.`
          : `Pembayaran untuk pesanan ${orderNum} telah berhasil diverifikasi.`,
        badgeLabel: isEn ? 'Paid' : 'Lunas',
      };

    case 'dp_received':
    case 'partial_payment_received':
      return {
        title: isEn ? 'Down Payment Received' : 'DP Diterima',
        message: isEn
          ? `50% down payment for order ${orderNum} has been verified.`
          : `Uang muka 50% untuk pesanan ${orderNum} telah berhasil diverifikasi.`,
        badgeLabel: isEn ? 'DP Paid' : 'DP Diterima',
      };

    case 'settlement_expired':
      return {
        title: isEn ? 'Settlement Deadline Expired' : 'Batas Pelunasan Kedaluwarsa',
        message: isEn
          ? `The settlement payment deadline for order ${orderNum} has expired.`
          : `Batas waktu pelunasan untuk pesanan ${orderNum} telah berakhir.`,
        badgeLabel: isEn ? 'Settlement Expired' : 'Pelunasan Kedaluwarsa',
      };

    case 'low_stock':
    case 'stok_menipis':
      return {
        title: isEn ? 'Low Stock Alert' : 'Peringatan Stok Menipis',
        message: isEn
          ? 'Ingredient or product stock is running low and needs attention.'
          : 'Stok bahan baku atau produk hampir habis dan butuh perhatian.',
        badgeLabel: isEn ? 'Low Stock' : 'Stok Menipis',
      };

    default: {
      const fallbackTitle = isEn ? 'Notification' : 'Notifikasi';
      const fallbackMsg = orderNum
        ? (isEn ? `Update for Order ${orderNum}` : `Pembaruan untuk Pesanan ${orderNum}`)
        : (isEn ? 'You have a new update.' : 'Anda memiliki pembaruan baru.');
      return {
        title: fallbackTitle,
        message: fallbackMsg,
      };
    }
  }
}
