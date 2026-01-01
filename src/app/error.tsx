'use client';

import { ErrorFallback } from '@/components/shared/error-fallback';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary for the application
 * Catches errors in all routes and displays a friendly error page
 */
export default function GlobalError({ error, reset }: ErrorProps) {
  return (
    <div className="container flex min-h-[50vh] items-center justify-center py-16">
      <ErrorFallback
        error={error}
        reset={reset}
        title="Something went wrong"
        description="We encountered an unexpected error. Please try again or return to the home page."
      />
    </div>
  );
}
