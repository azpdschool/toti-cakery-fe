// src/hooks/useProducts.ts
import { useState, useEffect, useCallback } from 'react';
import { getAllProducts, type ProductOut } from '@/api/product';

interface UseProductsResult {
  products: ProductOut[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProducts(onlyActive: boolean = true): UseProductsResult {
  const [products, setProducts] = useState<ProductOut[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllProducts(onlyActive);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  }, [onlyActive]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}