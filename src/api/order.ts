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
}

export async function createBuyerOrderAPI(payload: BuyerOrderCreate) {
  const response = await apiClient.post('/orders/buyer', payload);
  return response.data;
}
