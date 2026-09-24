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
  | 'cancelled';

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
  dueDate: string;
  status: OrderStatus;
  items?: OrderItem[];
  notes?: string;
  customDesignFee?: number;
  createdVia?: string;
  invoiceId?: string;
  amountPaid?: number;
  amountDue?: number;
  createdAt?: string;
  rawDueDate?: string;
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
  dueDate: string;
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
    dueDate: o.due_date ? new Date(o.due_date).toLocaleDateString('id-ID') : '-',
    status: o.status,
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
    // Extensions
    amountPaid: o.amount_paid !== undefined && o.amount_paid !== null ? parseFloat(o.amount_paid) : undefined,
    amountDue: o.amount_due !== undefined && o.amount_due !== null ? parseFloat(o.amount_due) : undefined,
    createdAt: o.created_at,
    rawDueDate: o.due_date,
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
    customer_name: orderData.customerName,
    customer_phone: orderData.customerPhone,
    customer_address: orderData.address,
    metode_pengiriman: orderData.deliveryMethod === 'Pickup' ? 'pickup' : 'delivery',
    payment_method_preference: orderData.paymentMethod === 'LUNAS' ? 'full' : 'dp',
    notes: orderData.notes,
    due_date: orderData.dueDate ? new Date(orderData.dueDate).toISOString() : null,
    items: orderData.items.map((item: any) => ({
      custom_product_name: item.name,
      price: item.price,
      qty: item.qty,
      custom_decoration_charge: 0,
    }))
  };
  const response = await apiClient.post('/orders/custom', payload);
  const o = response.data;
  return {
      id: o.id.toString(),
      orderNumber: `#${o.id}`,
      customerName: o.customer?.nama || orderData.customerName,
      customerPhone: o.customer?.nomor_wa || orderData.customerPhone,
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
      dueDate: o.due_date ? new Date(o.due_date).toLocaleDateString('id-ID') : '-',
      status: o.status,
      items: [],
      notes: o.notes || '',
      customDesignFee: 0,
      invoiceId: o.invoice?.nomor_invoice || '',
      createdVia: o.created_via,
  };
}