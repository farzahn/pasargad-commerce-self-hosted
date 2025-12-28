/**
 * PocketBase Collection Helpers
 *
 * Type-safe functions for interacting with PocketBase collections
 */

import { getPocketBaseClient, getFileUrl } from './client';
import type {
  Product,
  Category,
  User,
  Address,
  Order,
  Discount,
  ContactMessage,
  ListResult,
  OrderItem,
  ShippingAddress,
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
      filter: options?.filter || "status = 'active'",
      sort: options?.sort || '-created',
      expand: options?.expand || 'category',
    }
  );
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const pb = getPocketBaseClient();
  try {
    return await pb.collection('products').getFirstListItem(
      `slug = "${slug}"`,
      { expand: 'category' }
    );
  } catch {
    return null;
  }
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const pb = getPocketBaseClient();
  const result = await pb.collection('products').getList(1, limit, {
    filter: "status = 'active' && isFeatured = true",
    sort: '-created',
    expand: 'category',
  });
  return result.items;
}

export function getProductImageUrl(
  product: Product,
  index = 0,
  thumb?: string
): string {
  if (!product.images || product.images.length === 0) {
    return '/placeholder-product.png';
  }
  return getFileUrl(
    product.collectionId,
    product.id,
    product.images[index],
    thumb
  );
}

// ============================================
// Categories
// ============================================

export async function getCategories(): Promise<Category[]> {
  const pb = getPocketBaseClient();
  const result = await pb.collection('categories').getFullList({
    sort: 'order',
    expand: 'parent',
  });
  return result;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const pb = getPocketBaseClient();
  try {
    return await pb.collection('categories').getFirstListItem(
      `slug = "${slug}"`
    );
  } catch {
    return null;
  }
}

// ============================================
// Addresses
// ============================================

export async function getUserAddresses(userId: string): Promise<Address[]> {
  const pb = getPocketBaseClient();
  const result = await pb.collection('addresses').getFullList({
    filter: `user = "${userId}"`,
    sort: '-isDefault,-created',
  });
  return result;
}

export async function createAddress(
  userId: string,
  data: Omit<Address, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName' | 'user'>
): Promise<Address> {
  const pb = getPocketBaseClient();
  return pb.collection('addresses').create({
    ...data,
    user: userId,
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
      filter: `user = "${userId}"`,
      sort: '-created',
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
      `orderNumber = "${orderNumber}"`
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

  // Generate order number: PP-YYYYMMDD-XXXX
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const orderNumber = `PP-${dateStr}-${random}`;

  return pb.collection('orders').create({
    orderNumber,
    user: data.userId,
    customerEmail: data.customerEmail,
    customerName: data.customerName,
    items: data.items,
    shippingAddress: data.shippingAddress,
    subtotal: data.subtotal,
    shippingCost: data.shippingCost,
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

  // Only allow cancellation before printing
  if (['printing', 'shipped', 'delivered'].includes(order.status)) {
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
    cancelledAt: new Date().toISOString(),
    cancellationReason: reason,
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
      `code = "${code.toUpperCase()}" && isActive = true`
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

// ============================================
// Contact Messages
// ============================================

export async function createContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactMessage> {
  const pb = getPocketBaseClient();
  return pb.collection('contact_messages').create({
    ...data,
    isRead: false,
    isArchived: false,
  });
}

// ============================================
// Wishlist
// ============================================

export async function getUserWishlist(userId: string): Promise<Product[]> {
  const pb = getPocketBaseClient();
  const result = await pb.collection('wishlist').getFullList({
    filter: `user = "${userId}"`,
    expand: 'product',
  });
  return result.map((item) => item.expand?.product as Product).filter(Boolean);
}

export async function addToWishlist(
  userId: string,
  productId: string
): Promise<void> {
  const pb = getPocketBaseClient();

  // Check if already in wishlist
  try {
    await pb.collection('wishlist').getFirstListItem(
      `user = "${userId}" && product = "${productId}"`
    );
    // Already exists, do nothing
    return;
  } catch {
    // Not in wishlist, add it
    await pb.collection('wishlist').create({
      user: userId,
      product: productId,
    });
  }
}

export async function removeFromWishlist(
  userId: string,
  productId: string
): Promise<void> {
  const pb = getPocketBaseClient();
  try {
    const item = await pb.collection('wishlist').getFirstListItem(
      `user = "${userId}" && product = "${productId}"`
    );
    await pb.collection('wishlist').delete(item.id);
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
    await pb.collection('wishlist').getFirstListItem(
      `user = "${userId}" && product = "${productId}"`
    );
    return true;
  } catch {
    return false;
  }
}
