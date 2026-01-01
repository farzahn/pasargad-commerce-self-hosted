/**
 * PocketBase Message (Contact) Collection Helpers
 */

import { getPocketBaseClient } from './client';
import type { Message, ListResult } from '@/types/pocketbase';

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
