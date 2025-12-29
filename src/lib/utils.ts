import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine class names with Tailwind CSS merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency using Intl.NumberFormat
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Format date using Intl.DateTimeFormat
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  try {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
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
 * Calculate shipping cost based on subtotal
 */
export function calculateShipping(subtotal: number): number {
  return subtotal >= 50 ? 0 : 5;
}

/**
 * Calculate total with shipping and discount
 */
export function calculateTotal(
  subtotal: number,
  shippingCost: number,
  discountAmount: number = 0
): number {
  return Math.max(0, subtotal + shippingCost - discountAmount);
}
