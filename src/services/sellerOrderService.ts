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
  | 'dibatalkan';

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
  invoiceId?: string;
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
// DUMMY DATA - Orders
// ============================================================

let dummyOrders: Order[] = [
  {
    id: '1',
    orderNumber: '#76',
    customerName: 'Jay',
    customerPhone: '081234567801',
    total: 301900,
    date: '24 Mei 2026',
    time: '10.55',
    method: 'Pickup',
    paymentMethod: 'DP',
    dueDate: '27 Mei 2026',
    status: 'belum_dibayar',
  },
  {
    id: '2',
    orderNumber: '#75',
    customerName: 'Sean',
    customerPhone: '082145678912',
    total: 207800,
    date: '21 Mei 2026',
    time: '10.55',
    method: 'Pickup',
    paymentMethod: 'DP',
    dueDate: '24 Mei 2026',
    status: 'sudah_dikonfirmasi',
  },
  {
    id: '3',
    orderNumber: '#74',
    customerName: 'Martin',
    customerPhone: '083256789123',
    total: 187300,
    date: '20 Mei 2026',
    time: '11.10',
    method: 'Delivery Toko',
    paymentMethod: 'DP',
    dueDate: '23 Mei 2026',
    status: 'sedang_dibuat',
  },
  {
    id: '4',
    orderNumber: '#73',
    customerName: 'Heeseung',
    customerPhone: '085367891234',
    total: 165600,
    date: '20 Mei 2026',
    time: '19.20',
    method: 'Delivery Pihak Ketiga',
    paymentMethod: 'DP',
    dueDate: '23 Mei 2026',
    status: 'sedang_dibuat',
  },
  {
    id: '5',
    orderNumber: '#72',
    customerName: 'Keonho',
    customerPhone: '087478912345',
    total: 54500,
    date: '20 Mei 2026',
    time: '13.40',
    method: 'Pickup',
    paymentMethod: 'DP',
    dueDate: '23 Mei 2026',
    status: 'sedang_dibuat',
  },
  {
    id: '6',
    orderNumber: '#71',
    customerName: 'Juhoon',
    customerPhone: '088589123456',
    total: 65400,
    date: '19 Mei 2026',
    time: '18.50',
    method: 'Pickup',
    paymentMethod: 'DP',
    dueDate: '22 Mei 2026',
    status: 'siap_dikirim',
  },
  {
    id: '7',
    orderNumber: '#70',
    customerName: 'Yeonjun',
    customerPhone: '089690234567',
    total: 198300,
    date: '18 Mei 2026',
    time: '12.13',
    method: 'Delivery Toko',
    paymentMethod: 'DP',
    dueDate: '21 Mei 2026',
    status: 'selesai',
  },
  {
    id: '8',
    orderNumber: '#69',
    customerName: 'Soobin',
    customerPhone: '081701345678',
    total: 743200,
    date: '17 Mei 2026',
    time: '10.19',
    method: 'Delivery Pihak Ketiga',
    paymentMethod: 'LUNAS',
    dueDate: '20 Mei 2026',
    status: 'selesai',
  },
  {
    id: '9',
    orderNumber: '#68',
    customerName: 'Beomgyu',
    customerPhone: '082812456789',
    total: 982100,
    date: '16 Mei 2026',
    time: '17.14',
    method: 'Pickup',
    paymentMethod: 'LUNAS',
    dueDate: '19 Mei 2026',
    status: 'dibatalkan',
  },
  {
    id: '10',
    orderNumber: '#67',
    customerName: 'Jaeyoon',
    customerPhone: '083923567890',
    total: 1800000,
    date: '15 Mei 2026',
    time: '15.11',
    method: 'Delivery Toko',
    paymentMethod: 'LUNAS',
    dueDate: '18 Mei 2026',
    status: 'selesai',
  },
];

// ============================================================
// DUMMY DATA - Invoices
// ============================================================

let dummyInvoices: Invoice[] = [];

function generateInvoiceFromOrder(order: Order, paid: number = 0): Invoice {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const invoiceNumber = `INV-${dateStr}-${rand}`;
  let status: 'LUNAS' | 'DP' | 'Belum' = 'Belum';
  if (paid >= order.total) status = 'LUNAS';
  else if (paid > 0) status = 'DP';
  return {
    id: `inv-${Date.now()}`,
    invoiceNumber,
    orderId: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    orderNumber: order.orderNumber,
    date: order.date,
    time: order.time,
    total: order.total,
    paid,
    status,
    items: order.items,
    notes: order.notes,
    orderMethod: order.method,
    dueDate: order.dueDate,
  };
}

// Inisialisasi invoice dari order yang ada
dummyOrders.forEach((order) => {
  let paid = 0;
  if (order.paymentMethod === 'LUNAS') paid = order.total;
  else if (order.paymentMethod === 'DP') paid = Math.round(order.total * 0.5);
  // variasi untuk beberapa order
  if (order.status === 'selesai' && order.paymentMethod === 'LUNAS') paid = order.total;
  else if (order.status === 'selesai' && order.paymentMethod === 'DP') paid = Math.round(order.total * 0.5);
  else if (
    order.status === 'sudah_dikonfirmasi' ||
    order.status === 'sedang_dibuat' ||
    order.status === 'siap_dikirim'
  ) {
    paid = Math.round(order.total * 0.5);
  } else {
    paid = 0;
  }
  const invoice = generateInvoiceFromOrder(order, paid);
  dummyInvoices.push(invoice);
  order.invoiceId = invoice.id;
});

// ============================================================
// FUNGSI SERVICE - ORDERS
// ============================================================

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getOrders(): Promise<Order[]> {
  await delay();
  return dummyOrders;
}

export async function getOrderStats(): Promise<{
  totalOrdersThisMonth: number;
  ordersChange: string;
  completed: number;
  completedChange: string;
  processed: number;
  processedChange: string;
  waitingConfirmation: number;
  waitingChange: string;
}> {
  await delay();
  const totalOrders = dummyOrders.length;
  const completed = dummyOrders.filter((o) => o.status === 'selesai').length;
  const processed = dummyOrders.filter((o) => o.status === 'sedang_dibuat').length;
  const waitingConfirmation = dummyOrders.filter(
    (o) => o.status === 'belum_dibayar' || o.status === 'sudah_dikonfirmasi'
  ).length;

  return {
    totalOrdersThisMonth: totalOrders,
    ordersChange: '+9% dari bulan lalu',
    completed,
    completedChange: '+15% dari bulan lalu',
    processed,
    processedChange: '-3% dari bulan lalu',
    waitingConfirmation,
    waitingChange: '-8% dari bulan lalu',
  };
}

export async function addOrder(orderData: Partial<Order>): Promise<Order> {
  await delay(500);
  const newOrder: Order = {
    id: `order-${Date.now()}`,
    orderNumber: `#${Math.floor(Math.random() * 100) + 1}`,
    customerName: orderData.customerName || 'Customer',
    customerPhone: orderData.customerPhone || '',
    address: orderData.address || '',
    total: orderData.total || 0,
    date: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    method: orderData.method || 'Pickup',
    paymentMethod: orderData.paymentMethod || 'DP',
    dueDate:
      orderData.dueDate ||
      new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    status: 'belum_dibayar',
    items: orderData.items || [],
    notes: orderData.notes || '',
    customDesignFee: orderData.customDesignFee || 0,
  };
  dummyOrders.unshift(newOrder);
  // Generate invoice
  let paid = 0;
  if (newOrder.paymentMethod === 'LUNAS') paid = newOrder.total;
  else if (newOrder.paymentMethod === 'DP') paid = Math.round(newOrder.total * 0.5);
  const invoice = generateInvoiceFromOrder(newOrder, paid);
  dummyInvoices.unshift(invoice);
  newOrder.invoiceId = invoice.id;
  return newOrder;
}

export async function updateOrderPayment(orderId: string, paidAmount: number): Promise<Order> {
  await delay(300);
  const order = dummyOrders.find((o) => o.id === orderId);
  if (!order) throw new Error('Order not found');
  const invoice = dummyInvoices.find((inv) => inv.orderId === orderId);
  if (invoice) {
    invoice.paid += paidAmount;
    if (invoice.paid >= invoice.total) {
      invoice.status = 'LUNAS';
    } else if (invoice.paid > 0) {
      invoice.status = 'DP';
    } else {
      invoice.status = 'Belum';
    }
    if (invoice.status === 'LUNAS') {
      order.status = 'sudah_dikonfirmasi';
      order.paymentMethod = 'LUNAS';
    }
  }
  return order;
}

// ============================================================
// FUNGSI SERVICE - INVOICES (untuk keuangan)
// ============================================================

export async function getInvoices(): Promise<Invoice[]> {
  await delay();
  return dummyInvoices;
}

export async function getInvoiceById(id: string): Promise<Invoice | undefined> {
  await delay();
  return dummyInvoices.find((inv) => inv.id === id);
}

export function exportInvoicePdf(invoiceId: string): void {
  console.log(`Export invoice ${invoiceId} to PDF`);
  alert(`Invoice ${invoiceId} akan di-export ke PDF (simulasi)`);
}

export function exportInvoicesPdf(invoiceIds: string[]): void {
  console.log(`Export invoices ${invoiceIds.join(', ')} to PDF`);
  alert(`Export ${invoiceIds.length} invoice ke PDF (simulasi)`);
}