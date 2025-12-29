'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Cart item stored in localStorage
 * Contains product details and selected variants for deduplication
 */
export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  image: string;
  size: string;
  color: string;
  material: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * Generates a unique key for cart item deduplication
 * Items are considered the same if they have matching productId + size + color + material
 */
function getItemKey(item: Pick<CartItem, 'productId' | 'size' | 'color' | 'material'>): string {
  return `${item.productId}|${item.size || ''}|${item.color || ''}|${item.material || ''}`;
}

interface CartState {
  items: CartItem[];

  // Actions
  addItem: (item: Omit<CartItem, 'totalPrice'>) => void;
  removeItem: (productId: string, size: string, color: string, material: string) => void;
  updateQuantity: (
    productId: string,
    size: string,
    color: string,
    material: string,
    quantity: number
  ) => void;
  clearCart: () => void;

  // Computed values (as getters in Zustand need to be functions)
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        set((state) => {
          const itemKey = getItemKey(newItem);
          const existingIndex = state.items.findIndex(
            (item) => getItemKey(item) === itemKey
          );

          // Calculate total price for the item
          const totalPrice = newItem.unitPrice * newItem.quantity;

          if (existingIndex > -1) {
            // Item exists: update quantity and recalculate total
            const updatedItems = [...state.items];
            const existingItem = updatedItems[existingIndex];
            const newQuantity = existingItem.quantity + newItem.quantity;

            updatedItems[existingIndex] = {
              ...existingItem,
              quantity: newQuantity,
              totalPrice: existingItem.unitPrice * newQuantity,
            };

            return { items: updatedItems };
          }

          // New item: add to cart
          return {
            items: [
              ...state.items,
              {
                ...newItem,
                totalPrice,
              },
            ],
          };
        });
      },

      removeItem: (productId, size, color, material) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              getItemKey(item) !== getItemKey({ productId, size, color, material })
          ),
        }));
      },

      updateQuantity: (productId, size, color, material, quantity) => {
        // Remove item if quantity is 0 or less
        if (quantity <= 0) {
          get().removeItem(productId, size, color, material);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (getItemKey(item) === getItemKey({ productId, size, color, material })) {
              return {
                ...item,
                quantity,
                totalPrice: item.unitPrice * quantity,
              };
            }
            return item;
          }),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.totalPrice, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'ecommerce-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

/**
 * Hook for accessing cart state and actions
 * Provides computed subtotal and itemCount as reactive values
 */
export function useCart() {
  const store = useCartStore();

  // Compute values reactively
  const subtotal = store.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = store.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items: store.items,
    subtotal,
    itemCount,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
  };
}

/**
 * Selector hooks for optimized re-renders
 */
export function useCartItems() {
  return useCartStore((state) => state.items);
}

export function useCartSubtotal() {
  return useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.totalPrice, 0)
  );
}

export function useCartItemCount() {
  return useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );
}
