/**
 * PocketBase Authentication Helpers
 *
 * Functions for handling Google OAuth and user authentication
 */

import { getPocketBaseClient } from './client';
import type { User, TypedPocketBase } from '@/types/pocketbase';

/**
 * Sign in with Google OAuth
 * Opens a popup window for Google authentication
 */
export async function signInWithGoogle(): Promise<{
  token: string;
  user: User;
}> {
  const pb = getPocketBaseClient();

  const authData = await pb.collection('users').authWithOAuth2({
    provider: 'google',
    scopes: ['email', 'profile'],
    createData: {
      emailVisibility: false,
    },
  });

  return {
    token: authData.token,
    user: authData.record as User,
  };
}

/**
 * Sign out the current user
 */
export function signOut(): void {
  const pb = getPocketBaseClient();
  pb.authStore.clear();
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): User | null {
  const pb = getPocketBaseClient();

  if (!pb.authStore.isValid) {
    return null;
  }

  return pb.authStore.record as User;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const pb = getPocketBaseClient();
  return pb.authStore.isValid;
}

/**
 * Check if the current user is the admin
 * Admin email is configured via ADMIN_EMAIL environment variable
 */
export function isCurrentUserAdmin(): boolean {
  const user = getCurrentUser();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '';
  return !!adminEmail && user?.email === adminEmail;
}

/**
 * Refresh the authentication token
 */
export async function refreshAuth(): Promise<User | null> {
  const pb = getPocketBaseClient();

  if (!pb.authStore.isValid) {
    return null;
  }

  try {
    const authData = await pb.collection('users').authRefresh();
    return authData.record as User;
  } catch {
    // Token refresh failed, clear auth state
    pb.authStore.clear();
    return null;
  }
}

/**
 * Get auth token for server-side requests
 */
export function getAuthToken(): string | null {
  const pb = getPocketBaseClient();
  return pb.authStore.token || null;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  const pb = getPocketBaseClient();

  const unsubscribe = pb.authStore.onChange(() => {
    callback(pb.authStore.isValid ? (pb.authStore.record as User) : null);
  });

  return unsubscribe;
}

/**
 * Load auth state from cookie (server-side)
 */
export function loadAuthFromCookie(
  pb: TypedPocketBase,
  cookie: string
): void {
  pb.authStore.loadFromCookie(cookie);
}

/**
 * Export auth state to cookie
 */
export function exportAuthToCookie(pb: TypedPocketBase): string {
  return pb.authStore.exportToCookie({
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}
