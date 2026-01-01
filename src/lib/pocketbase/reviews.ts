/**
 * PocketBase Review Collection Helpers
 */

import { getPocketBaseClient, escapeFilterValue } from './client';
import type { Review, ListResult } from '@/types/pocketbase';

export async function getProductReviews(
  productId: string,
  options?: {
    page?: number;
    perPage?: number;
    onlyApproved?: boolean;
  }
): Promise<ListResult<Review>> {
  const pb = getPocketBaseClient();
  const escapedProductId = escapeFilterValue(productId);
  const filter = options?.onlyApproved !== false
    ? `productId = "${escapedProductId}" && isApproved = true`
    : `productId = "${escapedProductId}"`;

  return pb.collection('reviews').getList(
    options?.page || 1,
    options?.perPage || 10,
    {
      filter,
      sort: '-@rowid',
      expand: 'userId',
    }
  );
}

export async function getUserReviews(
  userId: string,
  options?: { page?: number; perPage?: number }
): Promise<ListResult<Review>> {
  const pb = getPocketBaseClient();
  return pb.collection('reviews').getList(
    options?.page || 1,
    options?.perPage || 10,
    {
      filter: `userId = "${escapeFilterValue(userId)}"`,
      sort: '-@rowid',
      expand: 'productId',
    }
  );
}

export async function createReview(data: {
  userId: string;
  productId: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase?: boolean;
}): Promise<Review> {
  const pb = getPocketBaseClient();
  return pb.collection('reviews').create({
    ...data,
    isVerifiedPurchase: data.isVerifiedPurchase || false,
    isApproved: false, // Reviews require approval
  });
}

export async function updateReview(
  id: string,
  data: Partial<Pick<Review, 'rating' | 'title' | 'comment'>>
): Promise<Review> {
  const pb = getPocketBaseClient();
  return pb.collection('reviews').update(id, data);
}

export async function deleteReview(id: string): Promise<void> {
  const pb = getPocketBaseClient();
  await pb.collection('reviews').delete(id);
}

export async function getProductAverageRating(productId: string): Promise<{
  average: number;
  count: number;
}> {
  const pb = getPocketBaseClient();
  const result = await pb.collection('reviews').getFullList({
    filter: `productId = "${escapeFilterValue(productId)}" && isApproved = true`,
    fields: 'rating',
  });

  if (result.length === 0) {
    return { average: 0, count: 0 };
  }

  const sum = result.reduce((acc, review) => acc + review.rating, 0);
  return {
    average: sum / result.length,
    count: result.length,
  };
}
