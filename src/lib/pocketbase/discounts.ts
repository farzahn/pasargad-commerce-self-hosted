/**
 * PocketBase Discount Collection Helpers
 */

import { getPocketBaseClient, escapeFilterValue } from './client';
import type { Discount } from '@/types/pocketbase';

export async function validateDiscountCode(
  code: string,
  orderTotal: number
): Promise<Discount | null> {
  const pb = getPocketBaseClient();
  try {
    const discount = await pb.collection('discounts').getFirstListItem(
      `code = "${escapeFilterValue(code.toUpperCase())}" && isActive = true`
    );

    // Check if expired
    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      return null;
    }

    // Check usage limit
    if (discount.maxUses > 0 && discount.usedCount >= discount.maxUses) {
      return null;
    }

    // Check minimum order value
    if (discount.minOrderValue > 0 && orderTotal < discount.minOrderValue) {
      return null;
    }

    return discount;
  } catch {
    return null;
  }
}

export function calculateDiscount(
  discount: Discount,
  subtotal: number
): number {
  if (discount.type === 'percentage') {
    return subtotal * (discount.value / 100);
  }
  return Math.min(discount.value, subtotal);
}

export async function incrementDiscountUsage(discountId: string): Promise<void> {
  const pb = getPocketBaseClient();
  const discount = await pb.collection('discounts').getOne(discountId);
  await pb.collection('discounts').update(discountId, {
    usedCount: discount.usedCount + 1,
  });
}
