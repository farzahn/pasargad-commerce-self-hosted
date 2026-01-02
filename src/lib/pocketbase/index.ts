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
  getAuthRecord,
  isAdmin,
  isStaff,
  isBlocked,
  getFileUrl as getFileUrlFromClient,
  escapeFilterValue,
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
} from './products';

// ============================================
// Categories
// ============================================

export {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  getRootCategories,
  getSubcategories,
} from './categories';

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
} from './orders';

// ============================================
// Discounts
// ============================================

export {
  validateDiscountCode,
  calculateDiscount,
  incrementDiscountUsage,
  // Alias for compatibility
  validateDiscountCode as validateDiscount,
} from './discounts';

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
} from './messages';

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
} from './addresses';

// ============================================
// Wishlists
// ============================================

export {
  getUserWishlist,
  getWishlistProducts,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
} from './wishlists';

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
} from './reviews';

// ============================================
// Settings
// ============================================

export {
  getSetting,
  getSettings,
  setSetting,
} from './settings';

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
// Query Builder
// ============================================

export {
  QueryBuilder,
  createQuery,
  buildFilter,
  buildSearchFilter,
  buildInFilter,
  Filters,
} from './query-builder';

// ============================================
// Error Handling
// ============================================

export {
  PocketBaseError,
  ErrorCode,
  parsePocketBaseError,
  withPocketBaseError,
  getOrNull,
  getOrThrow,
  isErrorCode,
  getUserFriendlyMessage,
  ok,
  err,
  type Result,
  type ErrorCodeType,
} from './errors';

// ============================================
// Re-export types
// ============================================

export type * from '@/types/pocketbase';
