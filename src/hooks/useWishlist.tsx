import { useState, useEffect } from 'react';
import { getBuyerWishlist, addToWishlist, removeFromWishlist } from '@/services/wishlistService';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

export function useWishlist() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'buyer') {
      fetchWishlist();
    } else {
      setWishlistIds(new Set());
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const products = await getBuyerWishlist();
      setWishlistIds(new Set(products.map(p => p.id)));
    } catch (error) {
      console.error('Failed to fetch wishlist', error);
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (user?.role !== 'buyer') {
      toast.error(t('wishlist.login_required', 'Silakan masuk sebagai Pembeli untuk menyimpan produk.'));
      return;
    }

    const isWishlisted = wishlistIds.has(productId);
    setLoading(true);

    try {
      if (isWishlisted) {
        await removeFromWishlist(Number(productId));
        setWishlistIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        toast.success(t('wishlist.removed', 'Produk dihapus dari wishlist.'));
      } else {
        await addToWishlist(Number(productId));
        setWishlistIds(prev => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
        toast.success(t('wishlist.added', 'Produk ditambahkan ke wishlist.'));
      }
    } catch (error) {
      toast.error(t('wishlist.error', 'Gagal memperbarui wishlist.'));
    } finally {
      setLoading(false);
    }
  };

  return { wishlistIds, toggleWishlist, loading, fetchWishlist };
}
