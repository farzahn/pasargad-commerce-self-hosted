/**
 * PocketBase File Helpers
 *
 * Utility functions for working with PocketBase file storage.
 * Provides convenient methods to generate file URLs for records.
 */

import { getPocketBaseClient } from './client';
import type { Product, Category, User, BaseRecord } from '@/types/pocketbase';

/**
 * Default placeholder image path for products without images
 */
const PLACEHOLDER_PRODUCT = '/placeholder-product.png';
const PLACEHOLDER_CATEGORY = '/placeholder-category.png';
const PLACEHOLDER_AVATAR = '/placeholder-avatar.png';

/**
 * Generate the full URL for a file stored in PocketBase
 *
 * @param record - The record containing the file
 * @param filename - The filename from the record's file field
 * @param options - Optional configuration for the URL
 * @returns The full URL to access the file
 *
 * @example
 * ```ts
 * const product = await getProductBySlug('my-product');
 * const imageUrl = getFileUrl(product, product.images[0]);
 * // => 'http://localhost:8090/api/files/products/abc123/image.jpg'
 *
 * // With thumbnail
 * const thumbUrl = getFileUrl(product, product.images[0], { thumb: '300x300' });
 * ```
 */
export function getFileUrl<T extends BaseRecord>(
  record: T,
  filename: string,
  options?: {
    /** Thumbnail size (e.g., '100x100', '300x250', '0x300' for height only) */
    thumb?: string;
    /** Force download instead of inline display */
    download?: boolean;
    /** Access token for protected files */
    token?: string;
  }
): string {
  if (!filename) {
    return '';
  }

  const pb = getPocketBaseClient();
  return pb.files.getUrl(record, filename, options);
}

/**
 * Generate the URL for a product image with fallback support
 *
 * @param product - The product record
 * @param index - The image index (default: 0 for first image)
 * @param options - Optional configuration for the URL
 * @returns The image URL or placeholder if no image exists
 *
 * @example
 * ```ts
 * const product = await getProductBySlug('my-product');
 *
 * // Get first image
 * const imageUrl = getProductImageUrl(product);
 *
 * // Get second image with thumbnail
 * const thumbUrl = getProductImageUrl(product, 1, { thumb: '300x300' });
 * ```
 */
export function getProductImageUrl(
  product: Product,
  index = 0,
  options?: {
    /** Thumbnail size (e.g., '100x100', '300x250') */
    thumb?: string;
    /** Force download instead of inline display */
    download?: boolean;
    /** Access token for protected files */
    token?: string;
  }
): string {
  // Check if product has images
  if (!product.images || product.images.length === 0) {
    return PLACEHOLDER_PRODUCT;
  }

  // Check if requested index is valid
  if (index < 0 || index >= product.images.length) {
    return PLACEHOLDER_PRODUCT;
  }

  const filename = product.images[index];
  if (!filename) {
    return PLACEHOLDER_PRODUCT;
  }

  return getFileUrl(product, filename, options);
}

/**
 * Generate all image URLs for a product
 *
 * @param product - The product record
 * @param options - Optional configuration for the URLs
 * @returns Array of image URLs
 *
 * @example
 * ```ts
 * const product = await getProductBySlug('my-product');
 * const allImages = getAllProductImageUrls(product, { thumb: '500x500' });
 * // => ['http://...', 'http://...', ...]
 * ```
 */
export function getAllProductImageUrls(
  product: Product,
  options?: {
    /** Thumbnail size (e.g., '100x100', '300x250') */
    thumb?: string;
    /** Force download instead of inline display */
    download?: boolean;
    /** Access token for protected files */
    token?: string;
  }
): string[] {
  if (!product.images || product.images.length === 0) {
    return [];
  }

  return product.images.map((filename) => getFileUrl(product, filename, options));
}

/**
 * Generate a thumbnail URL for a product's primary image
 * Convenience method for common thumbnail sizes
 *
 * @param product - The product record
 * @param size - Thumbnail size preset or custom dimensions
 * @returns The thumbnail URL or placeholder
 *
 * @example
 * ```ts
 * const product = await getProductBySlug('my-product');
 *
 * // Using preset sizes
 * const small = getProductThumbnailUrl(product, 'small');   // 100x100
 * const medium = getProductThumbnailUrl(product, 'medium'); // 300x300
 * const large = getProductThumbnailUrl(product, 'large');   // 500x500
 *
 * // Using custom dimensions
 * const custom = getProductThumbnailUrl(product, '200x150');
 * ```
 */
export function getProductThumbnailUrl(
  product: Product,
  size: 'small' | 'medium' | 'large' | string = 'medium'
): string {
  const sizeMap: Record<string, string> = {
    small: '100x100',
    medium: '300x300',
    large: '500x500',
  };

  const thumb = sizeMap[size] || size;
  return getProductImageUrl(product, 0, { thumb });
}

/**
 * Generate the URL for a category image with fallback support
 *
 * @param category - The category record
 * @param options - Optional configuration for the URL
 * @returns The image URL or placeholder if no image exists
 */
export function getCategoryImageUrl(
  category: Category,
  options?: {
    /** Thumbnail size (e.g., '100x100', '300x250') */
    thumb?: string;
    /** Force download instead of inline display */
    download?: boolean;
    /** Access token for protected files */
    token?: string;
  }
): string {
  if (!category.image) {
    return PLACEHOLDER_CATEGORY;
  }

  return getFileUrl(category, category.image, options);
}

/**
 * Generate the URL for a user avatar with fallback support
 *
 * @param user - The user record
 * @param options - Optional configuration for the URL
 * @returns The avatar URL or placeholder if no avatar exists
 */
export function getUserAvatarUrl(
  user: User,
  options?: {
    /** Thumbnail size (e.g., '100x100', '300x250') */
    thumb?: string;
    /** Force download instead of inline display */
    download?: boolean;
    /** Access token for protected files */
    token?: string;
  }
): string {
  if (!user.avatar) {
    return PLACEHOLDER_AVATAR;
  }

  return getFileUrl(user, user.avatar, options);
}

/**
 * Get a file access token for protected files
 * Required when accessing files that require authentication
 *
 * @returns Promise resolving to the file access token
 *
 * @example
 * ```ts
 * const token = await getFileToken();
 * const protectedUrl = getFileUrl(record, record.document, { token });
 * ```
 */
export async function getFileToken(): Promise<string> {
  const pb = getPocketBaseClient();

  if (!pb.authStore.isValid) {
    throw new Error('Authentication required to access protected files');
  }

  return pb.files.getToken();
}

/**
 * Build a manual file URL without using the SDK
 * Useful when you only have collection/record IDs without the full record
 *
 * @param collectionId - The collection ID or name
 * @param recordId - The record ID
 * @param filename - The filename
 * @param thumb - Optional thumbnail size
 * @returns The constructed file URL
 *
 * @example
 * ```ts
 * const url = buildFileUrl('products', 'abc123', 'image.jpg', '300x300');
 * // => 'http://localhost:8090/api/files/products/abc123/image.jpg?thumb=300x300'
 * ```
 */
export function buildFileUrl(
  collectionId: string,
  recordId: string,
  filename: string,
  thumb?: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
  let url = `${baseUrl}/api/files/${collectionId}/${recordId}/${filename}`;

  if (thumb) {
    url += `?thumb=${thumb}`;
  }

  return url;
}

/**
 * Upload a file to a record
 *
 * @param collectionName - The collection name
 * @param recordId - The record ID to update
 * @param fieldName - The file field name
 * @param file - The file to upload
 * @returns The updated record
 *
 * @example
 * ```ts
 * const file = event.target.files[0];
 * await uploadFile('products', productId, 'images', file);
 * ```
 */
export async function uploadFile<T extends BaseRecord>(
  collectionName: string,
  recordId: string,
  fieldName: string,
  file: File
): Promise<T> {
  const pb = getPocketBaseClient();
  const formData = new FormData();
  formData.append(fieldName, file);

  return pb.collection(collectionName).update(recordId, formData) as Promise<T>;
}

/**
 * Upload multiple files to a record
 *
 * @param collectionName - The collection name
 * @param recordId - The record ID to update
 * @param fieldName - The file field name
 * @param files - The files to upload
 * @returns The updated record
 *
 * @example
 * ```ts
 * const files = Array.from(event.target.files);
 * await uploadFiles('products', productId, 'images', files);
 * ```
 */
export async function uploadFiles<T extends BaseRecord>(
  collectionName: string,
  recordId: string,
  fieldName: string,
  files: File[]
): Promise<T> {
  const pb = getPocketBaseClient();
  const formData = new FormData();

  for (const file of files) {
    formData.append(fieldName, file);
  }

  return pb.collection(collectionName).update(recordId, formData) as Promise<T>;
}

/**
 * Delete a file from a record
 *
 * @param collectionName - The collection name
 * @param recordId - The record ID to update
 * @param fieldName - The file field name
 * @param filename - The filename to delete (or null to delete all)
 * @returns The updated record
 *
 * @example
 * ```ts
 * // Delete specific file
 * await deleteFile('products', productId, 'images', 'old-image.jpg');
 *
 * // Delete all files in field
 * await deleteFile('products', productId, 'images', null);
 * ```
 */
export async function deleteFile<T extends BaseRecord>(
  collectionName: string,
  recordId: string,
  fieldName: string,
  filename: string | null
): Promise<T> {
  const pb = getPocketBaseClient();

  if (filename === null) {
    // Delete all files
    return pb.collection(collectionName).update(recordId, {
      [fieldName]: null,
    }) as Promise<T>;
  }

  // Delete specific file by setting field to empty for that file
  return pb.collection(collectionName).update(recordId, {
    [`${fieldName}-`]: filename,
  }) as Promise<T>;
}
