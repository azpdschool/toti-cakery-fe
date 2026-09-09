import { apiClient } from './client';

export interface PaymentChargeRequest {
  order_id: number;
  payment_method: string;
  payment_type: string;
  amount: number;
}

export interface PaymentChargeResponse {
  payment_id: number;
  pg_transaction_id: string | null;
  va_number: string | null;
  qris_url: string | null;
  status: string;
  midtrans_response: any;
}

export async function processPaymentAPI(payload: PaymentChargeRequest): Promise<PaymentChargeResponse> {
  const response = await apiClient.post('/payments', payload);
  return response.data;
}

export interface PaymentStatusResponse {
  order_id: number;
  invoice_status: string;
  amount_paid: number;
  amount_due: number;
  payments: Array<{
    id: number;
    pg_transaction_id: string | null;
    jumlah_bayar: number;
    payment_method: string;
    payment_status: string;
    payment_type: string;
    va_number: string | null;
    qris_url: string | null;
    created_at: string | null;
  }>;
}

export async function getPaymentStatusAPI(orderId: string | number): Promise<PaymentStatusResponse> {
  const response = await apiClient.get(`/payments/${orderId}/status`);
  return response.data;
}
