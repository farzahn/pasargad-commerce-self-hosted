'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getUserWishlist,
  addToWishlist as pbAddToWishlist,
  removeFromWishlist as pbRemoveFromWishlist,
  getCurrentUser,
} from '@/lib/pocketbase';

export function useWishlist() {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Load wishlist on mount
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;

    const loadWishlist = async () => {
      try {
        const products = await getUserWishlist(user.id);
        setWishlistIds(new Set(products.map((product) => product.id)));
      } catch {
        // Silently fail - user might not be authenticated
      }
    };

    loadWishlist();
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    async (productId: string, _productName?: string) => {
      const user = getCurrentUser();
      if (!user) {
        // Could trigger sign-in prompt here
        return;
      }

      setLoading(true);
      try {
        if (wishlistIds.has(productId)) {
          await pbRemoveFromWishlist(user.id, productId);
          setWishlistIds((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
        } else {
          await pbAddToWishlist(user.id, productId);
          setWishlistIds((prev) => new Set([...prev, productId]));
        }
      } catch (error) {
        console.error('Failed to update wishlist:', error);
      } finally {
        setLoading(false);
      }
    },
    [wishlistIds]
  );

  const addToWishlist = useCallback(async (productId: string) => {
    const user = getCurrentUser();
    if (!user) return;

    setLoading(true);
    try {
      await pbAddToWishlist(user.id, productId);
      setWishlistIds((prev) => new Set([...prev, productId]));
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromWishlist = useCallback(async (productId: string) => {
    const user = getCurrentUser();
    if (!user) return;

    setLoading(true);
    try {
      await pbRemoveFromWishlist(user.id, productId);
      setWishlistIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    wishlistIds: Array.from(wishlistIds),
    isInWishlist,
    toggleWishlist,
    addToWishlist,
    removeFromWishlist,
    loading,
  };
}
