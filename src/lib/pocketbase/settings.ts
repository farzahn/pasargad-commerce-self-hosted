/**
 * PocketBase Settings Collection Helpers
 */

import { getPocketBaseClient, escapeFilterValue } from './client';
import type { Setting } from '@/types/pocketbase';

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
