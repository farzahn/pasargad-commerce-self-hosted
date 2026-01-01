/**
 * PocketBase Order Collection Helpers
 */

import { getPocketBaseClient, escapeFilterValue } from './client';
import { generateOrderNumber } from '@/lib/utils';
import type {
  Order,
  OrderItem,
  ShippingAddress,
  ListResult,
} from '@/types/pocketbase';

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
