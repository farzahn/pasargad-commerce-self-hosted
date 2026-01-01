/**
 * Standardized API Response Utilities
 *
 * Provides consistent response formats across all API routes.
 */

import { NextResponse } from 'next/server';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Create a successful API response
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Create an error API response
 */
export function errorResponse(
  message: string,
  status = 400,
  code?: string
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(code && { code }),
    },
    { status }
  );
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: (message = 'Unauthorized') => errorResponse(message, 401, 'UNAUTHORIZED'),
  forbidden: (message = 'Forbidden') => errorResponse(message, 403, 'FORBIDDEN'),
  notFound: (message = 'Not found') => errorResponse(message, 404, 'NOT_FOUND'),
  badRequest: (message = 'Bad request') => errorResponse(message, 400, 'BAD_REQUEST'),
  conflict: (message = 'Conflict') => errorResponse(message, 409, 'CONFLICT'),
  internalError: (message = 'Internal server error') => errorResponse(message, 500, 'INTERNAL_ERROR'),
  validationError: (message = 'Validation failed') => errorResponse(message, 422, 'VALIDATION_ERROR'),
  rateLimited: (message = 'Too many requests') => errorResponse(message, 429, 'RATE_LIMITED'),
};

/**
 * Wrap an async API handler with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>
): Promise<NextResponse<ApiResponse<T>>> {
  return handler().catch((error: unknown) => {
    console.error('API Error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return ApiErrors.internalError(message) as NextResponse<ApiResponse<T>>;
  });
}
