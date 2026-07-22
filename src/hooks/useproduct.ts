// src/hooks/useProduct.ts
import { useState, useEffect, useCallback } from 'react';
import { getProductById, type ProductOut } from '@/api/product';

interface UseProductResult {
  product: ProductOut | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProduct(id: number | null): UseProductResult {
  const [product, setProduct] = useState<ProductOut | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async (): Promise<void> => {
    if (!id) {
      setProduct(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getProductById(id);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchProduct();
  }, [fetchProduct]);

  return { product, loading, error, refetch: fetchProduct };
}