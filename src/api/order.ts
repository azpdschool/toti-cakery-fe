import { apiClient } from './client';

export interface OrderItemCreate {
  product_id: number;
  jumlah: number;
  custom_decoration_charge: number;
}

export interface CustomOrderAccessoryCreate {
  stock_item_id: number;
  quantity: string;
}

export interface CustomOrderItemCreate {
  product_id: number;
  qty: number;
  custom_decoration_charge: string;
  customizations?: CustomOrderAccessoryCreate[];
}

export interface CustomOrderCreate {
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  metode_pengiriman: string;
  notes?: string;
  fulfillment_date: string;
  payment_method_preference?: string;
  items: CustomOrderItemCreate[];
  accessories?: CustomOrderAccessoryCreate[];
}

export interface OrderLineAccessoryOut {
  id: number;
  stock_item_id: number;
  stock_item_name: string;
  unit: string;
  quantity: string | number;
}

export interface OrderAccessoryOut {
  id: number;
  stock_item_id: number;
  stock_item_name: string;
  unit: string;
  quantity: string | number;
  unit_cost_snapshot: string | number;
  subtotal: string | number;
}

export async function createCustomOrderAPI(payload: CustomOrderCreate) {
  const response = await apiClient.post('/orders/custom', payload);
  return response.data;
}

export interface BuyerOrderCreate {
  metode_pengiriman: string;
  items: OrderItemCreate[];
  created_via: string;
  notes?: string;
  payment_method_preference?: string;
  fulfillment_date: string;
}

export async function createBuyerOrderAPI(payload: BuyerOrderCreate) {
  const response = await apiClient.post('/orders/buyer', payload);
  return response.data;
}

export async function downloadOrderInvoicePdfAPI(orderId: number | string, lang?: string) {
  return apiClient.get(`/orders/${orderId}/invoice/pdf`, {
    responseType: 'blob',
    params: { lang },
  });
}

export async function cancelBuyerOrderAPI(orderId: number | string) {
  const response = await apiClient.post(`/orders/buyer/${orderId}/cancel`, {});
  return response.data;
}

export interface OrderDateUpdatePayload {
  fulfillment_date: string;
}

export async function updateOrderFulfillmentDate(orderId: number | string, payload: OrderDateUpdatePayload) {
  const response = await apiClient.patch(`/orders/${orderId}/fulfillment-date`, payload);
  return response.data;
}

export const updateOrderFulfillmentDateAPI = updateOrderFulfillmentDate;

export interface RefundOrderPayload {
  reason: string;
  amount?: number;
  nomor_wa?: string;
}

export interface RefundResponse {
  message: string;
  order_id: number;
  status: string;
  payment_status: string;
  refund_mode: 'auto' | 'manual' | 'in_progress' | string;
}

export async function refundOrder(orderId: number | string, payload: RefundOrderPayload): Promise<RefundResponse> {
  const response = await apiClient.post<RefundResponse>(`/orders/${orderId}/refund`, payload);
  return response.data;
}

export const refundOrderAPI = refundOrder;


