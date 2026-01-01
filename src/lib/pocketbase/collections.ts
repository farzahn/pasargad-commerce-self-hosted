/**
 * PocketBase Collection Helpers
 *
 * Type-safe functions for interacting with PocketBase collections.
 * Collections: products, categories, orders, discounts, messages, addresses, wishlists, reviews, settings
 */

import { getPocketBaseClient, escapeFilterValue } from './client';
import { getFileUrl } from './files';
import { generateOrderNumber } from '@/lib/utils';
import type {
  Product,
  Category,
  Order,
  OrderItem,
  ShippingAddress,
  Discount,
  Message,
  Address,
  Wishlist,
  Review,
  Setting,
  ListResult,
} from '@/types/pocketbase';

// ============================================
// Products
// ============================================

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
      // Only expand if categoryId is a valid relation
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

// ============================================
// Categories
// ============================================

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

// ============================================
// Orders
// ============================================

export async function getUserOrders(
  userId: string,
  options?: { page?: number; perPage?: number }
): Promise<ListResult<Order>> {
  const pb = getPocketBaseClient();
  return pb.collection('orders').getList(
    options?.page || 1,
    options?.perPage || 10,
    {
      filter: `userId = "${escapeFilterValue(userId)}"`,
      sort: '-@rowid',
    }
  );
}

export async function getOrderById(id: string): Promise<Order | null> {
  const pb = getPocketBaseClient();
  try {
    return await pb.collection('orders').getOne(id);
  } catch {
    return null;
  }
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const pb = getPocketBaseClient();
  try {
    return await pb.collection('orders').getFirstListItem(
      `orderNumber = "${escapeFilterValue(orderNumber)}"`
    );
  } catch {
    return null;
  }
}

export async function createOrder(data: {
  userId: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingCost: number;
  discountCode?: string;
  discountAmount: number;
  total: number;
}): Promise<Order> {
  const pb = getPocketBaseClient();
  const orderNumber = generateOrderNumber();

  return pb.collection('orders').create({
    orderNumber,
    userId: data.userId,
    customerEmail: data.customerEmail,
    customerName: data.customerName,
    items: data.items,
    shippingAddress: data.shippingAddress,
    subtotal: data.subtotal,
    shippingCost: data.shippingCost || 1, // PocketBase requires non-zero; use 1 cent for free shipping
    discountCode: data.discountCode || '',
    discountAmount: data.discountAmount,
    total: data.total,
    status: 'pending_review',
    statusHistory: [
      {
        status: 'pending_review',
        timestamp: new Date().toISOString(),
        note: 'Order placed',
      },
    ],
  });
}

export async function cancelOrder(
  orderId: string,
  reason: string
): Promise<Order> {
  const pb = getPocketBaseClient();
  const order = await pb.collection('orders').getOne(orderId);

  // Only allow cancellation before shipped
  if (['shipped', 'delivered'].includes(order.status)) {
    throw new Error('Order cannot be cancelled at this stage');
  }

  const statusHistory = [
    ...order.statusHistory,
    {
      status: 'cancelled' as const,
      timestamp: new Date().toISOString(),
      note: reason,
    },
  ];

  return pb.collection('orders').update(orderId, {
    status: 'cancelled',
    statusHistory,
  });
}

// ============================================
// Discounts
// ============================================

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

// ============================================
// Messages (Contact)
// ============================================

export async function createMessage(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<Message> {
  const pb = getPocketBaseClient();
  return pb.collection('messages').create({
    ...data,
    phone: data.phone || '',
    isRead: false,
    isArchived: false,
  });
}

export async function getMessages(options?: {
  page?: number;
  perPage?: number;
  filter?: string;
}): Promise<ListResult<Message>> {
  const pb = getPocketBaseClient();
  return pb.collection('messages').getList(
    options?.page || 1,
    options?.perPage || 20,
    {
      filter: options?.filter || 'isArchived = false',
      sort: '-@rowid',
    }
  );
}

export async function markMessageAsRead(id: string): Promise<Message> {
  const pb = getPocketBaseClient();
  return pb.collection('messages').update(id, { isRead: true });
}

export async function archiveMessage(id: string): Promise<Message> {
  const pb = getPocketBaseClient();
  return pb.collection('messages').update(id, { isArchived: true });
}

// ============================================
// Addresses
// ============================================

export async function getUserAddresses(userId: string): Promise<Address[]> {
  const pb = getPocketBaseClient();
  const result = await pb.collection('addresses').getFullList({
    filter: `userId = "${escapeFilterValue(userId)}"`,
    sort: '-isDefault,-@rowid',
  });
  return result;
}

export async function getAddressById(id: string): Promise<Address | null> {
  const pb = getPocketBaseClient();
  try {
    return await pb.collection('addresses').getOne(id);
  } catch {
    return null;
  }
}

export async function createAddress(
  userId: string,
  data: Omit<Address, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName' | 'userId'>
): Promise<Address> {
  const pb = getPocketBaseClient();
  return pb.collection('addresses').create({
    ...data,
    userId,
  });
}

export async function updateAddress(
  id: string,
  data: Partial<Address>
): Promise<Address> {
  const pb = getPocketBaseClient();
  return pb.collection('addresses').update(id, data);
}

export async function deleteAddress(id: string): Promise<void> {
  const pb = getPocketBaseClient();
  await pb.collection('addresses').delete(id);
}

export async function setDefaultAddress(
  userId: string,
  addressId: string
): Promise<void> {
  const pb = getPocketBaseClient();

  // Remove default from all other addresses
  const addresses = await getUserAddresses(userId);
  for (const addr of addresses) {
    if (addr.isDefault && addr.id !== addressId) {
      await pb.collection('addresses').update(addr.id, { isDefault: false });
    }
  }

  // Set the new default
  await pb.collection('addresses').update(addressId, { isDefault: true });
}

// ============================================
// Wishlists
// ============================================

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

// ============================================
// Reviews
// ============================================

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

// ============================================
// Settings
// ============================================

export async function getSetting(key: string): Promise<string | null> {
  const pb = getPocketBaseClient();
  try {
    const setting = await pb.collection('settings').getFirstListItem(
      `key = "${escapeFilterValue(key)}"`
    );
    return setting.value;
  } catch {
    return null;
  }
}

export async function getSettings(keys?: string[]): Promise<Record<string, string>> {
  const pb = getPocketBaseClient();
  const filter = keys ? keys.map(k => `key = "${escapeFilterValue(k)}"`).join(' || ') : '';
  const result = await pb.collection('settings').getFullList({
    filter: filter || undefined,
  });

  return result.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);
}

export async function setSetting(
  key: string,
  value: string,
  description?: string
): Promise<Setting> {
  const pb = getPocketBaseClient();

  try {
    // Try to update existing setting
    const existing = await pb.collection('settings').getFirstListItem(
      `key = "${escapeFilterValue(key)}"`
    );
    return pb.collection('settings').update(existing.id, {
      value,
      ...(description && { description }),
    });
  } catch {
    // Create new setting
    return pb.collection('settings').create({
      key,
      value,
      description: description || '',
    });
  }
}
