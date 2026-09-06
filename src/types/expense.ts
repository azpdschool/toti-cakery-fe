// src/types/expense.ts

export interface ExpenseCreate {
  kategori: string;
  jumlah: number;
  tanggal?: string; // ISO date string
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
