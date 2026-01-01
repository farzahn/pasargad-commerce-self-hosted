/**
 * PocketBase Wishlist Collection Helpers
 */

import { getPocketBaseClient, escapeFilterValue } from './client';
import type { Wishlist, Product } from '@/types/pocketbase';

export async function getUserWishlist(userId: string): Promise<Wishlist[]> {
  const pb = getPocketBaseClient();
  const result = await pb.collection('wishlists').getFullList({
    filter: `userId = "${escapeFilterValue(userId)}"`,
    expand: 'productId',
    sort: '-@rowid',
  });
  return result;
}

export async function getWishlistProducts(userId: string): Promise<Product[]> {
  const wishlists = await getUserWishlist(userId);
  return wishlists
    .map((item) => item.expand?.productId as Product)
    .filter(Boolean);
}

export async function addToWishlist(
  userId: string,
  productId: string
): Promise<Wishlist> {
  const pb = getPocketBaseClient();

  // Check if already in wishlist
  try {
    const existing = await pb.collection('wishlists').getFirstListItem(
      `userId = "${escapeFilterValue(userId)}" && productId = "${escapeFilterValue(productId)}"`
    );
    return existing;
  } catch {
    // Not in wishlist, add it
    return pb.collection('wishlists').create({
      userId,
      productId,
    });
  }
}

export async function removeFromWishlist(
  userId: string,
  productId: string
): Promise<void> {
  const pb = getPocketBaseClient();
  try {
    const item = await pb.collection('wishlists').getFirstListItem(
      `userId = "${escapeFilterValue(userId)}" && productId = "${escapeFilterValue(productId)}"`
    );
    await pb.collection('wishlists').delete(item.id);
  } catch {
    // Not in wishlist, do nothing
  }
}

export async function isInWishlist(
  userId: string,
  productId: string
): Promise<boolean> {
  const pb = getPocketBaseClient();
  try {
    await pb.collection('wishlists').getFirstListItem(
      `userId = "${escapeFilterValue(userId)}" && productId = "${escapeFilterValue(productId)}"`
    );
    return true;
  } catch {
    return false;
  }
}
