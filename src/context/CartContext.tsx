// src/context/CartContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  price: number;
  quantity: number;
  image: string;
  minOrder: number;
  step: number;
  isAvailable?: boolean;
  isInStock?: boolean;
  stockQuantity?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'isAvailable'> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  updateMultipleAvailability: (availabilities: Record<string, { isAvailable?: boolean; isInStock?: boolean; stockQuantity?: number } | undefined>) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'toti_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // We do NOT want to trust stored isAvailable permanently, 
        // but we can load it. It will be refreshed by the Cart/Checkout page.
        return parsed;
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    // We can omit isAvailable when storing to avoid stale cache on reload,
    // or just store it and let the pages refresh it.
    // The prompt says: "Jangan menyimpan isAvailable sebagai cache permanen yang bisa stale tanpa refresh."
    // So we map it out before saving.
    const itemsToStore = items.map(({ isAvailable, isInStock, stockQuantity, ...rest }) => rest);
    const serialized = JSON.stringify(itemsToStore);
    
    // Avoid redundant writes to prevent infinite loops across tabs
    if (localStorage.getItem(CART_STORAGE_KEY) !== serialized) {
      localStorage.setItem(CART_STORAGE_KEY, serialized);
    }
  }, [items]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) {
        if (!e.newValue) {
          setItems([]);
          return;
        }

        try {
          const parsed = JSON.parse(e.newValue);
          setItems((prev) => {
            return parsed.map((newItem: CartItem) => {
              const existing = prev.find(
                (i) => i.productId === newItem.productId && i.variantId === newItem.variantId
              );

              // Preserve volatile stock data if it already exists in the current tab's state
              if (existing) {
                return {
                  ...newItem,
                  isAvailable: existing.isAvailable,
                  isInStock: existing.isInStock,
                  stockQuantity: existing.stockQuantity,
                };
              }
              return newItem;
            });
          });
        } catch {
          setItems([]);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const addItem = (item: Omit<CartItem, 'quantity' | 'isAvailable'> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId && i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + (item.quantity || 1), isAvailable: true, isInStock: true }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1, isAvailable: true, isInStock: true }];
    });
  };

  const removeItem = (productId: string, variantId: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variantId === variantId))
    );
  };

  const updateQuantity = (productId: string, variantId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.variantId === variantId
          ? { ...i, quantity: Math.max(i.minOrder, quantity) }
          : i
      )
    );
  };

  const updateMultipleAvailability = (availabilities: Record<string, { isAvailable?: boolean; isInStock?: boolean; stockQuantity?: number } | undefined>) => {
    setItems((prev) =>
      prev.map((i) => {
        const update = availabilities[i.productId];
        return update !== undefined
          ? { ...i, ...update }
          : i;
      })
    );
  };

  const clearCart = () => setItems([]);

  // Only calculate total for available items
  const totalItems = items.filter(i => i.isAvailable !== false && i.isInStock !== false && i.quantity <= (i.stockQuantity ?? Infinity)).reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.filter(i => i.isAvailable !== false && i.isInStock !== false && i.quantity <= (i.stockQuantity ?? Infinity)).reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        updateMultipleAvailability,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
