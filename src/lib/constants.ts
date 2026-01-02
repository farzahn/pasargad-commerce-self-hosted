/**
 * Site Configuration Constants
 *
 * Centralized constants for the application.
 * These values can be customized via environment variables.
 * Defaults are provided for quick setup.
 */

// ============================================
// Application Limits
// ============================================

export const LIMITS = {
  /** Maximum file size for image uploads (5MB) */
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024,
  /** Maximum number of images per product */
  MAX_IMAGES_PER_PRODUCT: 5,
  /** Default page size for admin list views */
  ADMIN_DEFAULT_PAGE_SIZE: 25,
  /** Maximum page size for admin list views */
  ADMIN_MAX_PAGE_SIZE: 100,
  /** Default page size for storefront list views */
  STOREFRONT_PAGE_SIZE: 20,
  /** Maximum products to show in featured section */
  MAX_FEATURED_PRODUCTS: 8,
  /** Maximum saved addresses per user */
  MAX_ADDRESSES_PER_USER: 10,
} as const;

// ============================================
// File Upload Configuration
// ============================================

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

// ============================================
// Site Configuration
// ============================================

export const SITE_CONFIG = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || 'My Store',
  description: process.env.NEXT_PUBLIC_STORE_DESCRIPTION || 'Your online store for great products.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
} as const;

export const NAV_LINKS = [
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

export const FOOTER_LINKS = {
  shop: [
    { href: '/products', label: 'All Products' },
  ],
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
    { href: '/shipping-returns', label: 'Shipping & Returns' },
  ],
  account: [
    { href: '/account', label: 'My Account' },
    { href: '/account/orders', label: 'Order History' },
    { href: '/account/wishlist', label: 'Wishlist' },
    { href: '/cart', label: 'Cart' },
  ],
} as const;

/**
 * Order status configuration with labels and colors
 */
export const ORDER_STATUSES = {
  pending_review: {
    label: 'Pending Review',
    color: '#f59e0b',
    description: 'Order placed, awaiting admin review',
  },
  invoice_sent: {
    label: 'Invoice Sent',
    color: '#3b82f6',
    description: 'Invoice sent to customer',
  },
  payment_received: {
    label: 'Payment Received',
    color: '#10b981',
    description: 'Payment confirmed',
  },
  processing: {
    label: process.env.NEXT_PUBLIC_PROCESSING_STATUS_NAME || 'Processing',
    color: '#8b5cf6',
    description: 'Order is being processed',
  },
  shipped: {
    label: 'Shipped',
    color: '#06b6d4',
    description: 'Order has been shipped',
  },
  delivered: {
    label: 'Delivered',
    color: '#22c55e',
    description: 'Order delivered to customer',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#ef4444',
    description: 'Order was cancelled',
  },
} as const;

export type OrderStatusKey = keyof typeof ORDER_STATUSES;

/**
 * Get order status configuration by key
 */
export function getOrderStatusConfig(status: string): {
  label: string;
  color: string;
  description: string;
} {
  const config = ORDER_STATUSES[status as OrderStatusKey];
  if (config) {
    return config;
  }
  // Fallback for unknown statuses
  return {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    color: '#6B7280',
    description: 'Unknown status',
  };
}

// ============================================
// Validation Patterns
// ============================================

export const VALIDATION_PATTERNS = {
  /** US ZIP code pattern (5 digits or 5+4 format) */
  US_ZIP_CODE: /^\d{5}(-\d{4})?$/,
  /** Basic email pattern */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** Phone number (flexible format) */
  PHONE: /^[\d\s\-+()]{7,20}$/,
} as const;
