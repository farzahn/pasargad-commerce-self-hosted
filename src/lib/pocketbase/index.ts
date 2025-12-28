/**
 * PocketBase Module Exports
 *
 * Central export point for all PocketBase-related functionality
 */

// Client
export {
  getPocketBaseClient,
  createPocketBaseClient,
  createAuthenticatedClient,
  isAdmin,
  getFileUrl,
} from './client';

// Authentication
export {
  signInWithGoogle,
  signOut,
  getCurrentUser,
  isAuthenticated,
  isCurrentUserAdmin,
  refreshAuth,
  getAuthToken,
  onAuthStateChange,
  loadAuthFromCookie,
  exportAuthToCookie,
} from './auth';

// Collections
export {
  // Products
  getProducts,
  getProductBySlug,
  getFeaturedProducts,
  getProductImageUrl,
  // Categories
  getCategories,
  getCategoryBySlug,
  // Addresses
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  // Orders
  getUserOrders,
  getOrderById,
  getOrderByNumber,
  createOrder,
  cancelOrder,
  // Discounts
  validateDiscountCode,
  calculateDiscount,
  // Contact
  createContactMessage,
  // Wishlist
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
} from './collections';

// Re-export types
export type * from '@/types/pocketbase';
