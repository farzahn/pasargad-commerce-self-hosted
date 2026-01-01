'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorFallbackProps {
  error?: Error & { digest?: string };
  reset?: () => void;
  title?: string;
  description?: string;
  showHomeButton?: boolean;
}

/**
 * ErrorFallback component for displaying error states
 * Can be used standalone or with React Error Boundaries
 */
export function ErrorFallback({
  error,
  reset,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  showHomeButton = true,
}: ErrorFallbackProps) {
  useEffect(() => {
    // Log the error to console in development
    if (error && process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorFallback:', error);
    }
  }, [error]);

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-muted-foreground">{description}</p>

        {error?.message && process.env.NODE_ENV === 'development' && (
          <details className="rounded-md bg-muted p-3 text-left text-sm">
            <summary className="cursor-pointer font-medium">
              Error Details
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {reset && (
            <Button onClick={reset} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {showHomeButton && (
            <Button variant="outline" asChild>
              <a href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
