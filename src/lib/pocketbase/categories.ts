/**
 * PocketBase Category Collection Helpers
 */

import { getPocketBaseClient, escapeFilterValue } from './client';
import type { Category } from '@/types/pocketbase';

export async function getCategories(): Promise<Category[]> {
  const pb = getPocketBaseClient();
  const result = await pb.collection('categories').getFullList({
    sort: 'order',
    expand: 'parentId',
  });
  return result;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const pb = getPocketBaseClient();
  try {
    return await pb.collection('categories').getOne(id, {
      expand: 'parentId',
    });
  } catch {
    return null;
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const pb = getPocketBaseClient();
  try {
    return await pb.collection('categories').getFirstListItem(
      `slug = "${escapeFilterValue(slug)}"`,
      { expand: 'parentId' }
    );
  } catch {
    return null;
  }
}

export async function getRootCategories(): Promise<Category[]> {
  const pb = getPocketBaseClient();
  const result = await pb.collection('categories').getFullList({
    filter: 'parentId = ""',
    sort: 'order',
  });
  return result;
}

export async function getSubcategories(parentId: string): Promise<Category[]> {
  const pb = getPocketBaseClient();
  const result = await pb.collection('categories').getFullList({
    filter: `parentId = "${escapeFilterValue(parentId)}"`,
    sort: 'order',
  });
  return result;
}
