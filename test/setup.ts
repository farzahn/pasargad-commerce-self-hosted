/**
 * Vitest Setup File
 *
 * Global test setup that runs before each test file.
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Clean up after each test (unmount components, clear DOM)
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
vi.stubEnv('STORE_NAME', 'Test Store');
vi.stubEnv('CURRENCY_CODE', 'USD');
vi.stubEnv('CURRENCY_SYMBOL', '$');
vi.stubEnv('LOCALE', 'en-US');
vi.stubEnv('SHIPPING_FLAT_RATE', '500');
vi.stubEnv('FREE_SHIPPING_THRESHOLD', '5000');
vi.stubEnv('ORDER_PREFIX', 'TEST');

// Add custom matchers if needed
// expect.extend({});
