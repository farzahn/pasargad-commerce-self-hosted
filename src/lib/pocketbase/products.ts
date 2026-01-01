/**
 * PocketBase Product Collection Helpers
 */

import { getPocketBaseClient, escapeFilterValue } from './client';
import { getFileUrl } from './files';
import type { Product, ListResult } from '@/types/pocketbase';

export async function getProducts(options?: {
  page?: number;
  perPage?: number;
  filter?: string;
  sort?: string;
  expand?: string;
}): Promise<ListResult<Product>> {
  const pb = getPocketBaseClient();
  return pb.collection('products').getList(
    options?.page || 1,
    options?.perPage || 20,
    {
      filter: options?.filter || "status='active'",
      sort: options?.sort || '-@rowid',
      ...(options?.expand ? { expand: options.expand } : {}),
    }
  );
}

export async function getProductById(id: string): Promise<Product | null> {
  const pb = getPocketBaseClient();
  try {
    return await pb.collection('products').getOne(id, {
      expand: 'categoryId',
    });
  } catch {
    return null;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const pb = getPocketBaseClient();
  try {
    return await pb.collection('products').getFirstListItem(
      `slug = "${escapeFilterValue(slug)}"`,
      { expand: 'categoryId' }
    );
  } catch {
    return null;
  }
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const pb = getPocketBaseClient();
  const result = await pb.collection('products').getList(1, limit, {
    filter: "status='active' && isFeatured=true",
    sort: '-@rowid',
    expand: 'categoryId',
  });
  return result.items;
}

export async function getProductsByCategory(
  categoryId: string,
  options?: {
    page?: number;
    perPage?: number;
    sort?: string;
  }
): Promise<ListResult<Product>> {
  const pb = getPocketBaseClient();
  return pb.collection('products').getList(
    options?.page || 1,
    options?.perPage || 20,
    {
      filter: `status='active' && categoryId="${escapeFilterValue(categoryId)}"`,
      sort: options?.sort || '-@rowid',
      expand: 'categoryId',
    }
  );
}

export async function searchProducts(
  query: string,
  options?: {
    page?: number;
    perPage?: number;
  }
): Promise<ListResult<Product>> {
  const pb = getPocketBaseClient();
  const escapedQuery = escapeFilterValue(query);
  return pb.collection('products').getList(
    options?.page || 1,
    options?.perPage || 20,
    {
      filter: `status='active' && (name ~ "${escapedQuery}" || description ~ "${escapedQuery}" || sku ~ "${escapedQuery}")`,
      sort: '-@rowid',
      expand: 'categoryId',
    }
  );
}

/**
 * Get the URL for a product image
 */
export function getProductImageUrl(
  product: Product,
  index = 0,
  thumb?: string
): string {
  if (!product.images || product.images.length === 0) {
    return '/placeholder-product.png';
  }

  const filename = product.images[index];
  if (!filename) {
    return '/placeholder-product.png';
  }

  return getFileUrl(product, filename, thumb ? { thumb } : undefined);
}
