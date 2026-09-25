import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getBuyerWishlist, addToWishlist, removeFromWishlist } from '@/services/wishlistService';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface WishlistContextType {
  wishlistIds: Set<string>;
  toggleWishlist: (productId: string) => Promise<void>;
  requestRemoveWishlist: (productId: string) => void;
  loading: boolean;
  fetchWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const fetchWishlist = async () => {
    try {
      const products = await getBuyerWishlist();
      setWishlistIds(new Set(products.map((p) => String(p.id))));
    } catch (error) {
      console.error('Failed to fetch wishlist', error);
    }
  };

  useEffect(() => {
    if (user?.role === 'buyer') {
      fetchWishlist();
    } else {
      setWishlistIds(new Set());
    }
  }, [user]);

  const toggleWishlist = async (productId: string) => {
    if (user?.role !== 'buyer') {
      toast.error(t('wishlist.login_required', 'Silakan masuk sebagai Pembeli untuk menyimpan produk.'));
      return;
    }

    const strId = String(productId);
    const isWishlisted = wishlistIds.has(strId);
    setLoading(true);

    try {
      if (isWishlisted) {
        await removeFromWishlist(Number(productId));
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(strId);
          return next;
        });
        toast.success(t('wishlist.removed', 'Dihapus dari wishlist'));
      } else {
        await addToWishlist(Number(productId));
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.add(strId);
          return next;
        });
        toast.success(t('wishlist.added', 'Ditambahkan ke wishlist'));
      }
    } catch (error) {
      toast.error(t('wishlist.error', 'Gagal memperbarui wishlist'));
    } finally {
      setLoading(false);
    }
  };

  const requestRemoveWishlist = (productId: string) => {
    if (user?.role !== 'buyer') {
      toast.error(t('wishlist.login_required', 'Silakan masuk sebagai Pembeli untuk menyimpan produk.'));
      return;
    }
    setPendingRemoveId(productId);
  };

  const executeConfirmedRemove = async () => {
    if (!pendingRemoveId) return;
    const targetId = pendingRemoveId;
    setPendingRemoveId(null);
    const strId = String(targetId);

    setLoading(true);
    try {
      await removeFromWishlist(Number(targetId));
      setWishlistIds((prev) => {
        const next = new Set(prev);
        next.delete(strId);
        return next;
      });
      toast.success(t('wishlist.removed', 'Dihapus dari wishlist'));
    } catch (error) {
      toast.error(t('wishlist.error', 'Gagal memperbarui wishlist'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        toggleWishlist,
        requestRemoveWishlist,
        loading,
        fetchWishlist,
      }}
    >
      {children}
      <ConfirmationModal
        isOpen={pendingRemoveId !== null}
        title={t('wishlist.remove_confirm_title', 'Hapus dari wishlist?')}
        message={t('wishlist.remove_confirm_desc', 'Apakah Anda yakin ingin menghapus produk ini dari wishlist?')}
        confirmText={t('common.yes', 'Ya')}
        cancelText={t('common.no', 'Tidak')}
        onConfirm={executeConfirmedRemove}
        onCancel={() => setPendingRemoveId(null)}
        isDestructive={true}
      />
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
