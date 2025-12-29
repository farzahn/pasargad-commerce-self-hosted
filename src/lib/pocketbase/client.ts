/**
 * PocketBase Client Configuration
 *
 * This module provides a singleton PocketBase client instance for use throughout
 * the application. It handles both server-side and client-side usage with proper
 * auth store management.
 */

import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '@/types/pocketbase';

// PocketBase URLs
// Server-side: Use internal Docker network URL (POCKETBASE_INTERNAL_URL) or fallback to public URL
// Client-side: Always use public URL (accessible from browser)
const getServerUrl = () => process.env.POCKETBASE_INTERNAL_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const getClientUrl = () => process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

const POCKETBASE_URL = typeof window === 'undefined' ? getServerUrl() : getClientUrl();

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

    // Load auth state from cookie
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
 * Get the PocketBase URL
 */
export function getPocketBaseUrl(): string {
  return POCKETBASE_URL;
}

// Helper to get user record from authStore (handles SDK version differences)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAuthRecord(pb: TypedPocketBase): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (pb.authStore as any).record || pb.authStore.model;
}

/**
 * Check if the current user has admin role
 */
export function isAdmin(pb: TypedPocketBase): boolean {
  const record = getAuthRecord(pb);
  if (!pb.authStore.isValid || !record) {
    return false;
  }
  return record.role === 'admin';
}

/**
 * Check if the current user has staff role
 */
export function isStaff(pb: TypedPocketBase): boolean {
  const record = getAuthRecord(pb);
  if (!pb.authStore.isValid || !record) {
    return false;
  }
  return record.role === 'staff' || record.role === 'admin';
}

/**
 * Check if the current user is blocked
 */
export function isBlocked(pb: TypedPocketBase): boolean {
  const record = getAuthRecord(pb);
  if (!pb.authStore.isValid || !record) {
    return false;
  }
  return record.isBlocked === true;
}

/**
 * Build a file URL from raw parameters (without a record object)
 * Use this when you only have IDs, not the full record
 *
 * @deprecated Prefer using getFileUrl from './files' with a record object
 * @see getFileUrl in './files' for the recommended approach
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

/**
 * Alias for getFileUrl - builds file URL from raw parameters
 * @deprecated Prefer using buildFileUrl from './files' instead
 */
export const buildFileUrlFromParams = getFileUrl;

// Default export for convenience
export default getPocketBaseClient;
