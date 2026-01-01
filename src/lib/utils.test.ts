/**
 * Utils Tests
 *
 * Tests for utility functions in utils.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  cn,
  formatCurrency,
  formatDate,
  generateOrderNumber,
  generateSlug,
  calculateTotal,
  calculateCartSubtotal,
  calculateCartItemCount,
  calculateDiscountAmount,
  calculateCartTotals,
} from './utils';
import { clearConfigCache } from './config';
import type { CartItem } from '@/types/pocketbase';

// Clear config cache before each test to ensure fresh environment variables
beforeEach(() => {
  clearConfigCache();
});

describe('cn (class name merge)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});

describe('formatCurrency', () => {
  it('should format positive numbers', () => {
    const result = formatCurrency(100);
    expect(result).toMatch(/\$100\.00/);
  });

  it('should format decimal numbers', () => {
    const result = formatCurrency(99.99);
    expect(result).toMatch(/\$99\.99/);
  });

  it('should format zero', () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/\$0\.00/);
  });
});

describe('formatDate', () => {
  it('should format valid date string', () => {
    const result = formatDate('2024-01-15');
    expect(result).toContain('January');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('should format Date object', () => {
    const result = formatDate(new Date('2024-06-20'));
    expect(result).toContain('June');
    expect(result).toContain('20');
    expect(result).toContain('2024');
  });

  it('should return N/A for null', () => {
    expect(formatDate(null)).toBe('N/A');
  });

  it('should return N/A for undefined', () => {
    expect(formatDate(undefined)).toBe('N/A');
  });

  it('should return N/A for invalid date', () => {
    expect(formatDate('invalid')).toBe('N/A');
  });
});

describe('generateOrderNumber', () => {
  it('should generate order number with correct format', () => {
    const orderNumber = generateOrderNumber();
    expect(orderNumber).toMatch(/^ORD-\d{8}-\d{4}$/);
  });

  it('should generate unique order numbers', () => {
    const order1 = generateOrderNumber();
    const order2 = generateOrderNumber();
    // While not guaranteed, consecutive calls should usually produce different numbers
    // due to the random component
    expect(order1).not.toBe(order2);
  });
});

describe('generateSlug', () => {
  it('should convert to lowercase', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('should replace spaces with hyphens', () => {
    expect(generateSlug('foo bar baz')).toBe('foo-bar-baz');
  });

  it('should remove special characters', () => {
    expect(generateSlug('Hello! World?')).toBe('hello-world');
  });

  it('should remove leading and trailing hyphens', () => {
    expect(generateSlug('  Hello World  ')).toBe('hello-world');
  });
});

describe('calculateTotal', () => {
  it('should add subtotal and shipping', () => {
    expect(calculateTotal(1000, 500)).toBe(1500);
  });

  it('should subtract discount', () => {
    expect(calculateTotal(1000, 500, 200)).toBe(1300);
  });

  it('should not go below zero', () => {
    expect(calculateTotal(100, 0, 500)).toBe(0);
  });
});

describe('Cart Calculations', () => {
  const mockCartItems: CartItem[] = [
    {
      productId: '1',
      productName: 'Item 1',
      quantity: 2,
      unitPrice: 1000, // $10.00 each
    },
    {
      productId: '2',
      productName: 'Item 2',
      quantity: 1,
      unitPrice: 2500, // $25.00
    },
  ];

  describe('calculateCartSubtotal', () => {
    it('should calculate correct subtotal in cents', () => {
      const subtotal = calculateCartSubtotal(mockCartItems);
      expect(subtotal).toBe(4500); // (2 * 1000) + (1 * 2500)
    });

    it('should return 0 for empty cart', () => {
      expect(calculateCartSubtotal([])).toBe(0);
    });
  });

  describe('calculateCartItemCount', () => {
    it('should count total items', () => {
      expect(calculateCartItemCount(mockCartItems)).toBe(3); // 2 + 1
    });

    it('should return 0 for empty cart', () => {
      expect(calculateCartItemCount([])).toBe(0);
    });
  });

  describe('calculateDiscountAmount', () => {
    it('should calculate percentage discount', () => {
      const discount = calculateDiscountAmount(10000, 'percentage', 10);
      expect(discount).toBe(1000); // 10% of $100
    });

    it('should calculate fixed discount', () => {
      const discount = calculateDiscountAmount(10000, 'fixed', 500);
      expect(discount).toBe(500);
    });

    it('should cap fixed discount at subtotal', () => {
      const discount = calculateDiscountAmount(1000, 'fixed', 5000);
      expect(discount).toBe(1000); // Can't exceed subtotal
    });
  });

  describe('calculateCartTotals', () => {
    it('should calculate all totals correctly', () => {
      const totals = calculateCartTotals(mockCartItems, 0);

      expect(totals.subtotal).toBe(4500);
      expect(totals.itemCount).toBe(3);
      expect(totals.discount).toBe(0);
      // Shipping is 500 cents ($5) when under threshold
      expect(totals.shipping).toBe(500);
      expect(totals.total).toBe(5000); // 4500 + 500
    });

    it('should apply discount', () => {
      const totals = calculateCartTotals(mockCartItems, 500);

      expect(totals.discount).toBe(500);
      expect(totals.total).toBe(4500); // 4500 + 500 - 500
    });
  });
});
