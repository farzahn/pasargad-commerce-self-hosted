import { NextRequest, NextResponse } from 'next/server';
import { createPocketBaseClient, loadAuthFromCookie } from '@/lib/pocketbase';

/**
 * Server-side admin check endpoint
 * Validates if the current user has admin privileges without exposing admin email client-side
 *
 * @returns { isAdmin: boolean, email?: string }
 */
export async function GET(request: NextRequest) {
  try {
    const pb = createPocketBaseClient();
    const cookie = request.headers.get('cookie') || '';

    // Load auth from cookie
    loadAuthFromCookie(pb, cookie);

    if (!pb.authStore.isValid) {
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    // Get user record (handles SDK version differences)
    const authStore = pb.authStore as unknown as { record?: { role?: string; isAdmin?: boolean; email?: string }; model?: { role?: string; isAdmin?: boolean; email?: string } };
    const user = authStore.record ?? authStore.model;

    if (!user) {
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    // Check role-based admin (from PocketBase)
    if (user.role === 'admin' || user.isAdmin === true) {
      return NextResponse.json({
        isAdmin: true,
        email: user.email
      }, { status: 200 });
    }

    // Check email-based admin (server-side only - not exposed to client)
    // Uses non-public env var ADMIN_EMAIL (not NEXT_PUBLIC_)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && user.email === adminEmail) {
      return NextResponse.json({
        isAdmin: true,
        email: user.email
      }, { status: 200 });
    }

    return NextResponse.json({ isAdmin: false }, { status: 200 });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ isAdmin: false, error: 'Auth check failed' }, { status: 500 });
  }
}
