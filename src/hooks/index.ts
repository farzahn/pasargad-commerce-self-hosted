// Cart hooks (Zustand-based with localStorage persistence)
export {
  useCart,
  useCartStore,
  useCartItems,
  useCartSubtotal,
  useCartItemCount,
  useCartDiscount,
  type CartItem,
} from './use-cart';

// Wishlist hooks (Zustand-based with PocketBase sync)
export {
  useWishlist,
  useWishlistIds,
  useWishlistLoading,
  useWishlistItemCount,
  useIsInWishlist,
} from './use-wishlist';

// Toast hooks (shadcn/ui toast system)
export { useToast, toast } from './use-toast';
