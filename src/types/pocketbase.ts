/**
 * PocketBase Type Definitions
 *
 * Type-safe interfaces for all PocketBase collections.
 * Collections: users, categories, products, orders, discounts, messages, addresses, wishlists, reviews, settings
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
// User Types (Auth Collection)
// ============================================

export type UserRole = 'customer' | 'admin' | 'staff';

export interface User extends BaseRecord {
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  username: string;
  name: string;
  avatar: string;
  phone: string;
  role: UserRole;
  /** Direct admin flag (alternative to role) */
  isAdmin?: boolean;
  isBlocked: boolean;
  adminNotes?: string;
  lastLoginAt?: string;
}

// ============================================
// Category Types
// ============================================

export interface Category extends BaseRecord {
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId: string;
  order: number;

  // Expanded relations
  expand?: {
    parentId?: Category;
  };
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
  /** Optional hex color code (for color variants) */
  hex?: string;
  /** Optional stock for this variant */
  stock?: number;
  /** Optional metadata for the variant (e.g., dimensions for sizes) */
  metadata?: Record<string, string | number>;
}

export type ProductStatus = 'active' | 'inactive' | 'draft' | 'archived';
export type ProductBadge = 'new' | 'sale' | 'bestseller' | '';

/**
 * Product interface
 */
export interface Product extends BaseRecord {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  sku: string;
  /** Category relation ID */
  category: string;
  /** @deprecated Use `category` instead */
  categoryId?: string;
  tags: string[];
  images: string[];
  /** Generic variants - sizes, colors, etc. */
  sizes: VariantOption[];
  colors: VariantOption[];
  options: VariantOption[];
  /** @deprecated Use sizes, colors, options instead */
  variants?: VariantOption[];
  status: ProductStatus;
  isFeatured: boolean;
  badge: ProductBadge;
  stock?: number;

  // Expanded relations
  expand?: {
    category?: Category;
    categoryId?: Category;
  };
}

// ============================================
// Order Types
// ============================================

export type OrderStatus =
  | 'pending_review'
  | 'invoice_sent'
  | 'payment_received'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

/**
 * Order line item - stores product details and selected variants
 */
export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  sku: string;
  /** Selected variant options */
  variants?: Record<string, string>;
  /** @deprecated Use variants instead */
  variant?: string;
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
  country: string;
  phone?: string;
}

export interface TrackingInfo {
  carrier: string;
  number: string;
  url?: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order extends BaseRecord {
  orderNumber: string;
  user?: string;
  userId?: string;
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
  tracking: TrackingInfo | null;
  statusHistory: StatusHistoryEntry[];
  notes?: string;
  adminNotes?: string;
  invoiceSentAt?: string;
  paymentDueAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;

  // Expanded relations
  expand?: {
    user?: User;
    userId?: User;
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
// Message Types (Contact Messages)
// ============================================

export interface Message extends BaseRecord {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isRead: boolean;
  isArchived: boolean;
}

// Alias for compatibility
export type ContactMessage = Message;

// ============================================
// Address Types
// ============================================

export interface Address extends BaseRecord {
  userId: string;
  label: string;
  name: string;
  street: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: boolean;

  // Expanded relations
  expand?: {
    userId?: User;
  };
}

// ============================================
// Wishlist Types
// ============================================

export interface Wishlist extends BaseRecord {
  userId: string;
  productId: string;

  // Expanded relations
  expand?: {
    userId?: User;
    productId?: Product;
  };
}

// ============================================
// Review Types
// ============================================

export interface Review extends BaseRecord {
  userId: string;
  productId: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;

  // Expanded relations
  expand?: {
    userId?: User;
    productId?: Product;
  };
}

// ============================================
// Settings Types
// ============================================

export interface Setting extends BaseRecord {
  key: string;
  value: string;
  description: string;
}

// ============================================
// Typed PocketBase Client
// ============================================

export interface TypedPocketBase extends PocketBase {
  collection(idOrName: 'users'): RecordService<User>;
  collection(idOrName: 'categories'): RecordService<Category>;
  collection(idOrName: 'products'): RecordService<Product>;
  collection(idOrName: 'orders'): RecordService<Order>;
  collection(idOrName: 'discounts'): RecordService<Discount>;
  collection(idOrName: 'messages'): RecordService<Message>;
  collection(idOrName: 'addresses'): RecordService<Address>;
  collection(idOrName: 'wishlists'): RecordService<Wishlist>;
  collection(idOrName: 'reviews'): RecordService<Review>;
  collection(idOrName: 'settings'): RecordService<Setting>;
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
 * Cart item - stores product details and selected variants (client-side only)
 */
export interface CartItem {
  productId: string;
  productName: string;
  productImage?: string;
  sku?: string;
  /** Selected variant options as key-value pairs */
  variants?: Record<string, string>;
  /** @deprecated Use variants instead */
  variant?: string;
  quantity: number;
  unitPrice: number;
}

export interface Cart {
  items: CartItem[];
  discountCode?: string;
  discountAmount: number;
}

// ============================================
// Auth Types (Google OAuth Only)
// ============================================

/**
 * @deprecated Not used - Google OAuth is the only authentication method.
 * Kept for backward compatibility.
 */
export interface AuthResponse {
  token: string;
  record: User;
  /** Alias for record */
  user?: User;
}

export interface OAuthMeta {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  accessToken: string;
  refreshToken?: string;
  expiry?: string;
  rawUser?: Record<string, unknown>;
}

export interface OAuthResponse extends AuthResponse {
  meta?: OAuthMeta;
}

// ============================================
// Store Configuration Types
// ============================================

export interface StoreConfig {
  name: string;
  orderPrefix: string;
  currencySymbol: string;
  shippingFlatRate: number;
  freeShippingThreshold: number;
  processingStatusName: string;
  adminEmail: string;
}
