/**
 * PocketBase Address Collection Helpers
 */

import { getPocketBaseClient, escapeFilterValue } from './client';
import type { Address } from '@/types/pocketbase';

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
