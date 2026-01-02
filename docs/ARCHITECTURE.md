# Architecture Guide

This document explains the system architecture, design decisions, and component interactions.

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Choices](#technology-choices)
3. [Application Layers](#application-layers)
4. [Data Flow](#data-flow)
5. [State Management](#state-management)
6. [Authentication](#authentication)
7. [File Structure Rationale](#file-structure-rationale)
8. [Design Decisions](#design-decisions)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
│                            │                                     │
│                   ┌────────▼────────┐                           │
│                   │ Cloudflare/CDN  │  (Optional)               │
│                   └────────┬────────┘                           │
│                            │                                     │
├────────────────────────────▼────────────────────────────────────┤
│                         Caddy                                    │
│              (Reverse Proxy + Auto HTTPS)                        │
│                            │                                     │
│          ┌─────────────────┼─────────────────┐                  │
│          │                 │                 │                   │
│          ▼                 ▼                 ▼                   │
│    ┌──────────┐     ┌──────────┐     ┌──────────┐              │
│    │ Next.js  │────▶│PocketBase│     │  Umami   │              │
│    │   App    │     │(Backend) │     │(Analytics│              │
│    │  :3000   │     │  :8090   │     │  :3001   │              │
│    └────┬─────┘     └────┬─────┘     └──────────┘              │
│         │                │                                       │
│         │           ┌────▼─────┐                                │
│         │           │  SQLite  │                                │
│         │           │ Database │                                │
│         │           └──────────┘                                │
│         │                                                        │
│    ┌────▼─────┐                                                 │
│    │  Redis   │  (Rate limiting, caching)                       │
│    │  :6379   │                                                 │
│    └──────────┘                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Service Responsibilities

| Service | Purpose | Port |
|---------|---------|------|
| **Caddy** | Reverse proxy, SSL termination, routing | 80, 443 |
| **Next.js** | Frontend + API routes, SSR | 3000 |
| **PocketBase** | Database, auth, file storage, real-time | 8090 |
| **Redis** | Rate limiting, session cache | 6379 |
| **Umami** | Privacy-focused analytics | 3001 |

---

## Technology Choices

### Why Next.js 15?

- **App Router** - Modern React patterns with Server Components
- **SSR/SSG** - Fast initial loads, SEO-friendly
- **API Routes** - Backend logic without separate server
- **Turbopack** - Fast development builds
- **Image Optimization** - Automatic responsive images

### Why PocketBase?

- **Single Binary** - No database setup required
- **Built-in Auth** - OAuth, email/password out of the box
- **File Storage** - Integrated file handling
- **Real-time** - WebSocket subscriptions
- **SQLite** - Simple, no server required
- **Admin UI** - Built-in data management

### Why Zustand?

- **Minimal Boilerplate** - Simple store creation
- **TypeScript** - First-class support
- **Persistence** - Easy localStorage integration
- **Selectors** - Efficient re-renders
- **No Providers** - No wrapper hell

### Why Tailwind + shadcn/ui?

- **Tailwind** - Utility-first, no CSS files to manage
- **shadcn/ui** - Accessible, unstyled components
- **Copy-paste** - Own the component code
- **Radix UI** - Solid accessibility foundation

---

## Application Layers

### 1. Presentation Layer

```
src/app/                    # Pages and layouts
src/components/             # React components
  ├── ui/                  # Base UI components (shadcn)
  ├── shared/              # Shared across app
  └── storefront/          # Storefront-specific
```

**Responsibilities:**
- Render UI
- Handle user interactions
- Form validation
- Route navigation

### 2. Application Layer

```
src/hooks/                  # Custom hooks
src/lib/config.ts          # Configuration
src/lib/utils.ts           # Utilities
```

**Responsibilities:**
- Business logic
- State management
- Data transformation
- Configuration access

### 3. Data Layer

```
src/lib/pocketbase/         # Database access
  ├── client.ts            # PocketBase client
  ├── auth.ts              # Authentication
  ├── products.ts          # Product queries
  ├── orders.ts            # Order queries
  ├── query-builder.ts     # Type-safe queries
  └── errors.ts            # Error handling
```

**Responsibilities:**
- Database queries
- Data fetching
- Error handling
- Type safety

### 4. Infrastructure Layer

```
docker-compose.yml          # Service orchestration
Dockerfile                  # App container
Caddyfile                   # Reverse proxy
pb_migrations/              # Database schema
```

**Responsibilities:**
- Service configuration
- Deployment
- Database migrations
- Networking

---

## Data Flow

### Server-Side Rendering (SSR)

```
┌─────────┐     ┌─────────────┐     ┌──────────┐     ┌──────────┐
│ Browser │────▶│   Next.js   │────▶│PocketBase│────▶│  SQLite  │
│         │     │   Server    │     │   API    │     │    DB    │
└─────────┘     └─────────────┘     └──────────┘     └──────────┘
     │                 │                  │                │
     │    Request      │    Fetch Data    │     Query      │
     │────────────────▶│─────────────────▶│───────────────▶│
     │                 │                  │                │
     │                 │◀─────────────────│◀───────────────│
     │                 │    Data          │    Results     │
     │◀────────────────│                  │                │
     │   HTML + Data   │                  │                │
```

### Client-Side Navigation

```
┌─────────┐     ┌─────────────┐     ┌──────────┐
│ Browser │────▶│   Next.js   │────▶│PocketBase│
│         │     │   Client    │     │   API    │
└─────────┘     └─────────────┘     └──────────┘
     │                 │                  │
     │    Navigate     │                  │
     │────────────────▶│                  │
     │                 │    Fetch JSON    │
     │                 │─────────────────▶│
     │                 │◀─────────────────│
     │                 │    Data          │
     │◀────────────────│                  │
     │   Update UI     │                  │
```

### Cart Flow (Client-Side)

```
┌──────────────────────────────────────────────────────┐
│                    Browser                            │
│  ┌────────────┐     ┌────────────┐     ┌──────────┐ │
│  │  Component │────▶│   Zustand  │────▶│localStorage│
│  │            │     │   Store    │     │           │ │
│  └────────────┘     └────────────┘     └──────────┘ │
│        ▲                  │                          │
│        │                  │                          │
│        └──────────────────┘                          │
│           Subscribe to changes                       │
└──────────────────────────────────────────────────────┘
```

---

## State Management

### Global State (Zustand)

**Cart Store** - `src/hooks/use-cart.ts`
- Persisted to localStorage
- Synced across tabs
- Optimistic updates

```typescript
interface CartState {
  items: CartItem[];
  discountCode: string | null;
  discountAmount: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, variant: string | undefined, quantity: number) => void;
  clearCart: () => void;
  applyDiscount: (code: string, amount: number) => void;
}
```

**Wishlist Store** - `src/hooks/use-wishlist.ts`
- Synced with PocketBase for logged-in users
- localStorage fallback for guests

### Server State

PocketBase data is fetched fresh on each request (SSR) or via client-side hooks.

### Local Component State

Use React's `useState` for component-specific state:
- Form inputs
- UI toggles
- Loading states

---

## Authentication

### OAuth Flow

```
┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐
│ Browser│────▶│Next.js │────▶│Pocket- │────▶│ Google │
│        │     │        │     │Base    │     │  OAuth │
└────────┘     └────────┘     └────────┘     └────────┘
    │              │              │               │
    │  Click       │              │               │
    │  "Sign In"   │              │               │
    │─────────────▶│              │               │
    │              │  Redirect    │               │
    │◀─────────────│              │               │
    │              │              │               │
    │  Redirect to Google                         │
    │────────────────────────────────────────────▶│
    │                                             │
    │◀────────────────────────────────────────────│
    │  Auth Code                                  │
    │              │              │               │
    │─────────────▶│─────────────▶│               │
    │              │  Exchange    │               │
    │              │  for Token   │               │
    │              │              │──────────────▶│
    │              │              │◀──────────────│
    │              │              │  Access Token │
    │              │◀─────────────│               │
    │◀─────────────│  Session     │               │
    │  Cookie Set  │  Created     │               │
```

### Session Management

- PocketBase handles session tokens
- Stored in HTTP-only cookies
- Auto-refresh on expiry
- Client reads user data via PocketBase SDK

### Admin Access Control

Simple email-based admin check:

```typescript
// Middleware or component check
const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
```

---

## File Structure Rationale

### Route Groups

```
src/app/
├── (admin)/      # Separate layout for admin
├── (auth)/       # Minimal layout for login
├── (gate)/       # Password protection layout
└── (storefront)/ # Main store layout
```

**Why?** Each group can have its own layout without affecting URL structure.

### Component Organization

```
src/components/
├── ui/           # Primitive components (button, input)
├── shared/       # Used everywhere (header, footer)
└── storefront/   # Domain-specific components
```

**Why?** Clear separation between generic UI and business components.

### Library Organization

```
src/lib/
├── pocketbase/   # All DB access in one place
├── config.ts     # Centralized configuration
├── constants.ts  # Magic values extracted
└── utils.ts      # Generic helpers
```

**Why?** Encapsulate external dependencies, easy to swap if needed.

---

## Design Decisions

### 1. Cents for Currency

All monetary values stored as integers (cents):

```typescript
// Store as cents
const price = 1999; // $19.99

// Display
formatCurrency(price / 100); // "$19.99"
```

**Why?** Avoids floating-point precision issues.

### 2. Single Admin Email

Admin access via email match rather than roles:

```env
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com
```

**Why?** Simple for single-seller stores. Role system available if needed.

### 3. Client-Side Cart

Cart stored in localStorage, not database:

**Why?**
- Works for guests
- Fast, no API calls
- Syncs across tabs
- Order created only at checkout

### 4. Wishlist Hybrid

- Logged in: Synced to PocketBase
- Guest: localStorage

**Why?** Best of both - guests can use wishlist, logged-in users get sync.

### 5. SQLite Database

PocketBase uses SQLite:

**Why?**
- No database server needed
- Easy backup (single file)
- Sufficient for small-medium stores
- Can migrate to PostgreSQL if needed

### 6. Server Components First

Pages are Server Components by default:

```tsx
// page.tsx (Server Component)
async function ProductPage({ params }) {
  const product = await getProduct(params.slug);
  return <ProductDetails product={product} />;
}
```

**Why?**
- Faster initial load
- Better SEO
- Reduced client JavaScript
- Direct database access

Client components only when needed (interactivity, hooks).

### 7. Zod for Validation

```typescript
const addressSchema = z.object({
  name: z.string().min(1),
  street: z.string().min(1),
  // ...
});
```

**Why?**
- Runtime type safety
- Great TypeScript inference
- Reusable schemas
- Clear error messages

### 8. Structured Logging

```typescript
loggers.orders.info('Order created', { orderId });
```

**Why?**
- Consistent format
- Domain separation
- Easy to filter in production
- JSON output for log aggregators

---

## Scaling Considerations

### Current Limits

- **SQLite**: Handles thousands of concurrent reads, single writer
- **Single server**: All services on one machine
- **Memory**: ~1GB total for all services

### When to Scale

1. **High traffic** (>100 req/s): Add caching layer
2. **Many products** (>10k): Consider search service (Meilisearch)
3. **Large files**: Use external storage (S3, Cloudflare R2)
4. **Multiple admins**: Implement proper role system

### Scaling Path

```
Single Server → Read Replicas → Microservices
     │                │               │
     │                │               │
     ▼                ▼               ▼
  SQLite        PostgreSQL       Distributed
  PocketBase    + Redis Cache    Architecture
```

The architecture is designed to be simple now but has clear upgrade paths when needed.
