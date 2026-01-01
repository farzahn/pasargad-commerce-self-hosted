'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { calculateCartSubtotal, calculateCartItemCount } from '@/lib/utils';
import type { CartItem } from '@/types/pocketbase';

// Re-export CartItem for convenience
export type { CartItem } from '@/types/pocketbase';

/**
 * Generates a unique key for cart item deduplication
 * Items are considered the same if they have matching productId + variant
 */
function getItemKey(item: Pick<CartItem, 'productId' | 'variant'>): string {
  return `${item.productId}|${item.variant || ''}`;
}

interface CartState {
  items: CartItem[];
  discountCode?: string;
  discountAmount: number;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, variant: string | undefined, quantity: number) => void;
  clearCart: () => void;
  applyDiscount: (code: string, amount: number) => void;
  removeDiscount: () => void;

  // Computed value getters
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      discountCode: undefined,
      discountAmount: 0,

      addItem: (newItem) => {
        set((state) => {
          const itemKey = getItemKey(newItem);
          const existingIndex = state.items.findIndex(
            (item) => getItemKey(item) === itemKey
          );

          if (existingIndex > -1) {
            // Item exists: update quantity
            const updatedItems = [...state.items];
            const existingItem = updatedItems[existingIndex];
            const newQuantity = existingItem.quantity + (newItem.quantity || 1);

            updatedItems[existingIndex] = {
              ...existingItem,
              quantity: newQuantity,
            };

            return { items: updatedItems };
          }

          // New item: add to cart
          return {
            items: [
              ...state.items,
              {
                ...newItem,
                quantity: newItem.quantity || 1,
              },
            ],
          };
        });
      },

      removeItem: (productId, variant) => {
        set((state) => ({
          items: state.items.filter(
            (item) => getItemKey(item) !== getItemKey({ productId, variant })
          ),
        }));
      },

      updateQuantity: (productId, variant, quantity) => {
        // Remove item if quantity is 0 or less
        if (quantity <= 0) {
          get().removeItem(productId, variant);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (getItemKey(item) === getItemKey({ productId, variant })) {
              return {
                ...item,
                quantity,
              };
            }
            return item;
          }),
        }));
      },

      clearCart: () => {
        set({ items: [], discountCode: undefined, discountAmount: 0 });
      },

      applyDiscount: (code, amount) => {
        set({ discountCode: code, discountAmount: amount });
      },

      removeDiscount: () => {
        set({ discountCode: undefined, discountAmount: 0 });
      },

      getSubtotal: () => {
        return calculateCartSubtotal(get().items);
      },

      getItemCount: () => {
        return calculateCartItemCount(get().items);
      },
    }),
    {
      name: 'ecommerce-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        discountCode: state.discountCode,
        discountAmount: state.discountAmount,
      }),
    }
  )
);

/**
 * Hook for accessing cart state and actions
 * Provides computed subtotal and itemCount as reactive values
 */
export function useCart() {
  const store = useCartStore();

  // Compute values reactively using centralized calculation functions
  const subtotal = calculateCartSubtotal(store.items);
  const itemCount = calculateCartItemCount(store.items);

  return {
    items: store.items,
    discountCode: store.discountCode,
    discountAmount: store.discountAmount,
    subtotal,
    itemCount,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    applyDiscount: store.applyDiscount,
    removeDiscount: store.removeDiscount,
  };
}

/**
 * Selector hooks for optimized re-renders
 */
export function useCartItems() {
  return useCartStore((state) => state.items);
}

export function useCartSubtotal() {
  return useCartStore((state) => calculateCartSubtotal(state.items));
}

export function useCartItemCount() {
  return useCartStore((state) => calculateCartItemCount(state.items));
}

export function useCartDiscount() {
  return useCartStore((state) => ({
    code: state.discountCode,
    amount: state.discountAmount,
  }));
}
