/**
 * Store Configuration
 *
 * Centralized configuration loaded from environment variables.
 * Uses Zod validation for type safety.
 * Customize these values in your .env file.
 */

import type { StoreConfig } from '@/types/pocketbase';
import { getStoreConfigEnv, clearEnvCache } from './env';

// ============================================
// US States (for shipping address forms)
// ============================================

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const;

export type USState = typeof US_STATES[number];

// ============================================
// Order Configuration
// ============================================

export const ORDER_NUMBER_PREFIX = process.env.ORDER_PREFIX || 'ORD';

// ============================================
// Store Configuration (Memoized with Validation)
// ============================================

/** Cached store configuration - loaded once from environment variables */
let cachedConfig: StoreConfig | null = null;

/**
 * Get store configuration from environment variables
 * Configuration is validated with Zod and cached after first access.
 * All values have sensible defaults for quick setup.
 */
export function getStoreConfig(): StoreConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Get validated environment config
  const envConfig = getStoreConfigEnv();

  cachedConfig = {
    name: envConfig.STORE_NAME,
    orderPrefix: envConfig.ORDER_PREFIX,
    currencyCode: envConfig.CURRENCY_CODE,
    currencySymbol: envConfig.CURRENCY_SYMBOL,
    locale: envConfig.LOCALE,
    shippingFlatRate: envConfig.SHIPPING_FLAT_RATE,
    freeShippingThreshold: envConfig.FREE_SHIPPING_THRESHOLD,
    processingStatusName: envConfig.PROCESSING_STATUS_NAME,
    adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  };

  return cachedConfig;
}

/**
 * Clear the cached store configuration.
 * Useful for testing or when environment variables change.
 */
export function clearConfigCache(): void {
  cachedConfig = null;
  clearEnvCache();
}

/**
 * Format price with currency symbol
 */
export function formatPrice(cents: number, config?: StoreConfig): string {
  const { currencySymbol } = config || getStoreConfig();
  return `${currencySymbol}${(cents / 100).toFixed(2)}`;
}

/**
 * Calculate shipping cost based on order subtotal
 */
export function calculateShipping(subtotalCents: number, config?: StoreConfig): number {
  const { shippingFlatRate, freeShippingThreshold } = config || getStoreConfig();

  // Free shipping if threshold is set and subtotal meets it
  if (freeShippingThreshold > 0 && subtotalCents >= freeShippingThreshold) {
    return 0;
  }

  return shippingFlatRate;
}

/**
 * Get display name for order status
 * The 'processing' status is customizable via environment variable
 */
export function getStatusDisplayName(
  status: string,
  config?: StoreConfig
): string {
  const { processingStatusName } = config || getStoreConfig();

  const statusMap: Record<string, string> = {
    pending_review: 'Pending Review',
    invoice_sent: 'Invoice Sent',
    payment_received: 'Payment Received',
    processing: processingStatusName.charAt(0).toUpperCase() + processingStatusName.slice(1),
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  return statusMap[status] || status;
}

/**
 * Order status color mapping for UI
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending_review: '#EAB308', // Yellow
    invoice_sent: '#3B82F6', // Blue
    payment_received: '#06B6D4', // Cyan
    processing: '#8B5CF6', // Purple
    shipped: '#F97316', // Orange
    delivered: '#22C55E', // Green
    cancelled: '#EF4444', // Red
  };

  return colorMap[status] || '#6B7280'; // Gray default
}
