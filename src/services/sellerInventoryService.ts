// src/services/sellerInventoryService.ts

// ============================================================
// TYPES
// ============================================================

export type InventoryCategory = 'Bahan' | 'Kemasan';
export type InventoryUnit =
  | 'gr'
  | 'kg'
  | 'ml'
  | 'ltr'
  | 'sdm'
  | 'sdt'
  | 'cup'
  | 'butir'
  | 'siung'
  | 'lbr'
  | 'ikat'
  | 'batang'
  | 'pinch'
  | 'dash'
  | 'pcs';

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  category: InventoryCategory;
  unit: InventoryUnit;
  stock: number; // stok tersedia
  minStock: number; // alert jika di bawah ini
  pricePerUnit: number; // harga beli per satuan
  createdAt: string;
  updatedAt: string;
}

export interface InventoryStats {
  totalItems: number;
  safeStock: number;
  lowStock: number;
  emptyStock: number;
}

// ============================================================
// DUMMY DATA
// ============================================================

const dummyInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Tepung Terigu',
    brand: 'Cakra Kembar',
    category: 'Bahan',
    unit: 'kg',
    stock: 20,
    minStock: 5,
    pricePerUnit: 12000,
    createdAt: '2026-01-01',
    updatedAt: '2026-05-20',
  },
  {
    id: '2',
    name: 'Tepung Kanji',
    brand: 'Rose Brand',
    category: 'Bahan',
    unit: 'kg',
    stock: 1,
    minStock: 3,
    pricePerUnit: 13000,
    createdAt: '2026-01-01',
    updatedAt: '2026-05-18',
  },
  {
    id: '3',
    name: 'Mentega',
    brand: 'Blueband',
    category: 'Bahan',
    unit: 'kg',
    stock: 0,
    minStock: 2,
    pricePerUnit: 14000,
    createdAt: '2026-01-01',
    updatedAt: '2026-05-15',
  },
  {
    id: '4',
    name: 'Mentega (kemasan 200gr)',
    brand: 'Blueband',
    category: 'Bahan',
    unit: 'gr',
    stock: 0,
    minStock: 1000,
    pricePerUnit: 28000,
    createdAt: '2026-01-01',
    updatedAt: '2026-05-10',
  },
  {
    id: '5',
    name: 'Telur Ayam Organik',
    brand: 'Telur',
    category: 'Bahan',
    unit: 'butir',
    stock: 0,
    minStock: 30,
    pricePerUnit: 38000,
    createdAt: '2026-01-01',
    updatedAt: '2026-05-08',
  },
  {
    id: '6',
    name: 'Cokelat Bubuk',
    brand: 'Van Houtten',
    category: 'Bahan',
    unit: 'kg',
    stock: 1,
    minStock: 2,
    pricePerUnit: 39000,
    createdAt: '2026-01-01',
    updatedAt: '2026-05-12',
  },
  {
    id: '7',
    name: 'Susu Full Cream',
    brand: 'Ultra Milk',
    category: 'Bahan',
    unit: 'ltr',
    stock: 2,
    minStock: 5,
    pricePerUnit: 41000,
    createdAt: '2026-01-01',
    updatedAt: '2026-05-14',
  },
  {
    id: '8',
    name: 'Kemasan (S)',
    brand: 'Batam Printing',
    category: 'Kemasan',
    unit: 'pcs',
    stock: 20,
    minStock: 25,
    pricePerUnit: 40000,
    createdAt: '2026-01-01',
    updatedAt: '2026-05-16',
  },
  {
    id: '9',
    name: 'Kemasan (M)',
    brand: 'Batam Printing',
    category: 'Kemasan',
    unit: 'pcs',
    stock: 50,
    minStock: 30,
    pricePerUnit: 42000,
    createdAt: '2026-01-01',
    updatedAt: '2026-05-17',
  },
  {
    id: '10',
    name: 'Kemasan (L)',
    brand: 'Batam Printing',
    category: 'Kemasan',
    unit: 'pcs',
    stock: 50,
    minStock: 30,
    pricePerUnit: 43000,
    createdAt: '2026-01-01',
    updatedAt: '2026-05-17',
  },
];

// ============================================================
// FUNGSI SERVICE
// ============================================================

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getInventoryItems(): Promise<InventoryItem[]> {
  await delay();
  return dummyInventory;
}

export async function getInventoryStats(): Promise<InventoryStats> {
  await delay();
  const items = dummyInventory;
  const totalItems = items.length;
  const safeStock = items.filter((i) => i.stock > i.minStock).length;
  const lowStock = items.filter((i) => i.stock <= i.minStock && i.stock > 0).length;
  const emptyStock = items.filter((i) => i.stock === 0).length;
  return { totalItems, safeStock, lowStock, emptyStock };
}

export async function addInventoryItem(
  data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<InventoryItem> {
  await delay(500);
  const newItem: InventoryItem = {
    id: `inv-${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };
  dummyInventory.unshift(newItem);
  return newItem;
}

export async function updateStock(itemId: string, newStock: number): Promise<InventoryItem> {
  await delay(300);
  const item = dummyInventory.find((i) => i.id === itemId);
  if (!item) throw new Error('Item not found');
  item.stock = newStock;
  item.updatedAt = new Date().toISOString().split('T')[0];
  return item;
}

// Fungsi untuk mengurangi stok berdasarkan resep (dipanggil saat order confirmed)
export async function deductStock(
  ingredients: { inventoryId: string; quantity: number }[]
): Promise<void> {
  await delay(500);
  for (const ing of ingredients) {
    const item = dummyInventory.find((i) => i.id === ing.inventoryId);
    if (item) {
      const newStock = Math.max(0, item.stock - ing.quantity);
      item.stock = newStock;
      item.updatedAt = new Date().toISOString().split('T')[0];
    }
  }
}

// Fungsi untuk mendapatkan daftar bahan (untuk dropdown di produk)
export async function getInventoryOptions(): Promise<
  { id: string; name: string; brand: string; unit: string; stock: number }[]
> {
  await delay();
  return dummyInventory.map((item) => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    unit: item.unit,
    stock: item.stock,
  }));
}