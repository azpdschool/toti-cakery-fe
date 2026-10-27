import { createBuyerOrderAPI, BuyerOrderCreate, cancelBuyerOrderAPI } from '@/api/order';
import { processPaymentAPI, PaymentChargeRequest, PaymentChargeResponse, getPaymentStatusAPI } from '@/api/payment';
// src/services/buyerOrderService.ts
import { apiClient } from '@/api/client'

export type OrderStatus =
  | 'pending'
  | 'processed'
  | 'ready'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'cancelled_settlement_expired'

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'
export type DeliveryMethod = 'pickup' | 'delivery_toko' | 'delivery_third_party'

export interface BuyerOrderItem {
  id: string
  productId?: string
  productName: string
  variantName: string
  quantity: number
  price: number
  subtotal: number
}

export interface BuyerOrder {
  id: string
  orderNumber: string
  date: string
  time: string
  status: OrderStatus

  deliveryMethod: DeliveryMethod
  address?: string | null
  customerName?: string | null
  recipientName?: string | null
  recipientPhone?: string | null
  createdAt?: string | null

  paymentMethodPreference: string
  paymentChannel: string
  paymentStatus: PaymentStatus

  items: BuyerOrderItem[]

  subtotal: number
  serviceFee: number
  total: number
  fulfillmentDate?: string
  amountPaid?: number
  amountDue?: number

  notes?: string | null
  estimatedDate?: string | null
  completedDate?: string | null

  rawStatus?: string
  invoiceStatus?: string
  payment_expires_at?: string | null
  paymentExpiresAt?: string | null
  fulfillment_overdue_notified_at?: string | null
  fulfillmentOverdueNotifiedAt?: string | null
  fulfillment_date?: string
  invoice?: {
    status?: string
    total_tagihan?: number | string
    sisa_tagihan?: number | string
  } | null
}

export function isBuyerOrderOverdue(order?: BuyerOrder | null): boolean {
  if (!order) return false;
  const activeStatuses = ['pending', 'processed', 'in_process', 'ready'];
  const status = order.rawStatus || order.status;
  if (!activeStatuses.includes(status)) return false;

  const fDate = order.fulfillment_date || order.fulfillmentDate;
  if (!fDate) return false;
  const isPast = new Date(fDate).getTime() < Date.now();

  const invStatus = order.invoiceStatus || order.invoice?.status || order.paymentStatus;
  return isPast && (invStatus === 'partial' || invStatus === 'paid');
}

/**
 * Endpoint ini perlu disesuaikan dengan BE order route kamu.
 *
 * Kemungkinan endpoint yang umum:
 * - GET /orders/buyer
 * - GET /orders/my
 * - GET /orders/customer
 * - GET /orders/
 *
 * Untuk sekarang aku pakai /orders/buyer.
 */
const BUYER_ORDERS_ENDPOINT = '/orders/buyer'

type ApiMaybeDecimal = number | string | null | undefined

interface ApiOrderItem {
  id?: number | string
  product_id?: number | string
  productId?: number | string

  product_name?: string
  productName?: string
  nama_produk?: string

  variant_name?: string | null
  variantName?: string | null

  quantity?: number
  qty?: number
  jumlah?: number

  price?: ApiMaybeDecimal
  harga?: ApiMaybeDecimal
  unit_price?: ApiMaybeDecimal

  subtotal?: ApiMaybeDecimal
}

interface ApiOrder {
  id?: number | string
  invoice?: {
    status?: string
  }
  invoice_status?: string
  invoiceStatus?: string
  amount_paid?: ApiMaybeDecimal
  amountPaid?: ApiMaybeDecimal
  amount_due?: ApiMaybeDecimal
  amountDue?: ApiMaybeDecimal

  order_number?: string
  orderNumber?: string
  invoice_number?: string
  invoiceNumber?: string
  kode_order?: string

  status?: string
  order_status?: string
  fulfillment_date?: string
  fulfillmentDate?: string

  delivery_method?: string
  deliveryMethod?: string
  metode_pengiriman?: string

  address?: string | null
  alamat?: string | null

  customer_name?: string | null
  customer?: {
    nama?: string
  } | null

  recipient_name?: string | null
  recipientName?: string | null
  nama_penerima?: string | null

  recipient_phone?: string | null
  recipientPhone?: string | null
  telepon_penerima?: string | null

  payment_method_preference?: string
  paymentMethodPreference?: string
  payment_method?: string
  paymentMethod?: string
  metode_pembayaran?: string

  payment_status?: string
  paymentStatus?: string
  status_pembayaran?: string

  items?: ApiOrderItem[]
  order_items?: ApiOrderItem[]

  subtotal?: ApiMaybeDecimal
  service_fee?: ApiMaybeDecimal
  serviceFee?: ApiMaybeDecimal
  biaya_layanan?: ApiMaybeDecimal
  total?: ApiMaybeDecimal
  total_amount?: ApiMaybeDecimal
  grand_total?: ApiMaybeDecimal

  notes?: string | null
  catatan?: string | null

  estimated_date?: string | null
  estimatedDate?: string | null
  completed_date?: string | null
  completedDate?: string | null

  payment_expires_at?: string | null
  paymentExpiresAt?: string | null
  fulfillment_overdue_notified_at?: string | null
  fulfillmentOverdueNotifiedAt?: string | null

  created_at?: string | null
  createdAt?: string | null
  tanggal_order?: string | null
}

function toNumber(value: ApiMaybeDecimal): number {
  if (value === null || value === undefined || value === '') return 0

  const parsed = typeof value === 'string' ? Number(value) : value

  return Number.isFinite(parsed) ? parsed : 0
}

function toDateTimeParts(value?: string | null): { date: string; time: string } {
  if (!value) {
    return {
      date: '-',
      time: '-',
    }
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return {
      date: value,
      time: '-',
    }
  }

  return {
    date: date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

function normalizeStatus(status?: string): OrderStatus {
  const value = String(status || '').toLowerCase()

  if (
    value === 'pending' ||
    value === 'menunggu' ||
    value === 'waiting' ||
    value === 'new'
  ) {
    return 'pending'
  }

  if (
    value === 'processed' ||
    value === 'processing' ||
    value === 'diproses' ||
    value === 'baking' ||
    value === 'paid' ||
    value === 'in_process'
  ) {
    return 'processed'
  }

  if (
    value === 'shipped' ||
    value === 'delivery' ||
    value === 'delivered_by_courier' ||
    value === 'dikirim'
  ) {
    return 'shipped'
  }

  if (
    value === 'ready' ||
    value === 'siap'
  ) {
    return 'ready'
  }

  if (
    value === 'completed' ||
    value === 'done' ||
    value === 'delivered' ||
    value === 'picked_up' ||
    value === 'selesai'
  ) {
    return 'completed'
  }

  if (
    value === 'cancelled_settlement_expired' ||
    value === 'settlement_expired'
  ) {
    return 'cancelled_settlement_expired'
  }

  if (
    value.includes('cancel') ||
    value.includes('batal')
  ) {
    return 'cancelled'
  }

  if (
    value === 'refunded' ||
    value === 'dikembalikan'
  ) {
    return 'refunded'
  }

  return 'pending'
}

function normalizePaymentStatus(status?: string): PaymentStatus {
  const value = String(status || '').toLowerCase()

  if (value === 'paid' || value === 'lunas' || value === 'success') return 'paid'
  if (value === 'partial' || value === 'dp') return 'partial'
  if (value === 'refunded' || value === 'dikembalikan') return 'refunded'

  return 'unpaid'
}

function normalizeDeliveryMethod(method?: string): DeliveryMethod {
  const value = String(method || '').toLowerCase()

  if (value === 'delivery_toko' || value === 'delivery toko') {
    return 'delivery_toko'
  }

  if (
    value === 'delivery_third_party' ||
    value === 'third_party' ||
    value === 'gojek' ||
    value === 'grab'
  ) {
    return 'delivery_third_party'
  }

  return 'pickup'
}

function mapApiOrderItem(item: ApiOrderItem, index: number): BuyerOrderItem {
  const quantity = Number(item.quantity ?? item.qty ?? item.jumlah ?? 1)
  const price = toNumber(item.price ?? item.harga ?? item.unit_price)
  const subtotal = toNumber(item.subtotal) || price * quantity

  return {
    id: String(item.id ?? index + 1),
    productId:
      item.product_id !== undefined || item.productId !== undefined
        ? String(item.product_id ?? item.productId)
        : undefined,
    productName:
      item.product_name ??
      item.productName ??
      item.nama_produk ??
      'Produk',
    variantName:
      item.variant_name ??
      item.variantName ??
      'Default',
    quantity,
    price,
    subtotal,
  }
}

function mapApiOrder(order: ApiOrder): BuyerOrder {
  const createdAt =
    order.created_at ??
    order.createdAt ??
    order.tanggal_order ??
    null

  const { date, time } = toDateTimeParts(createdAt)

  const rawItems = order.items ?? order.order_items ?? []
  const items = rawItems.map(mapApiOrderItem)

  const subtotal =
    toNumber(order.subtotal) ||
    items.reduce((sum, item) => sum + item.subtotal, 0)

  const serviceFee = toNumber(
    order.service_fee ??
      order.serviceFee ??
      order.biaya_layanan,
  )

  const total =
    toNumber(order.total ?? order.total_amount ?? order.grand_total) ||
    subtotal + serviceFee

  return {
    id: String(order.id ?? ''),
    orderNumber:
      order.order_number ??
      order.orderNumber ??
      order.invoice_number ??
      order.invoiceNumber ??
      order.kode_order ??
      `ORDER-${order.id ?? '-'}`,
    date,
    time,
    status: normalizeStatus(order.status ?? order.order_status),

    deliveryMethod: normalizeDeliveryMethod(
      order.delivery_method ??
        order.deliveryMethod ??
        order.metode_pengiriman,
    ),
    address: order.address ?? order.alamat ?? null,
    customerName: order.customer_name ?? order.customer?.nama ?? order.recipient_name ?? null,
    recipientName:
      order.recipient_name ??
      order.recipientName ??
      order.nama_penerima ??
      null,
    recipientPhone:
      order.recipient_phone ??
      order.recipientPhone ??
      order.telepon_penerima ??
      null,
    createdAt,

    paymentMethodPreference:
      order.payment_method_preference ??
      order.paymentMethodPreference ??
      'lunas',
    paymentChannel:
      order.payment_method ??
      order.paymentMethod ??
      order.metode_pembayaran ??
      '-',
    paymentStatus: normalizePaymentStatus(
      order.invoice?.status ??
      order.invoice_status ??
      order.invoiceStatus ??
      order.payment_status ??
      order.paymentStatus ??
      order.status_pembayaran
    ),

    items,
    subtotal,
    serviceFee,
    total,
    amountPaid: (order.amount_paid ?? order.amountPaid) != null ? toNumber(order.amount_paid ?? order.amountPaid) : undefined,
    amountDue: (order.amount_due ?? order.amountDue) != null ? toNumber(order.amount_due ?? order.amountDue) : undefined,
    fulfillmentDate: order.fulfillment_date ?? order.fulfillmentDate,
    fulfillment_date: order.fulfillment_date ?? order.fulfillmentDate,

    rawStatus: order.status ?? order.order_status,
    invoiceStatus:
      order.invoice?.status ??
      order.invoice_status ??
      order.invoiceStatus ??
      order.payment_status ??
      order.paymentStatus ??
      order.status_pembayaran,
    payment_expires_at: order.payment_expires_at ?? order.paymentExpiresAt ?? null,
    paymentExpiresAt: order.payment_expires_at ?? order.paymentExpiresAt ?? null,
    fulfillment_overdue_notified_at: order.fulfillment_overdue_notified_at ?? order.fulfillmentOverdueNotifiedAt ?? null,
    fulfillmentOverdueNotifiedAt: order.fulfillment_overdue_notified_at ?? order.fulfillmentOverdueNotifiedAt ?? null,
    invoice: order.invoice ? {
      status: order.invoice.status,
      total_tagihan: (order.invoice as any).total_tagihan,
      sisa_tagihan: (order.invoice as any).sisa_tagihan,
    } : null,

    notes: order.notes ?? order.catatan ?? null,
    estimatedDate: order.estimated_date ?? order.estimatedDate ?? null,
    completedDate: order.completed_date ?? order.completedDate ?? null,
  }
}

function unwrapOrderList(data: unknown): ApiOrder[] {
  if (Array.isArray(data)) return data as ApiOrder[]

  if (data && typeof data === 'object') {
    const obj = data as any

    if (Array.isArray(obj.orders)) return obj.orders
    if (Array.isArray(obj.data)) return obj.data
    if (Array.isArray(obj.items)) return obj.items
    if (Array.isArray(obj.results)) return obj.results
  }

  return []
}

export async function getBuyerOrders(): Promise<BuyerOrder[]> {
  try {
    const response = await apiClient.get(BUYER_ORDERS_ENDPOINT)
    const rawOrders = unwrapOrderList(response.data)

    return rawOrders.map(mapApiOrder)
  } catch (error: any) {
    /**
     * Kalau buyer belum pernah order, beberapa BE mengembalikan 404.
     * Coba fallback ke /buyer sebelum menganggap list kosong.
     */
    if (error?.response?.status === 404) {
      try {
        const fallbackRes = await apiClient.get('/buyer')
        const rawOrders = unwrapOrderList(fallbackRes.data)
        return rawOrders.map(mapApiOrder)
      } catch {
        return []
      }
    }

    throw error
  }
}

export async function getBuyerOrderById(id: string): Promise<BuyerOrder | null> {
  try {
    const response = await apiClient.get(`${BUYER_ORDERS_ENDPOINT}/${id}`)
    return mapApiOrder(response.data)
  } catch (error: any) {
    if (error?.response?.status === 404) {
      try {
        const fallbackRes = await apiClient.get(`/buyer/${id}`)
        return mapApiOrder(fallbackRes.data)
      } catch {
        return null
      }
    }

    throw error
  }
}

// ============================================================
// CHECKOUT / CREATE ORDER
// ============================================================

export type PaymentMethod = 'lunas' | 'dp'

export interface CreateOrderItemPayload {
  id?: string
  productId?: string
  productName: string
  variantName: string
  quantity: number
  price: number
  subtotal: number
}

export interface CreateOrderPayload {
  items: CreateOrderItemPayload[]
  subtotal: number
  serviceFee: number
  deliveryFee?: number
  total: number
  deliveryMethod: DeliveryMethod
  paymentMethod: PaymentMethod
  address?: string
  recipientName?: string
  recipientPhone?: string
  notes?: string
  fulfillmentDate: string
}

/**
 * Endpoint ini juga perlu disesuaikan dengan BE order route kamu,
 * biasanya POST /orders atau POST /orders/buyer.
 */



export async function createOrder(payload: CreateOrderPayload): Promise<BuyerOrder> {
  let finalNotes = payload.notes || '';
  if (payload.deliveryMethod !== 'pickup') {
    const deliveryInfo = `[DELIVERY INFO] Penerima: ${payload.recipientName} (${payload.recipientPhone}), Alamat: ${payload.address}`;
    finalNotes = finalNotes ? `${finalNotes}\n${deliveryInfo}` : deliveryInfo;
  }

  const buyerPayload: BuyerOrderCreate = {
    metode_pengiriman: payload.deliveryMethod === 'pickup' ? 'pickup' : 'delivery',
    items: payload.items.map(i => ({
      product_id: Number(i.productId),
      jumlah: i.quantity,
      custom_decoration_charge: 0
    })),
    created_via: 'web',
    notes: finalNotes,
    payment_method_preference: payload.paymentMethod,
    fulfillment_date: payload.fulfillmentDate ? new Date(payload.fulfillmentDate).toISOString() : new Date().toISOString()
  };

  const responseData = await createBuyerOrderAPI(buyerPayload);
  return mapApiOrder(responseData);
}



export async function processPayment(
  orderId: string,
  paymentMethod: string,
  paymentType: string,
  amount: number
): Promise<PaymentChargeResponse> {
  const request: PaymentChargeRequest = {
    order_id: Number(orderId),
    payment_method: paymentMethod === 'qris' ? 'qris' : 'bank_transfer',
    payment_type: paymentType === 'dp' ? 'dp' : 'full',
    amount
  };
  return await processPaymentAPI(request);
}

export async function getOrderPaymentStatus(orderId: string) {
  return await getPaymentStatusAPI(orderId);
}

export async function cancelBuyerOrder(orderId: string | number): Promise<{ status?: string; message?: string }> {
  return await cancelBuyerOrderAPI(orderId);
}

