// src/services/sellerInventoryService.ts

import {
  getStockItems,
  getStockItemById,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  adjustStock,
  getStockMovements,
  invalidateStockCache,
  type StockOut,
  type StockCreate,
  type StockUpdate,
  type StockCategoryApi,
  type StockUnitApi,
  type StockAdjustmentCreate,
  type StockMovementOut,
} from '@/api/stock';

// ============================================================
// TYPES FE
// ============================================================

export type InventoryCategory = 'Bahan' | 'Kemasan';

export type InventoryUnit = 'gram' | 'kg' | 'ml' | 'liter' | 'pcs';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: InventoryUnit;
  stock: number;
  minStock: number;
  pricePerUnit: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryStats {
  totalItems: number;
  safeStock: number;
  lowStock: number;
  emptyStock: number;
  totalValue: number;
}

export interface InventoryOption {
  id: string;
  name: string;
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

function mapStockOutToInventoryItem(item: StockOut): InventoryItem {
  const unit = mapApiUnitToFe(item.satuan);
  const stock = parseNumber(item.stok_tersedia);
  const minStock = parseNumber(item.alert_min_stok);

  return {
    id: String(item.id),
    name: item.nama_item,
    category: mapApiCategoryToFe(item.kategori),
    unit,
    stock,
    minStock,
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
    alert_min_stok: data.minStock,
  };
}

function toStockUpdatePayload(
  data: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>
): StockUpdate {
  const payload: StockUpdate = {};

  if (data.name !== undefined) payload.nama_item = data.name.trim();
  if (data.unit !== undefined) payload.satuan = mapFeUnitToApi(data.unit);
  if (data.category !== undefined) payload.kategori = mapFeCategoryToApi(data.category);
  if (data.minStock !== undefined) payload.alert_min_stok = data.minStock;

  return payload;
}

// ============================================================
// LOCAL STORAGE STORAGE FOR DELETED STOCK IDS
// ============================================================

const DELETED_STOCK_IDS_STORAGE_KEY = 'toti_deleted_stock_ids';

export function getDeletedStockIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_STOCK_IDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (err) {
    console.error('Failed to parse deleted stock ids from localStorage', err);
    return [];
  }
}

export function addDeletedStockId(id: string | number): void {
  try {
    const current = getDeletedStockIds();
    const idStr = String(id);
    if (!current.includes(idStr)) {
      current.push(idStr);
      localStorage.setItem(DELETED_STOCK_IDS_STORAGE_KEY, JSON.stringify(current));
    }
  } catch (err) {
    console.error('Failed to save deleted stock id to localStorage', err);
  }
}

export function removeDeletedStockId(id: string | number): void {
  try {
    const current = getDeletedStockIds();
    const idStr = String(id);
    const updated = current.filter((item) => item !== idStr);
    localStorage.setItem(DELETED_STOCK_IDS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove deleted stock id from localStorage', err);
  }
}

// ============================================================
// SERVICE FUNCTIONS
// ============================================================

export async function getInventoryItems(signal?: AbortSignal): Promise<InventoryItem[]> {
  const stockItems = await getStockItems(undefined, signal);
  const deletedIds = new Set(getDeletedStockIds());
  return stockItems
    .filter((item) => !deletedIds.has(String(item.id)))
    .map(mapStockOutToInventoryItem);
}

export async function getInventoryItemById(itemId: string): Promise<InventoryItem> {
  const stockItem = await getStockItemById(Number(itemId));
  return mapStockOutToInventoryItem(stockItem);
}

export function getInventoryStats(items: InventoryItem[]): InventoryStats {
  const totalItems = items.length;
  const safeStock = items.filter((item) => item.stock > item.minStock).length;
  const lowStock = items.filter(
    (item) => item.stock <= item.minStock && item.stock > 0
  ).length;
  const emptyStock = items.filter((item) => item.stock === 0).length;
  
  const totalValue = items.reduce((sum, item) => sum + (item.stock * item.pricePerUnit), 0);

  return {
    totalItems,
    safeStock,
    lowStock,
    emptyStock,
    totalValue,
  };
}

export async function addInventoryItem(
  data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<InventoryItem> {
  const created = await createStockItem(toStockCreatePayload(data));
  removeDeletedStockId(created.id);
  return mapStockOutToInventoryItem(created);
}

export async function updateInventoryItem(
  itemId: string,
  data: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<InventoryItem> {
  const updated = await updateStockItem(Number(itemId), toStockUpdatePayload(data));
  return mapStockOutToInventoryItem(updated);
}

export async function deleteInventoryItem(itemId: string): Promise<boolean> {
  try {
    return await deleteStockItem(Number(itemId));
  } catch (err: unknown) {
    const errObj = err as {
      response?: {
        status?: number;
        data?: { detail?: unknown; message?: string };
      };
      message?: string;
    };
    const detail = errObj.response?.data?.detail;
    const rawMsg = (
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string; type?: string }) => String(d.msg || d.type || '')).join(' ')
          : errObj.response?.data?.message || errObj.message || ''
    ).toLowerCase();

    const isRecipeConflict = rawMsg.includes('resep') || rawMsg.includes('recipe');
    const status = errObj.response?.status;

    const hasHistoryKeyword =
      rawMsg.includes('stock history') ||
      rawMsg.includes('history') ||
      rawMsg.includes('histori') ||
      rawMsg.includes('movement') ||
      rawMsg.includes('saldo');

    const isStockHistoryError =
      !isRecipeConflict &&
      (hasHistoryKeyword || status === 409 || status === 400);

    if (isStockHistoryError) {
      invalidateStockCache();
      addDeletedStockId(itemId);
      return true;
    }

    throw err;
  }
}

export async function adjustStockService(
  itemId: string,
  quantityDifference: number,
  reason: string,
  unitCost?: number
): Promise<InventoryItem> {
  const payload: StockAdjustmentCreate = {
    quantity_difference: quantityDifference,
    reason,
  };
  if (unitCost !== undefined) payload.unit_cost = unitCost;
  const updated = await adjustStock(Number(itemId), payload);
  return mapStockOutToInventoryItem(updated);
}

export async function getStockMovementsService(itemId: string): Promise<StockMovementOut[]> {
  return getStockMovements(Number(itemId));
}

export async function getInventoryOptions(): Promise<InventoryOption[]> {
  const stockItems = await getStockItems('bahan_baku');
  const deletedIds = new Set(getDeletedStockIds());
  return stockItems
    .filter((item) => !deletedIds.has(String(item.id)))
    .map((item) => ({
      id: String(item.id),
      name: item.nama_item,
      unit: item.satuan,
      stock: parseNumber(item.stok_tersedia),
    }));
}

export async function getAllInventoryOptions(): Promise<InventoryOption[]> {
  const stockItems = await getStockItems();
  const deletedIds = new Set(getDeletedStockIds());
  return stockItems
    .filter((item) => !deletedIds.has(String(item.id)))
    .map((item) => ({
      id: String(item.id),
      name: item.nama_item,
      unit: item.satuan,
      stock: parseNumber(item.stok_tersedia),
    }));
}

export async function deductStock(
  _ingredients: { inventoryId: string; quantity: number }[]
): Promise<void> {
  console.warn(
    'deductStock() tidak dijalankan di FE. Pengurangan stok sebaiknya dilakukan backend saat order confirmed.',
    _ingredients
  );
}
