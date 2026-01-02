# API Reference

This document covers the API routes, PocketBase integration, and data models used in the application.

## Table of Contents

1. [API Routes](#api-routes)
2. [PocketBase Collections](#pocketbase-collections)
3. [Data Models](#data-models)
4. [Query Helpers](#query-helpers)
5. [Authentication](#authentication)
6. [Error Handling](#error-handling)

---

## API Routes

### Health Check

**`GET /api/health`**

Returns the health status of the application and its services.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "app": {
      "status": "up",
      "latency": 5
    },
    "pocketbase": {
      "status": "up",
      "latency": 12
    },
    "redis": {
      "status": "up"
    }
  }
}
```

**Status Values:**
- `healthy` - All services operational
- `degraded` - Non-critical service down
- `unhealthy` - Critical service (PocketBase) down

**HTTP Status:**
- `200` - Healthy or degraded
- `503` - Unhealthy

---

### Admin Check

**`GET /api/auth/check-admin`**

Checks if the current user has admin privileges.

**Response:**
```json
{
  "isAdmin": true
}
```

**Authentication:** Requires valid session cookie.

---

### Site Access

**`POST /api/site-access`**

Validates site password when password protection is enabled.

**Request:**
```json
{
  "password": "secret-password"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## PocketBase Collections

PocketBase serves as the backend database, authentication, and file storage system.

### Collection Overview

| Collection | Type | Description |
|------------|------|-------------|
| `users` | Auth | User accounts (Google OAuth) |
| `products` | Base | Product catalog |
| `categories` | Base | Product categories |
| `orders` | Base | Customer orders |
| `discounts` | Base | Discount codes |
| `addresses` | Base | Saved addresses |
| `wishlists` | Base | User wishlists |
| `reviews` | Base | Product reviews |
| `messages` | Base | Contact form messages |
| `settings` | Base | App settings |

### Direct PocketBase Access

PocketBase Admin UI: `http://localhost:8090/_/`

PocketBase API endpoints:
- List: `GET /api/collections/{collection}/records`
- Get: `GET /api/collections/{collection}/records/{id}`
- Create: `POST /api/collections/{collection}/records`
- Update: `PATCH /api/collections/{collection}/records/{id}`
- Delete: `DELETE /api/collections/{collection}/records/{id}`

---

## Data Models

### User

```typescript
interface User {
  id: string;
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  username: string;
  name: string;
  avatar: string;
  phone: string;
  role: 'customer' | 'admin' | 'staff';
  isAdmin?: boolean;
  isBlocked: boolean;
  adminNotes?: string;
  lastLoginAt?: string;
  created: string;
  updated: string;
}
```

### Product

```typescript
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;          // Price in cents
  sku: string;
  category: string;           // Category ID
  tags: string[];
  images: string[];           // File names
  sizes: VariantOption[];
  colors: VariantOption[];
  options: VariantOption[];
  status: 'active' | 'inactive' | 'draft' | 'archived';
  isFeatured: boolean;
  badge: 'new' | 'sale' | 'bestseller' | '';
  stock?: number;
  created: string;
  updated: string;
}

interface VariantOption {
  name: string;
  priceModifier: number;      // Additional price in cents
  hex?: string;               // Color hex code
  stock?: number;
  metadata?: Record<string, string | number>;
}
```

### Category

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId: string;           // Parent category ID
  order: number;
  created: string;
  updated: string;
}
```

### Order

```typescript
interface Order {
  id: string;
  orderNumber: string;        // e.g., "ORD-20250101-0001"
  userId?: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;           // In cents
  shippingCost: number;       // In cents
  discountCode: string;
  discountAmount: number;     // In cents
  total: number;              // In cents
  status: OrderStatus;
  tracking: TrackingInfo | null;
  statusHistory: StatusHistoryEntry[];
  notes?: string;
  adminNotes?: string;
  invoiceSentAt?: string;
  paymentDueAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  created: string;
  updated: string;
}

type OrderStatus =
  | 'pending_review'
  | 'invoice_sent'
  | 'payment_received'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  sku: string;
  variant?: string;
  quantity: number;
  unitPrice: number;          // In cents
  totalPrice: number;         // In cents
}

interface ShippingAddress {
  name: string;
  street: string;
  apt?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

interface TrackingInfo {
  carrier: string;
  number: string;
  url?: string;
}

interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}
```

### Discount

```typescript
interface Discount {
  id: string;
  code: string;               // Unique discount code
  type: 'percentage' | 'fixed';
  value: number;              // Percentage (0-100) or cents
  minOrderValue: number;      // Minimum order in cents
  maxUses: number;            // 0 = unlimited
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  created: string;
  updated: string;
}
```

### Address

```typescript
interface Address {
  id: string;
  userId: string;
  label: string;              // e.g., "Home", "Work"
  name: string;
  street: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: boolean;
  created: string;
  updated: string;
}
```

### Wishlist

```typescript
interface Wishlist {
  id: string;
  userId: string;
  productId: string;
  created: string;
  updated: string;
}
```

### Review

```typescript
interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;             // 1-5
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  created: string;
  updated: string;
}
```

### Message (Contact Form)

```typescript
interface Message {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isRead: boolean;
  isArchived: boolean;
  created: string;
  updated: string;
}
```

---

## Query Helpers

The application provides type-safe helpers for PocketBase queries.

### Basic Usage

```typescript
import { getPocketBaseClient } from '@/lib/pocketbase';

const pb = getPocketBaseClient();

// Get all active products
const products = await pb.collection('products').getFullList({
  filter: 'status = "active"',
  sort: '-created',
  expand: 'category',
});
```

### Query Builder

Use the type-safe query builder:

```typescript
import { createQuery, Filters } from '@/lib/pocketbase';

// Build complex filters
const filter = createQuery()
  .where('status', '=', 'active')
  .and('basePrice', '>', 1000)
  .and('isFeatured', '=', true)
  .build();

// Pre-built filters
const activeProducts = Filters.activeProducts().build();
const featuredProducts = Filters.featuredProducts().build();
const userOrders = Filters.userOrders(userId).build();
```

### Collection Helpers

```typescript
import {
  getProducts,
  getProductBySlug,
  getProductById,
  getCategories,
  createOrder,
  getUserAddresses,
} from '@/lib/pocketbase';

// Products
const products = await getProducts({ status: 'active' });
const product = await getProductBySlug('my-product');

// Orders
const order = await createOrder({
  userId: user.id,
  customerEmail: user.email,
  customerName: user.name,
  items: cartItems,
  shippingAddress: address,
  subtotal: 5000,
  shippingCost: 500,
  discountCode: '',
  discountAmount: 0,
  total: 5500,
});

// Addresses
const addresses = await getUserAddresses(userId);
```

---

## Authentication

### Google OAuth Flow

The application uses Google OAuth exclusively for customer authentication.

```typescript
import { signInWithGoogle, signOut, getCurrentUser } from '@/lib/pocketbase/auth';

// Sign in (redirects to Google)
await signInWithGoogle();

// Get current user
const user = await getCurrentUser();

// Sign out
await signOut();
```

### Auth Provider (React)

```tsx
import { useAuthContext } from '@/components/shared/auth-provider';

function MyComponent() {
  const { user, isAdmin, loading, signIn, signOut } = useAuthContext();

  if (loading) return <Spinner />;

  if (!user) {
    return <button onClick={signIn}>Sign In</button>;
  }

  return (
    <div>
      Welcome, {user.name}!
      {isAdmin && <AdminLink />}
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Admin Access

Admin access is determined by matching the user's email with `NEXT_PUBLIC_ADMIN_EMAIL`:

```typescript
const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
```

---

## Error Handling

### Result Type Pattern

```typescript
import { withPocketBaseError, getOrNull } from '@/lib/pocketbase/errors';

// For optional data (returns null on error)
const product = await getOrNull(
  () => pb.collection('products').getOne(id),
  { operation: 'getProduct', id }
);

if (!product) {
  // Handle not found
}

// For operations needing error details
const result = await withPocketBaseError(
  () => pb.collection('orders').create(data)
);

if (result.success) {
  console.log('Created:', result.data);
} else {
  console.error('Error:', result.error.message);
  console.error('Code:', result.error.code);
}
```

### Error Codes

```typescript
type ErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';
```

### Structured Logging

```typescript
import { loggers } from '@/lib/logger';

// Log with context
loggers.orders.info('Order created', { orderId: order.id });
loggers.products.error('Failed to fetch', error, { slug });
loggers.auth.debug('Auth check', { userId });
```

---

## File Handling

### Product Images

Product images are stored in PocketBase's file storage.

```typescript
import { getFileUrl } from '@/lib/pocketbase/files';

// Get image URL
const imageUrl = getFileUrl(product, product.images[0]);

// With thumbnail size
const thumbUrl = getFileUrl(product, product.images[0], '200x200');
```

### Upload Images

```typescript
const formData = new FormData();
formData.append('images', file);

await pb.collection('products').update(productId, formData);
```

---

## Pagination

### List with Pagination

```typescript
const result = await pb.collection('products').getList(
  page,      // Current page (1-based)
  perPage,   // Items per page
  {
    filter: 'status = "active"',
    sort: '-created',
  }
);

// Result shape
interface ListResult<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}
```

### Full List (No Pagination)

```typescript
// Use only for small collections
const allItems = await pb.collection('categories').getFullList({
  sort: 'order',
});
```

---

## Real-time Subscriptions

PocketBase supports real-time updates:

```typescript
// Subscribe to changes
pb.collection('orders').subscribe('*', (e) => {
  console.log(e.action); // 'create', 'update', 'delete'
  console.log(e.record); // The affected record
});

// Subscribe to specific record
pb.collection('orders').subscribe(orderId, (e) => {
  console.log('Order updated:', e.record);
});

// Unsubscribe
pb.collection('orders').unsubscribe();
```

---

## Rate Limiting

The application includes rate limiting for API routes:

```typescript
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  const { success, remaining } = await rateLimit(ip, {
    limit: 10,        // Max requests
    window: 60,       // Per 60 seconds
  });

  if (!success) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Process request...
}
```
