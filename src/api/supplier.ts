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

const activeSuppliersRequests = new Map<string, Promise<SupplierOut[]>>();

export async function getSuppliers(onlyActive?: boolean): Promise<SupplierOut[]> {
  const cacheKey = onlyActive ? 'active' : 'all';
  if (activeSuppliersRequests.has(cacheKey)) return activeSuppliersRequests.get(cacheKey)!;
  
  const params = onlyActive ? { only_active: true } : undefined;
  const promise = apiClient.get<SupplierOut[]>('/purchases/suppliers', { params })
    .then(response => response.data)
    .finally(() => {
      activeSuppliersRequests.delete(cacheKey);
    });
    
  activeSuppliersRequests.set(cacheKey, promise);
  return promise;
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
