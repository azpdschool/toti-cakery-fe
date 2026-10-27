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
  jumlah_bayar?: number;
  payment_method?: string;
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

export interface ManualPaymentRequest {
  order_id: string | number;
  amount: number;
  payment_method: string;
  notes?: string;
}

export interface ManualPaymentResponse {
  success: boolean;
  message: string;
  payment_id: number;
  order_id: number;
  amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
}

export async function createManualPayment(payload: ManualPaymentRequest): Promise<ManualPaymentResponse> {
  const response = await apiClient.post<ManualPaymentResponse>('/payments/manual', {
    order_id: String(payload.order_id),
    amount: Number(payload.amount),
    payment_method: payload.payment_method,
    notes: payload.notes || null,
  });
  return response.data;
}

export const createManualPaymentAPI = createManualPayment;

