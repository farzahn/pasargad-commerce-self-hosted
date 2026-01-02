/**
 * Health Check API Endpoint
 *
 * Provides health status for container orchestration and monitoring.
 * Returns service status for:
 * - Application
 * - PocketBase connection
 * - Redis connection (if configured)
 */

import { NextResponse } from 'next/server';
import { getPocketBaseClient } from '@/lib/pocketbase';
import { loggers } from '@/lib/logger';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    app: ServiceStatus;
    pocketbase: ServiceStatus;
    redis?: ServiceStatus;
  };
}

interface ServiceStatus {
  status: 'up' | 'down' | 'unknown';
  latency?: number;
  message?: string;
}

/**
 * Check PocketBase connectivity
 */
async function checkPocketBase(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    const pb = getPocketBaseClient();
    // Try to fetch the health endpoint or list auth methods as a ping
    await pb.health.check();
    return {
      status: 'up',
      latency: Date.now() - startTime,
    };
  } catch (error) {
    loggers.pocketbase.warn('Health check failed for PocketBase', {}, error);
    return {
      status: 'down',
      latency: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Check Redis connectivity (if configured)
 */
async function checkRedis(): Promise<ServiceStatus | undefined> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return undefined; // Redis not configured
  }

  // For now, just return unknown since we don't have direct Redis access
  // In a real implementation, you would ping the Redis server
  return {
    status: 'unknown',
    message: 'Redis check not implemented',
  };
}

/**
 * Determine overall health status
 */
function getOverallStatus(services: HealthStatus['services']): HealthStatus['status'] {
  const statuses = Object.values(services).filter(Boolean) as ServiceStatus[];

  if (statuses.every((s) => s.status === 'up')) {
    return 'healthy';
  }

  if (services.pocketbase.status === 'down') {
    return 'unhealthy'; // Critical service down
  }

  return 'degraded';
}

/**
 * GET /api/health
 *
 * Returns health status of the application and its dependencies.
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Check all services in parallel
    const [pocketbaseStatus, redisStatus] = await Promise.all([
      checkPocketBase(),
      checkRedis(),
    ]);

    const services: HealthStatus['services'] = {
      app: {
        status: 'up',
        latency: Date.now() - startTime,
      },
      pocketbase: pocketbaseStatus,
      ...(redisStatus && { redis: redisStatus }),
    };

    const health: HealthStatus = {
      status: getOverallStatus(services),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services,
    };

    // Return appropriate HTTP status based on health
    const httpStatus = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: httpStatus });
  } catch (error) {
    loggers.api.error('Health check failed', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          app: {
            status: 'down',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
          pocketbase: { status: 'unknown' },
        },
      } satisfies HealthStatus,
      { status: 503 }
    );
  }
}

/**
 * HEAD /api/health
 *
 * Simple liveness check - returns 200 if the server is responding.
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
