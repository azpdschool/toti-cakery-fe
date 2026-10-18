import { apiClient } from './client';

export interface OrderItemCreate {
  product_id: number;
  jumlah: number;
  custom_decoration_charge: number;
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

