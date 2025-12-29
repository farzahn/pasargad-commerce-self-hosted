'use client';

import { create } from 'zustand';
import { useCallback, useEffect } from 'react';
import {
  getWishlistProducts,
  addToWishlist as pbAddToWishlist,
  removeFromWishlist as pbRemoveFromWishlist,
  getCurrentUser,
  type Product,
} from '@/lib/pocketbase';

/**
 * Wishlist store state
 * Manages wishlist IDs in memory and syncs with PocketBase
 */
interface WishlistState {
  productIds: Set<string>;
  products: Product[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Internal actions
  setProductIds: (ids: Set<string>) => void;
  setProducts: (products: Product[]) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
  addProductId: (id: string) => void;
  removeProductId: (id: string) => void;
  reset: () => void;
}

const useWishlistStore = create<WishlistState>((set) => ({
  productIds: new Set<string>(),
  products: [],
  isLoading: false,
  isInitialized: false,
  error: null,

  setProductIds: (ids) => set({ productIds: ids }),
  setProducts: (products) => set({ products }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  setError: (error) => set({ error }),

  addProductId: (id) =>
    set((state) => {
      const newSet = new Set<string>(state.productIds);
      newSet.add(id);
      return { productIds: newSet };
    }),

  removeProductId: (id) =>
    set((state) => {
      const newIds = new Set<string>(state.productIds);
      newIds.delete(id);
      return {
        productIds: newIds,
        products: state.products.filter((p) => p.id !== id),
      };
    }),

  reset: () =>
    set({
      productIds: new Set<string>(),
      products: [],
      isLoading: false,
      isInitialized: false,
      error: null,
    }),
}));

/**
 * Hook for managing wishlist with PocketBase sync
 *
 * Features:
 * - Syncs wishlist state with PocketBase wishlists collection
 * - Optimistic updates for better UX
 * - Handles authentication state changes
 * - Provides loading and error states
 */
export function useWishlist() {
  const store = useWishlistStore();

  // Initialize wishlist from PocketBase on mount
  useEffect(() => {
    const initWishlist = async () => {
      const user = getCurrentUser();

      if (!user) {
        store.reset();
        return;
      }

      if (store.isInitialized) {
        return;
      }

      store.setLoading(true);
      store.setError(null);

      try {
        const products = await getWishlistProducts(user.id);
        const ids = new Set<string>(products.map((p) => p.id));
        store.setProductIds(ids);
        store.setProducts(products);
        store.setInitialized(true);
      } catch (err) {
        store.setError(err instanceof Error ? err.message : 'Failed to load wishlist');
        console.error('Failed to load wishlist:', err);
      } finally {
        store.setLoading(false);
      }
    };

    initWishlist();
  }, []);

  /**
   * Check if a product is in the wishlist
   */
  const isInWishlist = useCallback(
    (productId: string): boolean => {
      return store.productIds.has(productId);
    },
    [store.productIds]
  );

  /**
   * Add a product to the wishlist
   * Uses optimistic update for immediate feedback
   */
  const addToWishlist = useCallback(
    async (productId: string): Promise<boolean> => {
      const user = getCurrentUser();

      if (!user) {
        store.setError('Please sign in to add items to your wishlist');
        return false;
      }

      if (store.productIds.has(productId)) {
        return true; // Already in wishlist
      }

      // Optimistic update
      store.addProductId(productId);
      store.setError(null);

      try {
        await pbAddToWishlist(user.id, productId);
        return true;
      } catch (err) {
        // Rollback on failure
        store.removeProductId(productId);
        store.setError(err instanceof Error ? err.message : 'Failed to add to wishlist');
        console.error('Failed to add to wishlist:', err);
        return false;
      }
    },
    [store]
  );

  /**
   * Remove a product from the wishlist
   * Uses optimistic update for immediate feedback
   */
  const removeFromWishlist = useCallback(
    async (productId: string): Promise<boolean> => {
      const user = getCurrentUser();

      if (!user) {
        store.setError('Please sign in to manage your wishlist');
        return false;
      }

      if (!store.productIds.has(productId)) {
        return true; // Not in wishlist anyway
      }

      // Store current state for rollback
      const previousIds = new Set<string>(store.productIds);

      // Optimistic update
      store.removeProductId(productId);
      store.setError(null);

      try {
        await pbRemoveFromWishlist(user.id, productId);
        return true;
      } catch (err) {
        // Rollback on failure
        store.setProductIds(previousIds);
        store.setError(err instanceof Error ? err.message : 'Failed to remove from wishlist');
        console.error('Failed to remove from wishlist:', err);
        return false;
      }
    },
    [store]
  );

  /**
   * Toggle a product's wishlist status
   */
  const toggleWishlist = useCallback(
    async (productId: string): Promise<boolean> => {
      if (store.productIds.has(productId)) {
        return removeFromWishlist(productId);
      }
      return addToWishlist(productId);
    },
    [store.productIds, addToWishlist, removeFromWishlist]
  );

  /**
   * Refresh wishlist from PocketBase
   * Useful after authentication changes
   */
  const refreshWishlist = useCallback(async (): Promise<void> => {
    const user = getCurrentUser();

    if (!user) {
      store.reset();
      return;
    }

    store.setLoading(true);
    store.setError(null);

    try {
      const products = await getWishlistProducts(user.id);
      const ids = new Set<string>(products.map((p) => p.id));
      store.setProductIds(ids);
      store.setProducts(products);
      store.setInitialized(true);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Failed to refresh wishlist');
      console.error('Failed to refresh wishlist:', err);
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  /**
   * Clear wishlist state (call on logout)
   */
  const clearWishlist = useCallback(() => {
    store.reset();
  }, [store]);

  return {
    // State
    wishlistIds: Array.from(store.productIds),
    wishlistProducts: store.products,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    error: store.error,
    itemCount: store.productIds.size,

    // Actions
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    refreshWishlist,
    clearWishlist,
  };
}

/**
 * Selector hooks for optimized re-renders
 */
export function useWishlistIds() {
  return useWishlistStore((state) => Array.from(state.productIds));
}

export function useWishlistLoading() {
  return useWishlistStore((state) => state.isLoading);
}

export function useWishlistItemCount() {
  return useWishlistStore((state) => state.productIds.size);
}

/**
 * Check if a specific product is in wishlist (optimized)
 */
export function useIsInWishlist(productId: string) {
  return useWishlistStore((state) => state.productIds.has(productId));
}
