/**
 * Site Configuration Constants
 *
 * These values can be customized via environment variables.
 * Defaults are provided for quick setup.
 */

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
