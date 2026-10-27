// src/services/sellerOrderService.ts

// ============================================================
// TYPES
// ============================================================

export type DeliveryMethod = 'Pickup' | 'Delivery Toko' | 'Delivery Pihak Ketiga';
export type PaymentMethod = 'DP' | 'LUNAS';
export type OrderStatus =
  | 'belum_dibayar'
  | 'sudah_dikonfirmasi'
  | 'sedang_dibuat'
  | 'siap_dikirim'
  | 'selesai'
  | 'dibatalkan'
  | 'pending'
  | 'in_process'
  | 'ready'
  | 'delivered'
  | 'picked_up'
  | 'completed'
  | 'refunded'
  | 'cancelled'
  | 'cancelled_settlement_expired';

export interface OrderItem {
  id: string;
  productName: string;
  variantName?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address?: string;
  total: number;
  date: string;
  time: string;
  method: DeliveryMethod;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  items?: OrderItem[];
  notes?: string;
  fulfillmentDate?: string;
  customDesignFee?: number;
  createdVia?: string;
  created_via?: string;
  invoiceId?: string;
  amountPaid?: number;
  amountDue?: number;
  createdAt?: string;
  rawFulfillmentDate?: string;
  fulfillment_date?: string;
  paymentStatus?: string;
  payment_status?: string;
  invoiceStatus?: string;
  invoice?: { id?: number; status?: string; nomor_invoice?: string; total_tagihan?: any; sisa_tagihan?: any; [key: string]: any };
  payment_expires_at?: string | null;
  paymentExpiresAt?: string | null;
  fulfillment_overdue_notified_at?: string | null;
  fulfillmentOverdueNotifiedAt?: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  orderNumber: string;
  date: string;
  time: string;
  total: number;
  paid: number;
  status: 'LUNAS' | 'DP' | 'Belum';
  items?: OrderItem[];
  notes?: string;
  orderMethod: DeliveryMethod;
  fulfillmentDate: string;
}



// ============================================================
// FUNGSI SERVICE - ORDERS
// ============================================================

import { apiClient } from '@/api/client';

export function mapOrderResponse(o: any): Order {
  return {
    id: o.id.toString(),
    orderNumber: `#${o.id}`,
    customerName: o.customer?.nama || 'Unknown Customer',
    customerPhone: o.customer?.nomor_wa || '-',
    address: o.customer?.alamat || '',
    total: parseFloat(o.total_harga_pesanan) || 0,
    date: new Date(o.created_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    }),
    time: new Date(o.created_at).toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit'
    }),
    method: o.metode_pengiriman === 'pickup' ? 'Pickup' : 'Delivery Toko',
    paymentMethod: ['full', 'lunas'].includes(o.payment_method_preference) ? 'LUNAS' : 'DP',
    status: o.status,
    fulfillmentDate: o.fulfillment_date ? new Date(o.fulfillment_date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }) : undefined,
    items: o.order_items?.map((item: any) => ({
      id: item.id.toString(),
      productName: item.custom_product_name || (item.product ? item.product.nama : `Product #${item.product_id}`),
      quantity: item.jumlah,
      price: parseFloat(item.subtotal) / (item.jumlah || 1),
      total: parseFloat(item.subtotal)
    })) || [],
    notes: o.notes || '',
    customDesignFee: 0,
    invoiceId: o.invoice?.nomor_invoice || '',
    createdVia: o.created_via,
    created_via: o.created_via,
    // Extensions
    amountPaid: o.amount_paid !== undefined && o.amount_paid !== null ? parseFloat(o.amount_paid) : undefined,
    amountDue: o.amount_due !== undefined && o.amount_due !== null ? parseFloat(o.amount_due) : undefined,
    createdAt: o.created_at,
    rawFulfillmentDate: o.fulfillment_date,
    fulfillment_date: o.fulfillment_date,
    paymentStatus: o.payment_status || o.invoice?.status,
    payment_status: o.payment_status,
    invoiceStatus: o.invoice?.status,
    invoice: o.invoice,
    payment_expires_at: o.payment_expires_at || null,
    paymentExpiresAt: o.payment_expires_at || null,
    fulfillment_overdue_notified_at: o.fulfillment_overdue_notified_at || null,
    fulfillmentOverdueNotifiedAt: o.fulfillment_overdue_notified_at || null,
  } as any;
}

const activeOrdersRequests = new Map<string, Promise<Order[]>>();

export async function getOrders(params?: { limit?: number; offset?: number; status?: string; signal?: AbortSignal; [key: string]: any }): Promise<Order[]> {
  const { signal, ...queryParams } = params || {};
  const key = JSON.stringify(queryParams);
  if (activeOrdersRequests.has(key)) return activeOrdersRequests.get(key)!;

  // We omit the signal from the actual network call to prevent StrictMode
  // unmounts from aborting the shared Promise for the other concurrent caller.
  const promise = apiClient.get('/orders', { params: queryParams })
    .then(response => response.data.map(mapOrderResponse))
    .finally(() => activeOrdersRequests.delete(key));

  activeOrdersRequests.set(key, promise);
  return promise;
}

export async function getOrderById(id: string): Promise<Order> {
  const response = await apiClient.get(`/orders/${id}`);
  return mapOrderResponse(response.data);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const response = await apiClient.patch(`/orders/${id}/status`, { status });
  return mapOrderResponse(response.data);
}

export async function createManualPayment(payload: {
  order_id: string | number;
  amount: number;
  payment_method: string;
  notes?: string;
}) {
  const response = await apiClient.post('/payments/manual', {
    order_id: String(payload.order_id),
    amount: Number(payload.amount),
    payment_method: payload.payment_method,
    notes: payload.notes || null,
  });
  return response.data;
}

export async function updateOrderFulfillmentDate(
  orderId: string | number,
  payload: { fulfillment_date: string } | string
): Promise<Order> {
  const body = typeof payload === 'string' ? { fulfillment_date: payload } : payload;
  const response = await apiClient.patch(`/orders/${orderId}/fulfillment-date`, body);
  return mapOrderResponse(response.data);
}

export async function refundOrder(
  orderId: string | number,
  payload: { reason: string; amount?: number; nomor_wa?: string }
) {
  const response = await apiClient.post(`/orders/${orderId}/refund`, payload);
  return response.data;
}








export async function getOrderStats(_ordersData?: any[]): Promise<{
  totalOrdersThisMonth: number | string;
  ordersChange: string;
  completed: number | string;
  completedChange: string;
  processed: number | string;
  processedChange: string;
  waitingConfirmation: number | string;
  waitingChange: string;
}> {
  try {
    const response = await apiClient.get('/orders/stats');
    const data = response.data;
    
    // We sum completed, delivered, and picked_up for the completed stat
    const completedCount = (data.completed || 0) + (data.delivered || 0) + (data.picked_up || 0);

    return {
      totalOrdersThisMonth: data.total || 0,
      ordersChange: 'Real-time',
      completed: completedCount,
      completedChange: 'Completed/Delivered/Picked up',
      processed: data.in_process || 0,
      processedChange: 'In Process',
      waitingConfirmation: data.pending || 0,
      waitingChange: 'Pending',
    };
  } catch(e) {
    throw new Error('Failed to load order statistics.');
  }
}

export async function addOrder(orderData: any): Promise<Order> {
  const payload = {
    customer_name: orderData.customer_name ?? orderData.customerName,
    customer_phone: orderData.customer_phone ?? orderData.customerPhone,
    customer_address: orderData.customer_address ?? orderData.address ?? '',
    metode_pengiriman: orderData.metode_pengiriman ?? (orderData.deliveryMethod === 'Pickup' ? 'pickup' : 'delivery'),
    payment_method_preference: orderData.payment_method_preference ?? (orderData.paymentMethod === 'LUNAS' ? 'full' : 'dp'),
    notes: orderData.notes || '',
    fulfillment_date: orderData.fulfillment_date ?? (orderData.fulfillmentDate ? (orderData.fulfillmentDate.includes('T') ? orderData.fulfillmentDate : `${orderData.fulfillmentDate}T12:00:00+07:00`) : ''),
    items: (orderData.items || []).map((item: any) => ({
      product_id: Number(item.product_id ?? item.productId),
      qty: Number(item.qty ?? item.quantity ?? 1),
      custom_decoration_charge: Number(item.custom_decoration_charge ?? 0),
    })),
    accessories: (orderData.accessories || []).map((acc: any) => ({
      stock_item_id: Number(acc.stock_item_id ?? acc.stockItemId),
      quantity: Number(acc.quantity ?? acc.qty ?? 1),
    })),
  };
  const response = await apiClient.post('/orders/custom', payload);
  return mapOrderResponse(response.data);
}