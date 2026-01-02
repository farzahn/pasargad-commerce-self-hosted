# Development Guide

This guide covers the development workflow, code architecture, and conventions used in this project.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Architecture](#project-architecture)
3. [Code Conventions](#code-conventions)
4. [Key Patterns](#key-patterns)
5. [Adding Features](#adding-features)
6. [Testing](#testing)
7. [Common Tasks](#common-tasks)

---

## Development Setup

### Option 1: Docker Development (Recommended)

```bash
# Start all services
npm run docker:dev

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

Services available:
- **App**: http://localhost:3000
- **PocketBase Admin**: http://localhost:8090/_/
- **Umami**: http://localhost:3001

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Start PocketBase separately (Docker)
docker run -d -p 8090:8090 -v ./pb_data:/pb_data ghcr.io/muchobien/pocketbase

# Start Next.js dev server
npm run dev
```

### Useful Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint check
npm run typecheck    # TypeScript check
npm run test         # Run tests
npm run check        # Lint + typecheck
```

---

## Project Architecture

### Directory Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (admin)/             # Admin route group
│   │   └── admin/           # Admin pages
│   ├── (auth)/              # Auth route group
│   │   └── login/           # Login page
│   ├── (gate)/              # Password gate
│   │   └── password/        # Password entry
│   ├── (storefront)/        # Customer-facing route group
│   │   ├── products/        # Product pages
│   │   ├── cart/            # Cart page
│   │   ├── checkout/        # Checkout
│   │   └── account/         # User account
│   ├── api/                 # API routes
│   └── layout.tsx           # Root layout
│
├── components/
│   ├── shared/              # Shared across app
│   │   ├── auth-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── loading-spinner.tsx
│   │   ├── empty-state.tsx
│   │   └── address-form.tsx
│   ├── storefront/          # Storefront components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ProductCard.tsx
│   └── ui/                  # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
│
├── hooks/                   # Custom React hooks
│   ├── use-cart.ts         # Cart state management
│   ├── use-wishlist.ts     # Wishlist management
│   └── use-toast.ts        # Toast notifications
│
├── lib/                     # Utilities and helpers
│   ├── pocketbase/          # PocketBase integration
│   │   ├── client.ts        # PocketBase client
│   │   ├── auth.ts          # Auth helpers
│   │   ├── products.ts      # Product queries
│   │   ├── orders.ts        # Order queries
│   │   ├── query-builder.ts # Type-safe query builder
│   │   └── errors.ts        # Error handling
│   ├── config.ts            # Store configuration
│   ├── constants.ts         # App constants
│   ├── env.ts               # Environment validation
│   ├── logger.ts            # Structured logging
│   ├── utils.ts             # General utilities
│   └── csrf.ts              # CSRF protection
│
└── types/
    └── pocketbase.ts        # TypeScript types for DB
```

### Route Groups

Next.js route groups `(name)` organize code without affecting URLs:

| Group | Purpose | Layout |
|-------|---------|--------|
| `(admin)` | Admin dashboard | Admin nav, sidebar |
| `(auth)` | Login/logout | Minimal layout |
| `(gate)` | Password protection | Gate layout |
| `(storefront)` | Customer pages | Header + Footer |

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App                          │
├─────────────────────────────────────────────────────────┤
│  Pages (Server Components)                               │
│    ↓ fetch data                                          │
│  lib/pocketbase/*.ts (Query helpers)                     │
│    ↓ PocketBase SDK                                      │
│  PocketBase Server (SQLite)                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 Client-Side State                        │
├─────────────────────────────────────────────────────────┤
│  Zustand Stores                                          │
│    ├── useCartStore (cart items, localStorage)           │
│    └── useWishlistStore (wishlist, PocketBase sync)      │
│                                                          │
│  React Context                                           │
│    └── AuthContext (user session)                        │
└─────────────────────────────────────────────────────────┘
```

---

## Code Conventions

### TypeScript

- **Strict mode** enabled - no implicit any
- Use type imports: `import type { Product } from '@/types/pocketbase'`
- Define interfaces in `src/types/pocketbase.ts`

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductCard.tsx` |
| Pages | lowercase | `page.tsx` |
| Hooks | camelCase, use- prefix | `use-cart.ts` |
| Utils | camelCase | `utils.ts` |
| Constants | SCREAMING_SNAKE_CASE | `ORDER_STATUSES` |

### Component Structure

```tsx
// 1. Imports (external, then internal)
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types (if component-specific)
interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
}

// 3. Component
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // State
  const [isLoading, setIsLoading] = useState(false);

  // Handlers
  const handleClick = () => {
    // ...
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Import Aliases

Use `@/` for absolute imports:

```tsx
// Good
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

// Avoid
import { Button } from '../../../components/ui/button';
```

---

## Key Patterns

### PocketBase Query Builder

Use the type-safe query builder for database queries:

```typescript
import { createQuery, Filters } from '@/lib/pocketbase';

// Simple query
const filter = createQuery()
  .where('status', '=', 'active')
  .and('price', '>', 1000)
  .build();

// Pre-built filters
const activeProducts = Filters.activeProducts().build();
const userOrders = Filters.userOrders(userId).build();
```

### Error Handling with Result Type

Use the Result pattern for operations that can fail:

```typescript
import { withPocketBaseError, getOrNull } from '@/lib/pocketbase/errors';

// Get or null (for optional data)
const product = await getOrNull(
  () => pb.collection('products').getOne(id),
  { operation: 'getProduct', id }
);

// Result type (for operations needing error details)
const result = await withPocketBaseError(
  () => pb.collection('orders').create(data)
);

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error.message);
}
```

### Structured Logging

Use domain-specific loggers:

```typescript
import { loggers } from '@/lib/logger';

// Different domains
loggers.auth.info('User logged in', { userId: user.id });
loggers.orders.error('Order failed', error, { orderId });
loggers.products.debug('Fetched products', { count: products.length });
```

### Cart Hook (Zustand)

```typescript
import { useCart, useCartItemCount } from '@/hooks/use-cart';

function CartButton() {
  // Get specific values (optimized selectors)
  const itemCount = useCartItemCount();

  // Or get multiple values
  const { items, addItem, removeItem, subtotal } = useCart();
}
```

### Environment Variables

Environment variables are validated with Zod:

```typescript
import { getServerEnv, getClientEnv } from '@/lib/env';

// Server-side (has access to secrets)
const { SMTP_HOST, SMTP_PASS } = getServerEnv();

// Client-side (only NEXT_PUBLIC_ vars)
const { NEXT_PUBLIC_SITE_URL } = getClientEnv();
```

---

## Adding Features

### Adding a New Page

1. Create the page file:

```tsx
// src/app/(storefront)/my-page/page.tsx
export default function MyPage() {
  return <div>My Page</div>;
}
```

2. Add metadata (optional):

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Page',
  description: 'Description for SEO',
};
```

### Adding a New Component

1. Create component in appropriate directory:

```tsx
// src/components/storefront/MyComponent.tsx
interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps) {
  return <div>{title}</div>;
}
```

2. Export from index if using barrel exports.

### Adding a New API Route

```typescript
// src/app/api/my-endpoint/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello' });
}

export async function POST(request: Request) {
  const body = await request.json();
  // Process...
  return NextResponse.json({ success: true });
}
```

### Adding a New PocketBase Collection

1. Create collection in PocketBase Admin
2. Add TypeScript types:

```typescript
// src/types/pocketbase.ts
export interface MyCollection {
  id: string;
  name: string;
  created: string;
  updated: string;
}
```

3. Add query helpers:

```typescript
// src/lib/pocketbase/my-collection.ts
import { getPocketBaseClient } from './client';
import { getOrNull } from './errors';

export async function getMyItems() {
  const pb = getPocketBaseClient();
  return getOrNull(() => pb.collection('my_collection').getFullList());
}
```

4. Export from index:

```typescript
// src/lib/pocketbase/index.ts
export * from './my-collection';
```

---

## Testing

### Running Tests

```bash
npm run test           # Watch mode
npm run test:run       # Single run
npm run test:coverage  # With coverage
```

### Writing Tests

```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './utils';

describe('formatCurrency', () => {
  it('formats dollars correctly', () => {
    expect(formatCurrency(10)).toBe('$10.00');
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});
```

### Test Location

- Unit tests: `src/**/*.test.ts`
- Integration tests: `test/**/*.test.ts`

---

## Common Tasks

### Update shadcn/ui Component

```bash
npx shadcn@latest add button --overwrite
```

### Add New shadcn/ui Component

```bash
npx shadcn@latest add [component-name]
```

### Update Dependencies

```bash
npm update
npm audit fix
```

### Check for Type Errors

```bash
npm run typecheck
```

### Format Code

ESLint handles formatting. Run:

```bash
npm run lint -- --fix
```

### Database Migration

PocketBase migrations are in `pb_migrations/`. They auto-apply on startup.

To create a new migration:
1. Make changes in PocketBase Admin
2. Export: Settings → Export collections
3. Save to `pb_migrations/`

### Debug Production Build

```bash
npm run build
npm run start
```

Then check http://localhost:3000

---

## Troubleshooting

### TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf .next
rm tsconfig.tsbuildinfo
npm run typecheck
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### PocketBase Connection Issues

Check if PocketBase is running:
```bash
curl http://localhost:8090/api/health
```

### Hot Reload Not Working

Turbopack (dev mode) sometimes needs restart:
```bash
# Ctrl+C to stop, then:
npm run dev
```
