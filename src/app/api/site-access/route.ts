import { NextResponse } from 'next/server';
import { successResponse, ApiErrors, withErrorHandling } from '@/lib/api-response';
import { rateLimit, getClientId, getRateLimitHeaders, RateLimits } from '@/lib/rate-limit';

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    // Apply rate limiting for password attempts (5 per minute)
    const clientId = getClientId(request);
    const rateLimitResult = rateLimit(clientId, RateLimits.auth);

    if (!rateLimitResult.success) {
      const response = ApiErrors.rateLimited('Too many attempts. Please try again later.');
      // Add rate limit headers
      const headers = getRateLimitHeaders(rateLimitResult);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const { password } = await request.json();
    const sitePassword = process.env.SITE_PASSWORD;

    if (!sitePassword) {
      // No password protection enabled
      return successResponse({ granted: true });
    }

    if (password === sitePassword) {
      // Password correct - set cookie
      const response = NextResponse.json({
        success: true,
        data: { granted: true },
      });

      // Set cookie for 7 days
      response.cookies.set('site-access', 'granted', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    return ApiErrors.unauthorized('Invalid password');
  });
}
