/**
 * PocketBase Module Exports
 *
 * Central export point for all PocketBase-related functionality.
 * Collections: users, categories, products, orders, discounts, messages, addresses, wishlists, reviews, settings
 */

// ============================================
// Client
// ============================================

export {
  getPocketBaseClient,
  createPocketBaseClient,
  createAuthenticatedClient,
  getPocketBaseUrl,
  isAdmin,
  isStaff,
  isBlocked,
  getFileUrl as getFileUrlFromClient,
} from './client';

// ============================================
// Authentication (Google OAuth Only)
// ============================================

export {
  // OAuth2 (Google only - email/password auth is disabled)
  signInWithGoogle,
  getAuthMethods,
  // Session Management
  signOut,
  getCurrentUser,
  isAuthenticated,
  isCurrentUserAdmin,
  isCurrentUserStaff,
  isCurrentUserBlocked,
  refreshAuth,
  getAuthToken,
  onAuthStateChange,
  // Alias for compatibility
  onAuthStateChange as onAuthChange,
  // Server-side helpers
  loadAuthFromCookie,
  exportAuthToCookie,
  // Profile Management
  updateProfile,
} from './auth';

// ============================================
// Products
// ============================================

export {
  getProducts,
  getProductById,
  getProductBySlug,
  getFeaturedProducts,
  getProductsByCategory,
  searchProducts,
  getProductImageUrl,
  // Alias for compatibility
  getProductBySlug as getProduct,
} from './collections';

// ============================================
// Categories
// ============================================

export {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  getRootCategories,
  getSubcategories,
} from './collections';

// ============================================
// Orders
// ============================================

export {
  getUserOrders,
  getOrderById,
  getOrderByNumber,
  createOrder,
  cancelOrder,
  // Aliases for compatibility
  getUserOrders as getOrders,
  getOrderById as getOrder,
} from './collections';

// ============================================
// Discounts
// ============================================

export {
  validateDiscountCode,
  calculateDiscount,
  incrementDiscountUsage,
  // Alias for compatibility
  validateDiscountCode as validateDiscount,
} from './collections';

// ============================================
// Messages (Contact)
// ============================================

export {
  createMessage,
  getMessages,
  markMessageAsRead,
  archiveMessage,
  // Alias for compatibility
  createMessage as createContactMessage,
} from './collections';

// ============================================
// Addresses
// ============================================

export {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from './collections';

// ============================================
// Wishlists
// ============================================

export {
  getUserWishlist,
  getWishlistProducts,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
} from './collections';

// ============================================
// Reviews
// ============================================

export {
  getProductReviews,
  getUserReviews,
  createReview,
  updateReview,
  deleteReview,
  getProductAverageRating,
} from './collections';

// ============================================
// Settings
// ============================================

export {
  getSetting,
  getSettings,
  setSetting,
} from './collections';

// ============================================
// Files
// ============================================

export {
  getFileUrl,
  getProductImageUrl as getImageUrl,
  getAllProductImageUrls,
  getProductThumbnailUrl,
  getCategoryImageUrl,
  getUserAvatarUrl,
  getFileToken,
  buildFileUrl,
  uploadFile,
  uploadFiles,
  deleteFile,
} from './files';

// ============================================
// Re-export types
// ============================================

export type * from '@/types/pocketbase';
