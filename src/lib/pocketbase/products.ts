/**
 * PocketBase Product Collection Helpers
 */

import { getPocketBaseClient } from './client';
import { getFileUrl } from './files';
import { createQuery, buildSearchFilter, Filters } from './query-builder';
import { getOrNull } from './errors';
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
  return getOrNull(
    () => pb.collection('products').getOne(id, { expand: 'categoryId' }),
    { operation: 'getProductById', productId: id }
  );
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const pb = getPocketBaseClient();
  const filter = createQuery().where('slug', '=', slug).build();
  return getOrNull(
    () => pb.collection('products').getFirstListItem(filter, { expand: 'categoryId' }),
    { operation: 'getProductBySlug', slug }
  );
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const pb = getPocketBaseClient();
  const filter = Filters.featuredProducts().build();
  const result = await pb.collection('products').getList(1, limit, {
    filter,
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
  const filter = Filters.activeProducts()
    .and('categoryId', '=', categoryId)
    .build();

  return pb.collection('products').getList(
    options?.page || 1,
    options?.perPage || 20,
    {
      filter,
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
  const searchFilter = buildSearchFilter(query, ['name', 'description', 'sku']);
  const filter = Filters.activeProducts()
    .andRaw(searchFilter)
    .build();

  return pb.collection('products').getList(
    options?.page || 1,
    options?.perPage || 20,
    {
      filter,
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
