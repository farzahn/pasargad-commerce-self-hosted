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
  // Extract stable action functions from store (these don't change between renders)
  const setProductIds = useWishlistStore((state) => state.setProductIds);
  const setProducts = useWishlistStore((state) => state.setProducts);
  const setLoading = useWishlistStore((state) => state.setLoading);
  const setInitialized = useWishlistStore((state) => state.setInitialized);
  const setError = useWishlistStore((state) => state.setError);
  const addProductId = useWishlistStore((state) => state.addProductId);
  const removeProductId = useWishlistStore((state) => state.removeProductId);
  const reset = useWishlistStore((state) => state.reset);

  // Extract state values
  const productIds = useWishlistStore((state) => state.productIds);
  const products = useWishlistStore((state) => state.products);
  const isLoading = useWishlistStore((state) => state.isLoading);
  const isInitialized = useWishlistStore((state) => state.isInitialized);
  const error = useWishlistStore((state) => state.error);

  // Initialize wishlist from PocketBase on mount
  useEffect(() => {
    const initWishlist = async () => {
      const user = getCurrentUser();

      if (!user) {
        reset();
        return;
      }

      // Check current initialized state from store
      if (useWishlistStore.getState().isInitialized) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const wishlistProducts = await getWishlistProducts(user.id);
        const ids = new Set<string>(wishlistProducts.map((p) => p.id));
        setProductIds(ids);
        setProducts(wishlistProducts);
        setInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load wishlist');
        console.error('Failed to load wishlist:', err);
      } finally {
        setLoading(false);
      }
    };

    initWishlist();
  }, [reset, setLoading, setError, setProductIds, setProducts, setInitialized]);

  /**
   * Check if a product is in the wishlist
   */
  const isInWishlist = useCallback(
    (productId: string): boolean => {
      return productIds.has(productId);
    },
    [productIds]
  );

  /**
   * Add a product to the wishlist
   * Uses optimistic update for immediate feedback
   */
  const addToWishlist = useCallback(
    async (productId: string): Promise<boolean> => {
      const user = getCurrentUser();

      if (!user) {
        setError('Please sign in to add items to your wishlist');
        return false;
      }

      // Check current state directly from store to avoid stale closures
      if (useWishlistStore.getState().productIds.has(productId)) {
        return true; // Already in wishlist
      }

      // Optimistic update
      addProductId(productId);
      setError(null);

      try {
        await pbAddToWishlist(user.id, productId);
        return true;
      } catch (err) {
        // Rollback on failure
        removeProductId(productId);
        setError(err instanceof Error ? err.message : 'Failed to add to wishlist');
        console.error('Failed to add to wishlist:', err);
        return false;
      }
    },
    [setError, addProductId, removeProductId]
  );

  /**
   * Remove a product from the wishlist
   * Uses optimistic update for immediate feedback
   */
  const removeFromWishlist = useCallback(
    async (productId: string): Promise<boolean> => {
      const user = getCurrentUser();

      if (!user) {
        setError('Please sign in to manage your wishlist');
        return false;
      }

      // Check current state directly from store
      const currentIds = useWishlistStore.getState().productIds;
      if (!currentIds.has(productId)) {
        return true; // Not in wishlist anyway
      }

      // Store current state for rollback
      const previousIds = new Set<string>(currentIds);

      // Optimistic update
      removeProductId(productId);
      setError(null);

      try {
        await pbRemoveFromWishlist(user.id, productId);
        return true;
      } catch (err) {
        // Rollback on failure
        setProductIds(previousIds);
        setError(err instanceof Error ? err.message : 'Failed to remove from wishlist');
        console.error('Failed to remove from wishlist:', err);
        return false;
      }
    },
    [setError, removeProductId, setProductIds]
  );

  /**
   * Toggle a product's wishlist status
   * @param productId - The product ID to toggle
   * @param _productName - Optional product name (for API compatibility, not used)
   */
  const toggleWishlist = useCallback(
    async (productId: string, _productName?: string): Promise<boolean> => {
      // Check current state directly from store
      if (useWishlistStore.getState().productIds.has(productId)) {
        return removeFromWishlist(productId);
      }
      return addToWishlist(productId);
    },
    [addToWishlist, removeFromWishlist]
  );

  /**
   * Refresh wishlist from PocketBase
   * Useful after authentication changes
   */
  const refreshWishlist = useCallback(async (): Promise<void> => {
    const user = getCurrentUser();

    if (!user) {
      reset();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const wishlistProducts = await getWishlistProducts(user.id);
      const ids = new Set<string>(wishlistProducts.map((p) => p.id));
      setProductIds(ids);
      setProducts(wishlistProducts);
      setInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh wishlist');
      console.error('Failed to refresh wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [reset, setLoading, setError, setProductIds, setProducts, setInitialized]);

  /**
   * Clear wishlist state (call on logout)
   */
  const clearWishlist = useCallback(() => {
    reset();
  }, [reset]);

  return {
    // State
    wishlistIds: Array.from(productIds),
    wishlistProducts: products,
    isLoading,
    loading: isLoading, // Alias for API compatibility
    isInitialized,
    error,
    itemCount: productIds.size,

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
