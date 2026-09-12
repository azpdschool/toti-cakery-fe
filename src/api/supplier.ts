import { apiClient } from './client';

export interface SupplierOut {
  id: number;
  nama_supplier: string;
  kontak_person?: string;
  email?: string;
  nomor_telepon?: string;
  alamat?: string;
  kota?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierCreate {
  nama_supplier: string;
  kontak_person?: string;
  email?: string;
  nomor_telepon?: string;
  alamat?: string;
  kota?: string;
}

export interface SupplierUpdate {
  nama_supplier?: string;
  kontak_person?: string;
  email?: string;
  nomor_telepon?: string;
  alamat?: string;
  kota?: string;
  is_active?: boolean;
}

export async function getSuppliers(): Promise<SupplierOut[]> {
  const response = await apiClient.get<SupplierOut[]>('/purchases/suppliers');
  return response.data;
}

export async function createSupplier(payload: SupplierCreate): Promise<SupplierOut> {
  const response = await apiClient.post<SupplierOut>('/purchases/suppliers', payload);
  return response.data;
}

export async function updateSupplier(id: number, payload: SupplierUpdate): Promise<SupplierOut> {
  const response = await apiClient.put<SupplierOut>(`/purchases/suppliers/${id}`, payload);
  return response.data;
}

export async function deleteSupplier(id: number): Promise<boolean> {
  const response = await apiClient.delete<boolean>(`/purchases/suppliers/${id}`);
  return response.data;
}
