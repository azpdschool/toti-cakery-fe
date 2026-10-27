// src/types/expense.ts

export type ExpensePaymentMethod = 'cash' | 'bank_transfer' | 'e_wallet' | 'card' | 'other';

export interface ExpenseCreate {
  kategori: string;
  jumlah: number;
  tanggal?: string; // ISO date string
  deskripsi?: string | null;
  penerima?: string | null;
  metode_pembayaran?: ExpensePaymentMethod | null;
  bukti_url?: string | null;
}

export interface ExpenseUpdate {
  kategori?: string;
  jumlah?: number;
  tanggal?: string;
  deskripsi?: string | null;
  penerima?: string | null;
  metode_pembayaran?: ExpensePaymentMethod | null;
  bukti_url?: string | null;
}

export interface ExpenseCancelRequest {
  reason: string;
}

export interface ExpenseDetailResponse {
  id: number;
  kategori: string;
  jumlah: number;
  recorded_by: number;
  recorded_by_username: string;
  tanggal: string; // ISO date string
  created_at: string;
  updated_at: string | null;
  deskripsi?: string | null;
  penerima?: string | null;
  metode_pembayaran?: ExpensePaymentMethod | null;
  bukti_url?: string | null;
  is_voided?: boolean;
  void_reason?: string | null;
  voided_at?: string | null;
  voided_by?: number | null;
  updated_by?: number | null;
}


export interface ExpensesSummary {
  total_expenses: number | string;
  by_category: Record<string, number | string>;
  count: number;
  period: {
    start_date: string | null;
    end_date: string | null;
  };
}

export interface ExpenseAuditItem {
  id: number;
  expense_id: number;
  action: 'created' | 'updated' | 'voided';
  actor_id: number | null;
  changes: Record<string, any>;
  created_at: string;
}

