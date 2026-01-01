/**
 * CSRF Protection Utility
 *
 * Provides CSRF token generation and validation for forms.
 * Uses a simple token-based approach with session binding.
 */

import { cookies } from 'next/headers';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create a CSRF token for the current session
 * Should be called from a Server Component or Server Action
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (existingToken) {
    return existingToken;
  }

  // Generate new token
  const newToken = generateToken();

  // Set cookie (HttpOnly, Secure in production, SameSite=Lax)
  cookieStore.set(CSRF_COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return newToken;
}

/**
 * Validate a CSRF token from request
 * Compares the token in the header/body with the cookie token
 *
 * @param request - The incoming request
 * @returns true if valid, false otherwise
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!cookieToken) {
    return false;
  }

  // Check header first
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken && timingSafeEqual(headerToken, cookieToken)) {
    return true;
  }

  // Check form body if it's a form submission
  const contentType = request.headers.get('content-type');
  if (contentType?.includes('application/x-www-form-urlencoded') || contentType?.includes('multipart/form-data')) {
    try {
      const formData = await request.clone().formData();
      const bodyToken = formData.get('_csrf')?.toString();
      if (bodyToken && timingSafeEqual(bodyToken, cookieToken)) {
        return true;
      }
    } catch {
      // Failed to parse form data
    }
  }

  // Check JSON body
  if (contentType?.includes('application/json')) {
    try {
      const body = await request.clone().json();
      const bodyToken = body._csrf;
      if (bodyToken && timingSafeEqual(bodyToken, cookieToken)) {
        return true;
      }
    } catch {
      // Failed to parse JSON
    }
  }

  return false;
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }

  return result === 0;
}

/**
 * Middleware helper to require CSRF validation
 * Returns an error response if validation fails
 */
export async function requireCsrf(request: Request): Promise<Response | null> {
  // Skip CSRF check for GET, HEAD, OPTIONS (safe methods)
  const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  if (safeMethod) {
    return null;
  }

  const isValid = await validateCsrfToken(request);
  if (!isValid) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid CSRF token',
        code: 'CSRF_INVALID',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null;
}

/**
 * React component props type for CSRF hidden input
 */
export interface CsrfInputProps {
  token: string;
}

/**
 * Get CSRF token for client-side usage
 * Returns the token to be included in forms or AJAX requests
 */
export async function getClientCsrfToken(): Promise<string> {
  return getCsrfToken();
}
