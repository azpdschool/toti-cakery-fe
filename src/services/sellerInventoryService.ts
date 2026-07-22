// src/services/sellerInventoryService.ts

import {
  getStockItems,
  getStockItemById,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  type StockOut,
  type StockCreate,
  type StockUpdate,
  type StockCategoryApi,
  type StockUnitApi,
} from '@/api/stock';

// ============================================================
// TYPES FE
// ============================================================

export type InventoryCategory = 'Bahan' | 'Kemasan';

export type InventoryUnit = 'gram' | 'kg' | 'ml' | 'liter' | 'pcs';

export interface InventoryItem {
  /**
   * Ini wajib string dari StockItem.id backend.
   * Dipakai recipe sebagai stock_item_id.
   */
  id: string;
  name: string;

  /**
   * Backend stock_items belum punya kolom brand/supplier di model StockItem.
   * Jadi sementara isi '-'.
   */
  brand: string;

  category: InventoryCategory;
  unit: InventoryUnit;

  /**
   * stok_tersedia dari backend
   */
  stock: number;

  /**
   * Backend belum punya minimum stock.
   * FE pakai nilai turunan supaya status Aman/Menipis tetap bisa jalan.
   */
  minStock: number;

  /**
   * harga_per_satuan dari backend.
   * Ini yang dipakai BE untuk hitung HPP:
   * jumlah_dibutuhkan x harga_per_satuan
   */
  pricePerUnit: number;

  createdAt: string;
  updatedAt: string;
}

export interface InventoryStats {
  totalItems: number;
  safeStock: number;
  lowStock: number;
  emptyStock: number;
}

export interface InventoryOption {
  /**
   * Ini harus stock_items.id dari backend.
   */
  id: string;
  name: string;
  brand: string;
  unit: string;
  stock: number;
}

// ============================================================
// MAPPERS
// ============================================================

function parseNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function mapApiCategoryToFe(category: StockCategoryApi): InventoryCategory {
  return category === 'kemasan' ? 'Kemasan' : 'Bahan';
}

function mapFeCategoryToApi(category: InventoryCategory): StockCategoryApi {
  return category === 'Kemasan' ? 'kemasan' : 'bahan_baku';
}

function mapApiUnitToFe(unit: StockUnitApi): InventoryUnit {
  return unit;
}

function mapFeUnitToApi(unit: InventoryUnit): StockUnitApi {
  return unit;
}

function getDefaultMinStock(unit: InventoryUnit): number {
  switch (unit) {
    case 'kg':
      return 1;
    case 'gram':
      return 500;
    case 'liter':
      return 1;
    case 'ml':
      return 500;
    case 'pcs':
      return 10;
    default:
      return 1;
  }
}

function mapStockOutToInventoryItem(item: StockOut): InventoryItem {
  const unit = mapApiUnitToFe(item.satuan);
  const stock = parseNumber(item.stok_tersedia);

  return {
    id: String(item.id),
    name: item.nama_item,
    brand: '-',
    category: mapApiCategoryToFe(item.kategori),
    unit,
    stock,
    minStock: getDefaultMinStock(unit),
    pricePerUnit: parseNumber(item.harga_per_satuan),
    createdAt: item.created_at ?? '',
    updatedAt: item.updated_at ?? item.created_at ?? '',
  };
}

function toStockCreatePayload(
  data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>
): StockCreate {
  return {
    nama_item: data.name.trim(),
    satuan: mapFeUnitToApi(data.unit),
    kategori: mapFeCategoryToApi(data.category),
    harga_per_satuan: data.pricePerUnit,
    stok_tersedia: data.stock,
  };
}

function toStockUpdatePayload(
  data: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>
): StockUpdate {
  const payload: StockUpdate = {};

  if (data.name !== undefined) payload.nama_item = data.name.trim();
  if (data.unit !== undefined) payload.satuan = mapFeUnitToApi(data.unit);
  if (data.category !== undefined) payload.kategori = mapFeCategoryToApi(data.category);
  if (data.pricePerUnit !== undefined) payload.harga_per_satuan = data.pricePerUnit;
  if (data.stock !== undefined) payload.stok_tersedia = data.stock;

  return payload;
}

// ============================================================
// SERVICE FUNCTIONS
// ============================================================

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const stockItems = await getStockItems();

  return stockItems.map(mapStockOutToInventoryItem);
}

export async function getInventoryItemById(itemId: string): Promise<InventoryItem> {
  const stockItem = await getStockItemById(Number(itemId));

  return mapStockOutToInventoryItem(stockItem);
}

export async function getInventoryStats(): Promise<InventoryStats> {
  const items = await getInventoryItems();

  const totalItems = items.length;
  const safeStock = items.filter((item) => item.stock > item.minStock).length;
  const lowStock = items.filter(
    (item) => item.stock <= item.minStock && item.stock > 0
  ).length;
  const emptyStock = items.filter((item) => item.stock === 0).length;

  return {
    totalItems,
    safeStock,
    lowStock,
    emptyStock,
  };
}

export async function addInventoryItem(
  data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<InventoryItem> {
  const created = await createStockItem(toStockCreatePayload(data));

  return mapStockOutToInventoryItem(created);
}

export async function updateInventoryItem(
  itemId: string,
  data: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<InventoryItem> {
  const updated = await updateStockItem(Number(itemId), toStockUpdatePayload(data));

  return mapStockOutToInventoryItem(updated);
}

export async function updateStock(
  itemId: string,
  newStock: number
): Promise<InventoryItem> {
  const updated = await updateStockItem(Number(itemId), {
    stok_tersedia: newStock,
  });

  return mapStockOutToInventoryItem(updated);
}

export async function deleteInventoryItem(itemId: string): Promise<boolean> {
  return deleteStockItem(Number(itemId));
}

/**
 * Untuk dropdown bahan di Product Recipe.
 *
 * PENTING:
 * id harus benar-benar stock_items.id dari backend.
 * Kalau id dummy/index, backend akan error:
 * "Ingredient not found — bahan baku tidak terdaftar di inventory."
 */
export async function getInventoryOptions(): Promise<InventoryOption[]> {
  const stockItems = await getStockItems('bahan_baku');

  return stockItems.map((item) => ({
    id: String(item.id),
    name: item.nama_item,
    brand: '-',
    unit: item.satuan,
    stock: parseNumber(item.stok_tersedia),
  }));
}

/**
 * Sementara tidak dipakai langsung untuk update DB.
 * Pengurangan stok saat order sebaiknya dilakukan backend saat order confirmed.
 */
export async function deductStock(
  _ingredients: { inventoryId: string; quantity: number }[]
): Promise<void> {
  console.warn(
    'deductStock() tidak dijalankan di FE. Pengurangan stok sebaiknya dilakukan backend saat order confirmed.'
  );
}
