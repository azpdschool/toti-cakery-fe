import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  SupplierOut,
  SupplierCreate,
  SupplierUpdate,
} from '../api/supplier';

export const supplierService = {
  async fetchSuppliers(onlyActive?: boolean): Promise<SupplierOut[]> {
    return await getSuppliers(onlyActive);
  },
  async createSupplier(data: SupplierCreate): Promise<SupplierOut> {
    return await createSupplier(data);
  },
  async updateSupplier(id: number, data: SupplierUpdate): Promise<SupplierOut> {
    return await updateSupplier(id, data);
  },
  async deleteSupplier(id: number): Promise<boolean> {
    return await deleteSupplier(id);
  },
};
