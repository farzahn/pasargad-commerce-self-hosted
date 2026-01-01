import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { calculateShipping as calculateShippingFromConfig, getStoreConfig } from "./config";
import type { CartItem } from "@/types/pocketbase";

/**
 * Combine class names with Tailwind CSS merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency using Intl.NumberFormat
 * Uses locale and currency from store configuration
 */
export function formatCurrency(amount: number): string {
  const config = getStoreConfig();
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currencyCode,
  }).format(amount);
}

/**
 * Format date using Intl.DateTimeFormat
 * Uses locale from store configuration
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  try {
    const config = getStoreConfig();
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return "N/A";
    return new Intl.DateTimeFormat(config.locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(parsed);
  } catch {
    return "N/A";
  }
}

/**
 * Generate a unique order number
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `ORD-${year}${month}${day}-${random}`;
}

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Calculate total with shipping and discount
 * All values should be in the same unit (cents or dollars)
 */
export function calculateTotal(
  subtotal: number,
  shippingCost: number,
  discountAmount: number = 0
): number {
  return Math.max(0, subtotal + shippingCost - discountAmount);
}

// ============================================
// Cart Calculation Utilities
// ============================================

/**
 * Calculate subtotal from cart items (in cents)
 */
export function calculateCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

/**
 * Calculate total item count in cart
 */
export function calculateCartItemCount(items: CartItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

/**
 * Calculate discount amount based on discount type
 * @param subtotalCents - Subtotal in cents
 * @param discountType - 'percentage' or 'fixed'
 * @param discountValue - Percentage (0-100) or fixed amount in cents
 * @returns Discount amount in cents
 */
export function calculateDiscountAmount(
  subtotalCents: number,
  discountType: "percentage" | "fixed",
  discountValue: number
): number {
  if (discountType === "percentage") {
    return Math.round(subtotalCents * (discountValue / 100));
  }
  // Fixed discount - can't be more than subtotal
  return Math.min(discountValue, subtotalCents);
}

/**
 * Calculate complete cart totals
 * All monetary values are in cents
 */
export function calculateCartTotals(
  items: CartItem[],
  discountAmount: number = 0
): {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount: number;
} {
  const subtotal = calculateCartSubtotal(items);
  // Use centralized shipping calculation (works in cents)
  const shipping = calculateShippingFromConfig(subtotal);

  // Ensure discount doesn't exceed subtotal + shipping
  const discount = Math.min(discountAmount, subtotal + shipping);
  const total = Math.max(0, subtotal + shipping - discount);
  const itemCount = calculateCartItemCount(items);

  return {
    subtotal,
    shipping,
    discount,
    total,
    itemCount,
  };
}
