// Legacy hooks (for backwards compatibility)
export { useCart as useLegacyCart } from './useCart';
export { useWishlist as useLegacyWishlist } from './useWishlist';

// Zustand-based hooks (recommended)
export {
  useCart,
  useCartStore,
  useCartItems,
  useCartSubtotal,
  useCartItemCount,
  type CartItem,
} from './use-cart';

export {
  useWishlist,
  useWishlistIds,
  useWishlistLoading,
  useWishlistItemCount,
  useIsInWishlist,
} from './use-wishlist';
