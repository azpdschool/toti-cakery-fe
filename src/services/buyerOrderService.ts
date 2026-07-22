// src/services/buyerOrderService.ts
import { apiClient } from '@/api/client'

export type OrderStatus =
  | 'pending'
  | 'processed'
  | 'shipped'
  | 'completed'
  | 'cancelled'

export type PaymentStatus = 'unpaid' | 'partial' | 'paid'
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
  recipientName?: string | null
  recipientPhone?: string | null

  paymentMethod: string
  paymentStatus: PaymentStatus

  items: BuyerOrderItem[]

  subtotal: number
  serviceFee: number
  total: number

  notes?: string | null
  estimatedDate?: string | null
  completedDate?: string | null
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

  order_number?: string
  orderNumber?: string
  invoice_number?: string
  invoiceNumber?: string
  kode_order?: string

  status?: string
  order_status?: string

  delivery_method?: string
  deliveryMethod?: string
  metode_pengiriman?: string

  address?: string | null
  alamat?: string | null

  recipient_name?: string | null
  recipientName?: string | null
  nama_penerima?: string | null

  recipient_phone?: string | null
  recipientPhone?: string | null
  telepon_penerima?: string | null

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
    value === 'paid'
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
    value === 'completed' ||
    value === 'done' ||
    value === 'delivered' ||
    value === 'selesai'
  ) {
    return 'completed'
  }

  if (
    value === 'cancelled' ||
    value === 'canceled' ||
    value === 'dibatalkan'
  ) {
    return 'cancelled'
  }

  return 'pending'
}

function normalizePaymentStatus(status?: string): PaymentStatus {
  const value = String(status || '').toLowerCase()

  if (value === 'paid' || value === 'lunas' || value === 'success') return 'paid'
  if (value === 'partial' || value === 'dp') return 'partial'

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

    paymentMethod:
      order.payment_method ??
      order.paymentMethod ??
      order.metode_pembayaran ??
      '-',
    paymentStatus: normalizePaymentStatus(
      order.payment_status ??
        order.paymentStatus ??
        order.status_pembayaran,
    ),

    items,
    subtotal,
    serviceFee,
    total,

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
     * Untuk UI buyer, itu lebih baik dianggap list kosong.
     */
    if (error?.response?.status === 404) {
      return []
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
      return null
    }

    throw error
  }
}
