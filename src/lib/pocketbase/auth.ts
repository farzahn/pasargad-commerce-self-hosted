/**
 * PocketBase Authentication Helpers
 *
 * Google OAuth authentication and user management.
 * Email/password authentication is disabled - Google sign-in only.
 */

import { getPocketBaseClient, getAuthRecord } from './client';
import type { User, TypedPocketBase, OAuthResponse, OAuthMeta } from '@/types/pocketbase';

// ============================================
// OAuth2 Authentication (Google Only)
// ============================================

/**
 * Sign in with Google OAuth2
 * Opens a popup window for Google authentication
 */
export async function signInWithGoogle(): Promise<OAuthResponse> {
  const pb = getPocketBaseClient();

  const authData = await pb.collection('users').authWithOAuth2({
    provider: 'google',
    scopes: ['email', 'profile'],
    createData: {
      emailVisibility: false,
      role: 'customer',
      isBlocked: false,
    },
  });

  // Update last login timestamp
  try {
    await pb.collection('users').update(authData.record.id, {
      lastLoginAt: new Date().toISOString(),
    });
  } catch (error) {
    // Non-critical error, log and continue
    console.warn('Failed to update last login timestamp:', error);
  }

  return {
    token: authData.token,
    record: authData.record as User,
    meta: authData.meta as OAuthMeta | undefined,
  };
}

/**
 * Get available OAuth2 providers
 */
export async function getAuthMethods(): Promise<{
  usernamePassword: boolean;
  emailPassword: boolean;
  onlyVerified: boolean;
  authProviders: Array<{
    name: string;
    displayName: string;
    state: string;
    codeVerifier: string;
    codeChallenge: string;
    codeChallengeMethod: string;
    authUrl: string;
  }>;
}> {
  const pb = getPocketBaseClient();
  return pb.collection('users').listAuthMethods();
}

// ============================================
// Session Management
// ============================================

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

  return getAuthRecord(pb);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const pb = getPocketBaseClient();
  return pb.authStore.isValid;
}

/**
 * Check if the current user has admin role
 *
 * Note: For full admin validation including email-based admin access,
 * use the server-side /api/auth/check-admin endpoint instead.
 * This function only checks PocketBase role/isAdmin fields.
 */
export function isCurrentUserAdmin(): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  // Check role-based admin (from PocketBase)
  return user.role === 'admin' || user.isAdmin === true;
}

/**
 * Check if the current user has staff role (includes admin)
 */
export function isCurrentUserStaff(): boolean {
  const user = getCurrentUser();
  return user?.role === 'admin' || user?.role === 'staff';
}

/**
 * Check if the current user is blocked
 */
export function isCurrentUserBlocked(): boolean {
  const user = getCurrentUser();
  return user?.isBlocked === true;
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
  } catch (error) {
    // Token refresh failed, clear auth state
    console.warn('Token refresh failed, clearing auth state:', error);
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
    const user = getAuthRecord(pb);
    callback(pb.authStore.isValid ? user : null);
  });

  return unsubscribe;
}

// ============================================
// Server-side Auth Helpers
// ============================================

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

// ============================================
// User Profile Management
// ============================================

/**
 * Update the current user's profile
 */
export async function updateProfile(data: {
  name?: string;
  phone?: string;
  avatar?: File;
}): Promise<User> {
  const pb = getPocketBaseClient();
  const user = getCurrentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const formData = new FormData();
  if (data.name !== undefined) formData.append('name', data.name);
  if (data.phone !== undefined) formData.append('phone', data.phone);
  if (data.avatar) formData.append('avatar', data.avatar);

  const updated = await pb.collection('users').update(user.id, formData);
  return updated as User;
}

