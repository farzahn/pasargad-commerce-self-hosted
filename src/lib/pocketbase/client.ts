/**
 * PocketBase Client Configuration
 *
 * This module provides a singleton PocketBase client instance for use throughout
 * the application. It handles both server-side and client-side usage.
 */

import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '@/types/pocketbase';

// PocketBase URL from environment
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

/**
 * Creates a new PocketBase client instance
 * Use this for server-side requests where you need a fresh client
 */
export function createPocketBaseClient(): TypedPocketBase {
  return new PocketBase(POCKETBASE_URL) as TypedPocketBase;
}

/**
 * Singleton PocketBase client for client-side usage
 * This maintains auth state across the application
 */
let clientInstance: TypedPocketBase | null = null;

export function getPocketBaseClient(): TypedPocketBase {
  if (typeof window === 'undefined') {
    // Server-side: always create a new instance
    return createPocketBaseClient();
  }

  // Client-side: use singleton
  if (!clientInstance) {
    clientInstance = createPocketBaseClient();

    // Load auth state from localStorage
    clientInstance.authStore.loadFromCookie(document.cookie);

    // Save auth state to cookie on change
    clientInstance.authStore.onChange(() => {
      document.cookie = clientInstance!.authStore.exportToCookie({
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    });
  }

  return clientInstance;
}

/**
 * Create an authenticated PocketBase client from a token
 * Useful for server-side requests with user context
 */
export function createAuthenticatedClient(token: string): TypedPocketBase {
  const pb = createPocketBaseClient();
  pb.authStore.save(token, null);
  return pb;
}

/**
 * Check if the current user is the admin
 * Admin email is configured via ADMIN_EMAIL environment variable
 */
export function isAdmin(pb: TypedPocketBase): boolean {
  const adminEmail = process.env.ADMIN_EMAIL || '';
  return !!adminEmail && pb.authStore.isValid && pb.authStore.record?.email === adminEmail;
}

/**
 * Get the file URL for a PocketBase record
 */
export function getFileUrl(
  collectionId: string,
  recordId: string,
  filename: string,
  thumb?: string
): string {
  const baseUrl = `${POCKETBASE_URL}/api/files/${collectionId}/${recordId}/${filename}`;
  return thumb ? `${baseUrl}?thumb=${thumb}` : baseUrl;
}

// Default export for convenience
export default getPocketBaseClient;
