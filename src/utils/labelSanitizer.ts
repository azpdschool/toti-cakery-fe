export interface StatusBadgeInfo {
  label: string;
  className: string;
}

/**
 * Normalizes and formats order status into a clean English label and Tailwind badge classes for Seller pages.
 */
export function formatSellerOrderStatus(orderOrStatus: any): StatusBadgeInfo {
  if (!orderOrStatus) {
    return { label: 'Unknown', className: 'bg-gray-100 text-gray-700' };
  }

  let status = '';
  let invStatus = '';

  if (typeof orderOrStatus === 'object') {
    status = String(orderOrStatus.status || '').toLowerCase().trim();
    invStatus = String(orderOrStatus.invoiceStatus || orderOrStatus.invoice?.status || '').toLowerCase().trim();

    if (status === 'cancelled_settlement_expired') {
      return { label: 'Settlement Expired', className: 'bg-red-50 text-red-700 border border-red-200' };
    }
    if (status === 'cancelled' || status === 'dibatalkan') {
      return { label: 'Cancelled', className: 'bg-gray-100 text-gray-700' };
    }
    if (status === 'refunded') {
      return { label: 'Refunded', className: 'bg-gray-100 text-gray-700' };
    }
    if (invStatus === 'unpaid' || status === 'belum_dibayar') {
      return { label: 'Waiting for Payment', className: 'bg-amber-100 text-amber-800' };
    }
    if (
      (invStatus === 'partial' || invStatus === 'paid') &&
      (status === 'pending' || status === 'awaiting_payment' || status === 'sudah_dikonfirmasi')
    ) {
      return { label: 'Waiting for Seller Confirmation', className: 'bg-blue-100 text-blue-800' };
    }
    if (status === 'in_process' || status === 'sedang_dibuat') {
      return { label: 'In Process', className: 'bg-yellow-100 text-yellow-700' };
    }
    if (status === 'ready' || status === 'siap_dikirim') {
      return { label: 'Ready', className: 'bg-purple-100 text-purple-700' };
    }
    if (status === 'delivered') {
      return { label: 'Delivered', className: 'bg-green-100 text-green-700' };
    }
    if (status === 'picked_up') {
      return { label: 'Picked Up', className: 'bg-green-100 text-green-700' };
    }
    if (['completed', 'selesai'].includes(status)) {
      return { label: 'Completed', className: 'bg-green-100 text-green-700' };
    }
  } else {
    status = String(orderOrStatus).toLowerCase().trim();
  }

  const map: Record<string, StatusBadgeInfo> = {
    belum_dibayar: { label: 'Unpaid', className: 'bg-red-100 text-red-700' },
    unpaid: { label: 'Unpaid', className: 'bg-red-100 text-red-700' },
    sudah_dikonfirmasi: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
    waiting_confirmation: { label: 'Waiting Confirmation', className: 'bg-blue-100 text-blue-800' },
    sedang_dibuat: { label: 'In Process', className: 'bg-yellow-100 text-yellow-700' },
    in_process: { label: 'In Process', className: 'bg-yellow-100 text-yellow-700' },
    processed: { label: 'In Process', className: 'bg-yellow-100 text-yellow-700' },
    siap_dikirim: { label: 'Ready', className: 'bg-purple-100 text-purple-700' },
    ready: { label: 'Ready', className: 'bg-purple-100 text-purple-700' },
    delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700' },
    picked_up: { label: 'Picked Up', className: 'bg-green-100 text-green-700' },
    selesai: { label: 'Completed', className: 'bg-green-100 text-green-700' },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
    dibatalkan: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700' },
    cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700' },
    cancelled_settlement_expired: { label: 'Settlement Expired', className: 'bg-red-50 text-red-700 border border-red-200' },
    refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-700' },
  };

  if (map[status]) {
    return map[status];
  }

  return {
    label: sanitizeTechnicalString(status),
    className: 'bg-gray-100 text-gray-700',
  };
}

/**
 * Formats delivery method into clean English label.
 */
export function formatSellerDeliveryMethod(method?: string): string {
  if (!method) return '-';
  const m = method.toLowerCase().trim();

  if (m === 'pickup' || m === 'pick up' || m === 'ambil di toko') return 'Pickup';
  if (m === 'delivery_toko' || m === 'delivery toko' || m === 'kurir toko' || m === 'store delivery') {
    return 'Store Delivery';
  }
  if (
    m === 'delivery_third_party' ||
    m === 'third_party' ||
    m === 'third party' ||
    m === 'delivery pihak ketiga' ||
    m === 'pihak ketiga'
  ) {
    return 'Third-Party Delivery';
  }

  return sanitizeTechnicalString(method);
}

/**
 * Formats payment preference into clean English label.
 */
export function formatSellerPaymentPreference(preference?: string): string {
  if (!preference) return '-';
  const p = preference.toLowerCase().trim();
  if (p === 'full' || p === 'lunas' || p === 'full payment') return 'Full Payment';
  if (p === 'dp' || p === 'partial' || p === 'partially_paid' || p === '50% dp') {
    return '50% Down Payment (DP)';
  }
  return sanitizeTechnicalString(preference);
}

/**
 * Formats payment status into clean English label.
 */
export function formatSellerPaymentStatus(
  paymentStatus?: string,
  amountPaid?: number,
  amountDue?: number
): string {
  if (amountPaid !== undefined && amountDue !== undefined) {
    if (amountDue === 0 && amountPaid > 0) return 'Paid';
    if (amountPaid > 0) return '50% Down Payment (DP)';
    return 'Unpaid';
  }

  if (!paymentStatus) return 'Unpaid';
  const s = paymentStatus.toLowerCase().trim();
  if (s === 'paid' || s === 'lunas' || s === 'success') return 'Paid';
  if (s === 'partial' || s === 'dp' || s === 'partially_paid') return '50% Down Payment (DP)';
  if (s === 'refunded') return 'Refunded';
  if (s === 'unpaid' || s === 'belum_dibayar') return 'Unpaid';

  return sanitizeTechnicalString(paymentStatus);
}

/**
 * Formats order creation source into clean English label.
 */
export function formatSellerSource(source?: string): string {
  if (!source) return 'Web';
  const s = source.toLowerCase().trim();
  if (s === 'web') return 'Web';
  if (s === 'chatbot' || s === 'wa_bot') return 'Chatbot';
  if (s === 'whatsapp' || s === 'wa') return 'WhatsApp';
  return sanitizeTechnicalString(source);
}

/**
 * Replaces snake_case and technical raw identifiers with friendly Title Case.
 */
export function sanitizeTechnicalString(str?: string): string {
  if (!str) return '';
  return str
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
