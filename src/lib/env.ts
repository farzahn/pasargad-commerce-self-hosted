/**
 * Environment Variable Validation
 *
 * Uses Zod to validate environment variables at build/runtime.
 * This ensures all required configuration is present and correctly typed.
 */

import { z } from 'zod';

/**
 * Schema for server-side environment variables
 * These are never exposed to the client
 */
const serverEnvSchema = z.object({
  // PocketBase Configuration
  POCKETBASE_INTERNAL_URL: z.string().url().optional(),

  // Admin Configuration
  ADMIN_EMAIL: z.string().email().optional(),

  // SMTP Configuration (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // Redis Configuration (optional)
  REDIS_URL: z.string().url().optional(),

  // Site Password Protection (optional)
  SITE_PASSWORD: z.string().optional(),

  // Cloudflare Tunnel (optional)
  CLOUDFLARE_TUNNEL_TOKEN: z.string().optional(),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
});

/**
 * Schema for client-side environment variables
 * These are exposed to the browser via NEXT_PUBLIC_ prefix
 */
const clientEnvSchema = z.object({
  // PocketBase URL (required for API calls)
  NEXT_PUBLIC_POCKETBASE_URL: z.string().url().default('http://localhost:8090'),

  // Site URL
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),

  // Store Configuration
  NEXT_PUBLIC_STORE_NAME: z.string().default('My Store'),
  NEXT_PUBLIC_STORE_DESCRIPTION: z.string().optional(),
  NEXT_PUBLIC_ADMIN_EMAIL: z.string().email().optional(),

  // Processing Status Customization
  NEXT_PUBLIC_PROCESSING_STATUS_NAME: z.string().default('Processing'),
});

/**
 * Schema for store configuration environment variables
 * These are used in config.ts
 */
const storeConfigSchema = z.object({
  // Store identity
  STORE_NAME: z.string().default('My Store'),

  // Order configuration
  ORDER_PREFIX: z.string().default('ORD'),

  // Currency (ISO 4217 code and symbol)
  CURRENCY_CODE: z.string().length(3).default('USD'),
  CURRENCY_SYMBOL: z.string().default('$'),

  // Locale (BCP 47 format)
  LOCALE: z.string().default('en-US'),

  // Shipping (values in cents)
  SHIPPING_FLAT_RATE: z.coerce.number().int().nonnegative().default(500),
  FREE_SHIPPING_THRESHOLD: z.coerce.number().int().nonnegative().default(5000),

  // Custom status names
  PROCESSING_STATUS_NAME: z.string().default('Processing'),
});

/**
 * Combined schema for all environment variables
 */
const envSchema = serverEnvSchema.merge(clientEnvSchema).merge(storeConfigSchema);

type ServerEnv = z.infer<typeof serverEnvSchema>;
type ClientEnv = z.infer<typeof clientEnvSchema>;
type StoreConfig = z.infer<typeof storeConfigSchema>;
type Env = z.infer<typeof envSchema>;

/**
 * Validation result cache
 */
let cachedServerEnv: ServerEnv | null = null;
let cachedClientEnv: ClientEnv | null = null;
let cachedStoreConfig: StoreConfig | null = null;

/**
 * Validate and get server-side environment variables
 * Call this in server-side code only
 */
export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) {
    return cachedServerEnv;
  }

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid server environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid server environment configuration');
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

/**
 * Validate and get client-side environment variables
 * Safe to call from client or server
 */
export function getClientEnv(): ClientEnv {
  if (cachedClientEnv) {
    return cachedClientEnv;
  }

  // Build client env object from NEXT_PUBLIC_ prefixed vars
  const clientEnvInput = {
    NEXT_PUBLIC_POCKETBASE_URL: process.env.NEXT_PUBLIC_POCKETBASE_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_STORE_NAME: process.env.NEXT_PUBLIC_STORE_NAME,
    NEXT_PUBLIC_STORE_DESCRIPTION: process.env.NEXT_PUBLIC_STORE_DESCRIPTION,
    NEXT_PUBLIC_ADMIN_EMAIL: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    NEXT_PUBLIC_PROCESSING_STATUS_NAME: process.env.NEXT_PUBLIC_PROCESSING_STATUS_NAME,
  };

  const parsed = clientEnvSchema.safeParse(clientEnvInput);

  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid client environment configuration');
  }

  cachedClientEnv = parsed.data;
  return cachedClientEnv;
}

/**
 * Validate and get store configuration environment variables
 */
export function getStoreConfigEnv(): StoreConfig {
  if (cachedStoreConfig) {
    return cachedStoreConfig;
  }

  const storeEnvInput = {
    STORE_NAME: process.env.STORE_NAME,
    ORDER_PREFIX: process.env.ORDER_PREFIX,
    CURRENCY_CODE: process.env.CURRENCY_CODE,
    CURRENCY_SYMBOL: process.env.CURRENCY_SYMBOL,
    LOCALE: process.env.LOCALE,
    SHIPPING_FLAT_RATE: process.env.SHIPPING_FLAT_RATE,
    FREE_SHIPPING_THRESHOLD: process.env.FREE_SHIPPING_THRESHOLD,
    PROCESSING_STATUS_NAME: process.env.PROCESSING_STATUS_NAME,
  };

  const parsed = storeConfigSchema.safeParse(storeEnvInput);

  if (!parsed.success) {
    console.error('❌ Invalid store configuration:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid store configuration');
  }

  cachedStoreConfig = parsed.data;
  return cachedStoreConfig;
}

/**
 * Clear cached environment values
 * Useful for testing
 */
export function clearEnvCache(): void {
  cachedServerEnv = null;
  cachedClientEnv = null;
  cachedStoreConfig = null;
}

/**
 * Check if all required environment variables are set
 * Returns validation errors if any
 */
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    getClientEnv();
  } catch (e) {
    errors.push(`Client env: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  // Only validate server env on server
  if (typeof window === 'undefined') {
    try {
      getServerEnv();
    } catch (e) {
      errors.push(`Server env: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    try {
      getStoreConfigEnv();
    } catch (e) {
      errors.push(`Store config: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Export types
export type { ServerEnv, ClientEnv, StoreConfig, Env };
