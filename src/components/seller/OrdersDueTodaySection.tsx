import { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { getOrders, type Order, type OrderStatus } from '@/services/sellerOrderService';
import { formatDateToLocalYYYYMMDD, getTodayLocal } from '@/utils/date';
import { formatSellerOrderStatus } from '@/utils/labelSanitizer';

/**
 * Order statuses excluded from "Orders Due Today"
 * (orders that are already completed, cancelled, refunded, or handed over to the customer).
 */
export const EXCLUDED_DUE_TODAY_STATUSES = new Set([
  'completed',
  'selesai',
  'cancelled',
  'dibatalkan',
  'cancelled_settlement_expired',
  'refunded',
  'delivered',
  'picked_up',
]);

/**
 * Konversi tanggal fulfillment pesanan ke format YYYY-MM-DD dalam timezone Asia/Jakarta (WIB)
 */
function getFulfillmentDateJakarta(dateVal?: string | Date | null): string {
  if (!dateVal) return '';
  const str = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  let parseable = str;
  // Jika format datetime ISO tanpa offset timezone, anggap UTC+7 (WIB)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(str)) {
    parseable = `${str}+07:00`;
  }
  return formatDateToLocalYYYYMMDD(parseable);
}

/**
 * Safe useMediaQuery hook defaulting to false (mobile) on first render
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    } else {
      mql.addListener(handler);
      return () => mql.removeListener(handler);
    }
  }, [query]);

  return matches;
}

/**
 * Ambil order per status dengan batasan limit 500 dan maksimal 5 halaman jika batch mencapai 500
 */
async function fetchOrdersByStatusWithPagination(
  status: OrderStatus,
  signal?: AbortSignal
): Promise<Order[]> {
  const limit = 500;
  const maxPages = 5;
  let statusOrders: Order[] = [];
  let offset = 0;

  for (let page = 0; page < maxPages; page++) {
    if (signal?.aborted) return [];
    const batch = await getOrders({ status, limit, offset, signal });
    if (signal?.aborted) return [];
    statusOrders = statusOrders.concat(batch);
    if (batch.length < limit) {
      break;
    }
    offset += limit;
  }

  return statusOrders;
}

export interface OrdersDueTodaySectionProps {
  /** Jika diberikan, komponen tidak melakukan fetch mandiri dan memakai data ini */
  orders?: Order[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onOrderClick?: (orderId: string) => void;
  className?: string;
  refreshKey?: number;
}

export function OrdersDueTodaySection({
  orders: externalOrders,
  loading: externalLoading,
  error: externalError,
  onRetry: externalOnRetry,
  onOrderClick,
  className = '',
  refreshKey,
}: OrdersDueTodaySectionProps) {
  // State untuk fetch mandiri (misal saat dipanggil di SellerDashboardPage atau SellerOrdersPage)
  const isStandalone = externalOrders === undefined;
  const [internalOrders, setInternalOrders] = useState<Order[]>([]);
  const [internalLoading, setInternalLoading] = useState(isStandalone);
  const [internalError, setInternalError] = useState(false);

  // Responsive breakpoint tracking (md: min-width: 768px)
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const pageSize = isDesktop ? 10 : 5;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchStandaloneOrders = useCallback(async (signal?: AbortSignal) => {
    setInternalLoading(true);
    setInternalError(false);
    try {
      const statuses: OrderStatus[] = ['pending', 'waiting_confirmation', 'in_process', 'ready'];
      const batches = await Promise.all(
        statuses.map((st) => fetchOrdersByStatusWithPagination(st, signal))
      );

      if (signal?.aborted) return;

      const merged = batches.flat();
      const seen = new Set<string | number>();
      const uniqueOrders: Order[] = [];
      for (const order of merged) {
        if (order && order.id != null && !seen.has(order.id)) {
          seen.add(order.id);
          uniqueOrders.push(order);
        }
      }

      setInternalOrders(uniqueOrders);
      setInternalError(false);
    } catch (err: unknown) {
      if (signal?.aborted) return;
      const errorObj = err as { name?: string; code?: string };
      if (errorObj?.name === 'CanceledError' || errorObj?.code === 'ERR_CANCELED') return;
      console.error('[OrdersDueTodaySection] Error fetching standalone orders:', err);
      setInternalError(true);
    } finally {
      if (!signal?.aborted) {
        setInternalLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isStandalone) return;
    const controller = new AbortController();
    fetchStandaloneOrders(controller.signal);
    return () => controller.abort();
  }, [isStandalone, fetchStandaloneOrders, refreshKey]);

  const rawOrders = useMemo(
    () => (isStandalone ? internalOrders : (externalOrders || [])),
    [isStandalone, internalOrders, externalOrders]
  );
  const isLoading = isStandalone ? internalLoading : (externalLoading ?? false);
  const isError = isStandalone ? internalError : (externalError ?? false);

  const handleRetry = () => {
    if (isStandalone) {
      fetchStandaloneOrders();
    } else if (externalOnRetry) {
      externalOnRetry();
    }
  };

  // Tanggal hari ini dalam timezone Asia/Jakarta
  const todayStr = useMemo(() => getTodayLocal(), []);

  // Filter client-side & urutkan:
  // 1. Status prioritas: pending (1) -> in_process (2) -> ready (3)
  // 2. Earliest fulfillment time first
  const dueTodayOrders = useMemo(() => {
    const filtered = rawOrders.filter((order) => {
      const status = String(order.status || '').toLowerCase().trim();
      if (EXCLUDED_DUE_TODAY_STATUSES.has(status)) {
        return false;
      }
      const rawDate = order.rawFulfillmentDate || order.fulfillment_date;
      if (!rawDate) return false;
      return getFulfillmentDateJakarta(rawDate) === todayStr;
    });

    return filtered.sort((a, b) => {
      const statusPriority: Record<string, number> = {
        pending: 1,
        waiting_confirmation: 2,
        in_process: 3,
        ready: 4,
      };
      const prioA = statusPriority[String(a.status).toLowerCase()] || 99;
      const prioB = statusPriority[String(b.status).toLowerCase()] || 99;
      if (prioA !== prioB) return prioA - prioB;

      const dateA = a.rawFulfillmentDate || a.fulfillment_date;
      const dateB = b.rawFulfillmentDate || b.fulfillment_date;
      const timeA = dateA ? new Date(dateA).getTime() : 0;
      const timeB = dateB ? new Date(dateB).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;

      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });
  }, [rawOrders, todayStr]);

  // Reset ke halaman 1 saat breakpoint atau data berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [isDesktop, dueTodayOrders]);

  // Pagination calculation
  const totalItems = dueTodayOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedOrders = useMemo(
    () => dueTodayOrders.slice(startIndex, startIndex + pageSize),
    [dueTodayOrders, startIndex, pageSize]
  );

  const showingStart = totalItems === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + pageSize, totalItems);

  // Console.log verifikasi untuk kebutuhan pengecekan (aktif di DEV mode atau debug flag)
  useEffect(() => {
    if (isLoading) return;
    const hasDebugFlag =
      typeof window !== 'undefined' &&
      Boolean((window as unknown as { __ENABLE_ORDERS_DEBUG__?: boolean }).__ENABLE_ORDERS_DEBUG__);
    if (import.meta.env.DEV || hasDebugFlag) {
      console.log('Tanggal hari ini yang dipakai:', todayStr);
      console.log('Jumlah order yang diterima:', rawOrders.length);
      console.log('Jumlah yang lolos filter:', dueTodayOrders.length);
    }
  }, [isLoading, todayStr, rawOrders.length, dueTodayOrders.length]);

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;
  const isClickable = Boolean(onOrderClick);

  return (
    <section className={`rounded-2xl border border-orange-100 bg-white p-4 sm:p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#d85b30]" />
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Orders Due Today</h2>
          {!isLoading && !isError && dueTodayOrders.length > 0 && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-[#d85b30]">
              {dueTodayOrders.length}
            </span>
          )}
        </div>
      </div>

      <div className="min-h-[70px]">
        {isLoading ? (
          <div className="py-2">
            {/* Mobile skeleton: compact list */}
            <div className="md:hidden space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse w-full" />
              ))}
            </div>
            {/* Desktop skeleton: card grid */}
            <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse w-full" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center text-center py-5">
            <AlertCircle className="mx-auto h-6 w-6 text-red-500 mb-1.5" />
            <p className="text-xs sm:text-sm text-gray-600">Unable to load orders due today.</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#d85b30] hover:underline"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        ) : dueTodayOrders.length > 0 ? (
          <div>
            {/* 1. Mobile view (< md): Single-column list, compact rows (p-2.5) */}
            <div className="md:hidden">
              <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/60 overflow-hidden">
                {paginatedOrders.map((order) => {
                  const badge = formatSellerOrderStatus(order);
                  return (
                    <li
                      key={order.id}
                      onClick={() => onOrderClick?.(order.id)}
                      className={`flex items-center justify-between p-2.5 transition-colors ${
                        isClickable ? 'cursor-pointer hover:bg-orange-50/50' : ''
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        {/* Line 1: Order number + Status badge */}
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-gray-900 truncate">
                            {order.orderNumber}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                        {/* Line 2: Customer name + Delivery method */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 truncate mt-0.5">
                          <span className="truncate">{order.customerName}</span>
                          {order.method && (
                            <span className="shrink-0 text-gray-400">• {order.method}</span>
                          )}
                        </div>
                      </div>

                      {/* Right: Total */}
                      <div className="flex items-center shrink-0">
                        <span className="font-bold text-xs text-gray-900">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Mobile pagination: compact single line below list */}
              <div className="flex items-center justify-between pt-2.5 text-xs text-gray-600">
                <span>
                  Showing {showingStart}-{showingEnd} of {totalItems}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage <= 1}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Desktop view (>= md): Grid of cards (md:grid-cols-2 xl:grid-cols-3) */}
            <div className="hidden md:block">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {paginatedOrders.map((order) => {
                  const badge = formatSellerOrderStatus(order);
                  return (
                    <div
                      key={order.id}
                      onClick={() => onOrderClick?.(order.id)}
                      className={`rounded-xl border border-gray-200 bg-white p-3.5 transition-all flex flex-col justify-between ${
                        isClickable ? 'cursor-pointer hover:border-orange-200 hover:shadow-xs hover:bg-orange-50/20' : ''
                      }`}
                    >
                      <div>
                        {/* Header: Order number + Status badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-bold text-sm text-gray-900 truncate">
                            {order.orderNumber}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>

                        {/* Customer Info: Name & WhatsApp */}
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <p className="font-semibold text-gray-900 truncate">{order.customerName}</p>
                          <p className="text-gray-500 truncate">{order.customerPhone || '-'}</p>
                        </div>
                      </div>

                      {/* Footer: Delivery Method & Total */}
                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium truncate pr-2">
                          {order.method || 'Pickup'}
                        </span>
                        <span className="font-bold text-sm text-gray-900 shrink-0">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop pagination: Right-aligned */}
              <div className="flex items-center justify-end gap-3 pt-3 text-xs text-gray-600">
                <span>
                  Showing {showingStart}-{showingEnd} of {totalItems}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage <= 1}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-5 text-center">
            <p className="text-xs sm:text-sm text-gray-600">No orders are due today.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default OrdersDueTodaySection;
