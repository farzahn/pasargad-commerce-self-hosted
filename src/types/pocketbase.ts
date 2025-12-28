/**
 * PocketBase Type Definitions
 *
 * Type-safe interfaces for all PocketBase collections.
 * This is a generic e-commerce template - customize variants and fields as needed.
 */

import PocketBase, { RecordService } from 'pocketbase';

// ============================================
// Base Record Types
// ============================================

/**
 * Base record fields that PocketBase automatically generates
 */
export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: string;
}

// ============================================
// Product Variant Types
// ============================================

/**
 * Generic variant option - can be used for any variant type
 * Examples: sizes, colors, materials, styles, etc.
 */
export interface VariantOption {
  name: string;
  priceModifier: number;
  /** Optional metadata for the variant (e.g., hex for colors, dimensions for sizes) */
  metadata?: Record<string, string | number>;
}

// Convenience aliases for common variant types
export type SizeVariant = VariantOption;
export type ColorVariant = VariantOption & { hex?: string };

export type ProductStatus = 'active' | 'inactive';
export type ProductBadge = 'new' | 'sale' | '';

/**
 * Product interface - customize variants based on your needs
 *
 * Default variants: sizes, colors, options (generic)
 * You can rename or add more variant fields in PocketBase admin
 */
export interface Product extends BaseRecord {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  sku: string;
  category: string; // Relation ID to categories
  tags: string[];
  images: string[]; // File field names

  // Default variant fields - customize as needed
  sizes: VariantOption[];
  colors: VariantOption[];
  /** Generic options field - use for any additional variants (material, style, etc.) */
  options: VariantOption[];

  status: ProductStatus;
  isFeatured: boolean;
  badge: ProductBadge;

  // Expanded relations (when using expand)
  expand?: {
    category?: Category;
  };
}

// ============================================
// Category Types
// ============================================

export interface Category extends BaseRecord {
  name: string;
  slug: string;
  parent: string | null; // Self-referential relation
  order: number;

  // Expanded relations
  expand?: {
    parent?: Category;
  };
}

// ============================================
// User Types (Auth Collection)
// ============================================

export interface User extends BaseRecord {
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  name: string;
  avatar: string; // File field name
  isBlocked: boolean;
  adminNotes: string;
}

// ============================================
// Address Types
// ============================================

export interface Address extends BaseRecord {
  user: string; // Relation ID to users
  name: string;
  street: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;

  // Expanded relations
  expand?: {
    user?: User;
  };
}

// ============================================
// Wishlist Types
// ============================================

export interface Wishlist extends BaseRecord {
  user: string; // Relation ID to users
  product: string; // Relation ID to products

  // Expanded relations
  expand?: {
    user?: User;
    product?: Product;
  };
}

// ============================================
// Order Types
// ============================================

/**
 * Order status - customize based on your workflow
 * Default: pending_review -> invoice_sent -> payment_received -> processing -> shipped -> delivered
 * The 'processing' status can be renamed via PROCESSING_STATUS_NAME env var
 */
export type OrderStatus =
  | 'pending_review'
  | 'invoice_sent'
  | 'payment_received'
  | 'processing' // Generic name - displays as configured (e.g., "printing", "preparing")
  | 'shipped'
  | 'delivered'
  | 'cancelled';

/**
 * Order line item - stores selected variant options as key-value pairs
 */
export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  /** Selected variants stored as key-value pairs (e.g., { size: "Large", color: "Blue" }) */
  variants: Record<string, string>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShippingAddress {
  name: string;
  street: string;
  apt?: string;
  city: string;
  state: string;
  zip: string;
}

export interface TrackingInfo {
  carrier: string;
  number: string;
  url: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order extends BaseRecord {
  orderNumber: string;
  user: string; // Relation ID to users
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingCost: number;
  discountCode: string;
  discountAmount: number;
  total: number;
  status: OrderStatus;
  invoiceSentAt: string;
  paymentDueAt: string;
  tracking: TrackingInfo | null;
  cancelledAt: string;
  cancellationReason: string;
  adminNotes: string;
  statusHistory: StatusHistoryEntry[];

  // Expanded relations
  expand?: {
    user?: User;
  };
}

// ============================================
// Discount Types
// ============================================

export type DiscountType = 'percentage' | 'fixed';

export interface Discount extends BaseRecord {
  code: string;
  type: DiscountType;
  value: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
}

// ============================================
// Contact Message Types
// ============================================

export interface ContactMessage extends BaseRecord {
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  isArchived: boolean;
}

// ============================================
// Typed PocketBase Client
// ============================================

export interface TypedPocketBase extends PocketBase {
  collection(idOrName: 'products'): RecordService<Product>;
  collection(idOrName: 'categories'): RecordService<Category>;
  collection(idOrName: 'users'): RecordService<User>;
  collection(idOrName: 'addresses'): RecordService<Address>;
  collection(idOrName: 'wishlist'): RecordService<Wishlist>;
  collection(idOrName: 'orders'): RecordService<Order>;
  collection(idOrName: 'discounts'): RecordService<Discount>;
  collection(idOrName: 'contact_messages'): RecordService<ContactMessage>;
  collection(idOrName: string): RecordService;
}

// ============================================
// API Response Types
// ============================================

export interface ListResult<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

// ============================================
// Cart Types (Client-side only)
// ============================================

/**
 * Cart item - stores selected variant options as key-value pairs
 */
export interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  /** Selected variants stored as key-value pairs (e.g., { size: "Large", color: "Blue" }) */
  variants: Record<string, string>;
  quantity: number;
  unitPrice: number;
  image?: string;
}

export interface Cart {
  items: CartItem[];
  discountCode?: string;
  discountAmount: number;
}

// ============================================
// Store Configuration Types
// ============================================

/**
 * Store configuration loaded from environment variables
 */
export interface StoreConfig {
  name: string;
  orderPrefix: string;
  currencySymbol: string;
  shippingFlatRate: number; // in cents
  freeShippingThreshold: number; // in cents, 0 = disabled
  processingStatusName: string; // e.g., "printing", "preparing", "manufacturing"
  adminEmail: string;
}
