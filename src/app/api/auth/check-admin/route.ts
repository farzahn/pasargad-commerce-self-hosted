import { NextRequest } from 'next/server';
import { createPocketBaseClient, loadAuthFromCookie } from '@/lib/pocketbase';
import { successResponse, ApiErrors, withErrorHandling } from '@/lib/api-response';

interface AdminCheckResponse {
  isAdmin: boolean;
  email?: string;
}

/**
 * Server-side admin check endpoint
 * Validates if the current user has admin privileges without exposing admin email client-side
 */
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const pb = createPocketBaseClient();
    const cookie = request.headers.get('cookie') || '';

    // Load auth from cookie
    loadAuthFromCookie(pb, cookie);

    if (!pb.authStore.isValid) {
      return successResponse<AdminCheckResponse>({ isAdmin: false });
    }

    // Get user record (handles SDK version differences)
    const authStore = pb.authStore as unknown as {
      record?: { role?: string; isAdmin?: boolean; email?: string };
      model?: { role?: string; isAdmin?: boolean; email?: string };
    };
    const user = authStore.record ?? authStore.model;

    if (!user) {
      return successResponse<AdminCheckResponse>({ isAdmin: false });
    }

    // Check role-based admin (from PocketBase)
    if (user.role === 'admin' || user.isAdmin === true) {
      return successResponse<AdminCheckResponse>({
        isAdmin: true,
        email: user.email,
      });
    }

    // Check email-based admin (server-side only - not exposed to client)
    // Uses non-public env var ADMIN_EMAIL (not NEXT_PUBLIC_)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && user.email === adminEmail) {
      return successResponse<AdminCheckResponse>({
        isAdmin: true,
        email: user.email,
      });
    }

    return successResponse<AdminCheckResponse>({ isAdmin: false });
  });
}
