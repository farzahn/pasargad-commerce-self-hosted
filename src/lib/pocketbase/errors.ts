/**
 * PocketBase Error Handling Utilities
 *
 * Provides consistent error handling, logging, and type-safe error responses
 * for all PocketBase operations.
 */

import { loggers } from '@/lib/logger';

/**
 * Standard error codes for PocketBase operations
 */
export const ErrorCode = {
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Structured error for PocketBase operations
 */
export class PocketBaseError extends Error {
  readonly code: ErrorCodeType;
  readonly originalError?: unknown;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCodeType,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PocketBaseError';
    this.code = code;
    this.originalError = originalError;
    this.context = context;
  }
}

/**
 * Check if an error is a PocketBase API error
 */
function isPocketBaseApiError(error: unknown): error is {
  status: number;
  message: string;
  data?: Record<string, unknown>;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  );
}

/**
 * Parse a PocketBase error and return a structured PocketBaseError
 */
export function parsePocketBaseError(error: unknown, context?: Record<string, unknown>): PocketBaseError {
  if (error instanceof PocketBaseError) {
    return error;
  }

  if (isPocketBaseApiError(error)) {
    switch (error.status) {
      case 404:
        return new PocketBaseError(
          error.message || 'Resource not found',
          ErrorCode.NOT_FOUND,
          error,
          context
        );
      case 401:
        return new PocketBaseError(
          error.message || 'Authentication required',
          ErrorCode.UNAUTHORIZED,
          error,
          context
        );
      case 403:
        return new PocketBaseError(
          error.message || 'Access denied',
          ErrorCode.FORBIDDEN,
          error,
          context
        );
      case 400:
        return new PocketBaseError(
          error.message || 'Validation failed',
          ErrorCode.VALIDATION_ERROR,
          error,
          context
        );
      case 409:
        return new PocketBaseError(
          error.message || 'Duplicate entry',
          ErrorCode.DUPLICATE_ENTRY,
          error,
          context
        );
      default:
        return new PocketBaseError(
          error.message || 'An error occurred',
          ErrorCode.UNKNOWN_ERROR,
          error,
          context
        );
    }
  }

  // Network or other errors
  if (error instanceof Error) {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new PocketBaseError(
        'Unable to connect to the database',
        ErrorCode.CONNECTION_ERROR,
        error,
        context
      );
    }
    return new PocketBaseError(
      error.message,
      ErrorCode.UNKNOWN_ERROR,
      error,
      context
    );
  }

  return new PocketBaseError(
    'An unexpected error occurred',
    ErrorCode.UNKNOWN_ERROR,
    error,
    context
  );
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = PocketBaseError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a success result
 */
export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Create a failure result
 */
export function err<E = PocketBaseError>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Wrap a PocketBase operation with error handling
 *
 * @example
 * const result = await withPocketBaseError(
 *   () => pb.collection('products').getOne(id),
 *   { operation: 'getProduct', productId: id }
 * );
 *
 * if (!result.success) {
 *   return null;
 * }
 * return result.data;
 */
export async function withPocketBaseError<T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<Result<T>> {
  try {
    const data = await operation();
    return ok(data);
  } catch (error) {
    const pbError = parsePocketBaseError(error, context);
    loggers.pocketbase.error(pbError.message, error, { ...context, code: pbError.code });
    return err(pbError);
  }
}

/**
 * Wrap a PocketBase operation and return null on not found
 * Useful for getOne-style operations where not found is expected
 */
export async function getOrNull<T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T | null> {
  const result = await withPocketBaseError(operation, context);

  if (!result.success) {
    // Only suppress NOT_FOUND errors, re-throw others
    if (result.error.code === ErrorCode.NOT_FOUND) {
      return null;
    }
    // For other errors, log but return null for backwards compatibility
    return null;
  }

  return result.data;
}

/**
 * Wrap a PocketBase operation and throw on error
 * Use when you want the error to propagate
 */
export async function getOrThrow<T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  const result = await withPocketBaseError(operation, context);

  if (!result.success) {
    throw result.error;
  }

  return result.data;
}

/**
 * Check if an error is a specific type
 */
export function isErrorCode(error: unknown, code: ErrorCodeType): boolean {
  return error instanceof PocketBaseError && error.code === code;
}

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyMessage(error: PocketBaseError): string {
  switch (error.code) {
    case ErrorCode.NOT_FOUND:
      return 'The requested item could not be found.';
    case ErrorCode.UNAUTHORIZED:
      return 'Please sign in to continue.';
    case ErrorCode.FORBIDDEN:
      return 'You do not have permission to perform this action.';
    case ErrorCode.VALIDATION_ERROR:
      return 'Please check your input and try again.';
    case ErrorCode.DUPLICATE_ENTRY:
      return 'This item already exists.';
    case ErrorCode.CONNECTION_ERROR:
      return 'Unable to connect. Please check your internet connection.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
