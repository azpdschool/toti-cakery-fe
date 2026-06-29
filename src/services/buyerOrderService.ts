// src/services/buyerOrderService.ts

export type OrderStatus = 'pending' | 'processed' | 'shipped' | 'completed' | 'cancelled';
export type DeliveryMethod = 'pickup' | 'delivery_toko' | 'delivery_third_party';
export type PaymentMethod = 'dp' | 'lunas';
export type PaymentStatus = 'unpaid' | 'paid' | 'partial';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface BuyerOrder {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  deliveryFee: number; // selalu 0 untuk sekarang (dihitung via WA)
  serviceFee: number; // 5000
  date: string;
  time: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  address?: string;
  recipientName?: string;
  recipientPhone?: string;
  notes?: string;
  estimatedDate?: string;
  completedDate?: string;
}

export interface OrderStats {
  totalOrders: number;
  completed: number;
  processed: number;
  pending: number;
}

// ============================================================
// DUMMY DATA
// ============================================================

let dummyOrders: BuyerOrder[] = [
  {
    id: '1',
    orderNumber: '#ORD-051',
    items: [
      {
        id: 'i1',
        productId: 'p1',
        productName: 'Red Velvet Cupcake',
        variantName: 'Standar',
        quantity: 2,
        price: 35000,
        subtotal: 70000,
      },
      {
        id: 'i2',
        productId: 'p2',
        productName: 'Chocolate Tart',
        variantName: 'Standar',
        quantity: 1,
        price: 45000,
        subtotal: 45000,
      },
    ],
    total: 120000, // subtotal 115000 + serviceFee 5000
    subtotal: 115000,
    deliveryFee: 0,
    serviceFee: 5000,
    date: '19 Jan 2026',
    time: '10:30 WIB',
    deliveryMethod: 'pickup',
    paymentMethod: 'lunas',
    paymentStatus: 'paid',
    status: 'completed',
    address: 'Toti Cakery Batam',
    recipientName: 'Jake Sim',
    recipientPhone: '0812-1234-5678',
    notes: 'Tolong dibungkus rapi',
    estimatedDate: '19 Jan 2026',
    completedDate: '19 Jan 2026',
  },
  {
    id: '2',
    orderNumber: '#ORD-050',
    items: [
      {
        id: 'i3',
        productId: 'p3',
        productName: 'Vanilla Cookies',
        variantName: 'Standar',
        quantity: 1,
        price: 85000,
        subtotal: 85000,
      },
    ],
    total: 90000, // subtotal 85000 + serviceFee 5000
    subtotal: 85000,
    deliveryFee: 0,
    serviceFee: 5000,
    date: 'Jan 2026',
    time: '09:15 WIB',
    deliveryMethod: 'delivery_toko',
    paymentMethod: 'dp',
    paymentStatus: 'partial',
    status: 'processed',
    address: 'Jl. Kue Manis No. 25, Bandung',
    recipientName: 'Jake Sim',
    recipientPhone: '0812-1234-5678',
    notes: '',
    estimatedDate: '19 Jan 2026 14:00 WIB',
  },
  {
    id: '3',
    orderNumber: '#ORD-049',
    items: [
      {
        id: 'i4',
        productId: 'p4',
        productName: 'Matcha Cupcake',
        variantName: 'Standar',
        quantity: 1,
        price: 40000,
        subtotal: 40000,
      },
      {
        id: 'i5',
        productId: 'p5',
        productName: 'Box Kemasan',
        variantName: 'Standar',
        quantity: 1,
        price: 160000,
        subtotal: 160000,
      },
    ],
    total: 205000, // subtotal 200000 + serviceFee 5000
    subtotal: 200000,
    deliveryFee: 0,
    serviceFee: 5000,
    date: '19 Jan 2026',
    time: '08:00 WIB',
    deliveryMethod: 'pickup',
    paymentMethod: 'dp',
    paymentStatus: 'unpaid',
    status: 'pending',
    address: 'Toti Cakery Batam',
    recipientName: 'Jake Sim',
    recipientPhone: '0812-1234-5678',
    notes: '',
    estimatedDate: '19 Jan 2026 12:00 WIB',
  },
  {
    id: '4',
    orderNumber: '#ORD-048',
    items: [
      {
        id: 'i6',
        productId: 'p6',
        productName: 'Chocolate Tart',
        variantName: 'Standar',
        quantity: 1,
        price: 150000,
        subtotal: 150000,
      },
    ],
    total: 155000, // subtotal 150000 + serviceFee 5000
    subtotal: 150000,
    deliveryFee: 0,
    serviceFee: 5000,
    date: '18 Jan 2026',
    time: '14:20 WIB',
    deliveryMethod: 'delivery_third_party',
    paymentMethod: 'lunas',
    paymentStatus: 'paid',
    status: 'cancelled',
    address: 'Jl. Kue Manis No. 25, Bandung',
    recipientName: 'Jake Sim',
    recipientPhone: '0812-1234-5678',
    notes: 'Dibatalkan karena salah alamat',
    estimatedDate: '19 Jan 2026 14:20 WIB',
  },
];

// ============================================================
// FUNGSI SERVICE
// ============================================================

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getBuyerOrders(): Promise<BuyerOrder[]> {
  await delay();
  return dummyOrders;
}

export async function getBuyerOrderById(id: string): Promise<BuyerOrder | undefined> {
  await delay();
  return dummyOrders.find((o) => o.id === id);
}

export async function getOrderStats(): Promise<OrderStats> {
  await delay();
  const total = dummyOrders.length;
  const completed = dummyOrders.filter((o) => o.status === 'completed').length;
  const processed = dummyOrders.filter((o) => o.status === 'processed' || o.status === 'shipped').length;
  const pending = dummyOrders.filter((o) => o.status === 'pending').length;
  return { totalOrders: total, completed, processed, pending };
}

export async function createOrder(
  data: Omit<BuyerOrder, 'id' | 'orderNumber' | 'date' | 'time' | 'status' | 'paymentStatus'>
): Promise<BuyerOrder> {
  await delay(800);
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const orderNumber = `#ORD-${String(Math.floor(Math.random() * 900) + 100)}`;

  // Gunakan total yang sudah dihitung di frontend (sudah 100% atau 50%)
  const total = data.total;
  const subtotal = data.subtotal || data.items.reduce((sum, item) => sum + item.subtotal, 0);

  const newOrder: BuyerOrder = {
    id: `order-${Date.now()}`,
    orderNumber,
    ...data,
    subtotal,
    total, // pakai total yang dikirim (sudah dihitung di frontend)
    deliveryFee: data.deliveryFee || 0,
    serviceFee: data.serviceFee || 0,
    date: dateStr,
    time: timeStr,
    status: 'pending',
    paymentStatus: data.paymentMethod === 'lunas' ? 'unpaid' : 'partial',
  };

  dummyOrders.unshift(newOrder);
  return newOrder;
}
export async function updateOrderPayment(orderId: string, paymentStatus: PaymentStatus): Promise<BuyerOrder> {
  await delay(500);
  const order = dummyOrders.find((o) => o.id === orderId);
  if (!order) throw new Error('Order not found');
  order.paymentStatus = paymentStatus;
  if (paymentStatus === 'paid') {
    order.status = 'processed';
  }
  return order;
}

// Fungsi untuk simulasi pembayaran
export async function simulatePayment(orderId: string): Promise<{ success: boolean; message: string }> {
  await delay(1500);
  const order = dummyOrders.find((o) => o.id === orderId);
  if (!order) return { success: false, message: 'Order tidak ditemukan' };
  order.paymentStatus = 'paid';
  order.status = 'processed';
  return { success: true, message: 'Pembayaran berhasil!' };
}