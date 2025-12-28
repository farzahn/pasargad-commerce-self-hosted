# Pasargad Prints - E-Commerce Platform Specification

## Overview

**Project Name:** Pasargad Prints
**Type:** Single-seller e-commerce platform for 3D printed products
**Working Directory:** `/path/to/project`
**Domain:** `pasargadprints.com` (production) | `localhost:3000` (development)
**Admin:** `admin@example.com`
**Currency:** USD ($)
**Shipping Region:** USA only
**Brand Tone:** Minimal, modern, clean — no fluff
**Processing Time:** 5-7 business days before shipping
**Theme:** Light + Dark mode (user toggle)
**Emails:** Transactional only (no marketing)

---

## Product Catalog

### Product Types
- Home decor items
- Christmas ornaments
- Planters
- Other 3D printed goods

### Product Attributes

| Attribute | Description |
|-----------|-------------|
| Name | Product title |
| Description | Rich text description |
| Base Price | Starting price in USD |
| SKU | Unique product identifier |
| Images | Up to 5 images per product (shared across all variants, max 5MB each, WebP optimized) |
| Category | Primary category assignment |
| Tags | Multiple tags for filtering |
| Status | Active / Inactive |
| Featured | Boolean - show on homepage featured section |
| Badges | Optional: "New", "Sale", or none |

### Variants

Products support three variant types:

1. **Size** - Flexible naming per product:
   - Standard names: Small, Medium, Large, XL
   - Dimension-based: "4 inch", "6 inch", "8 inch"
   - Custom names as needed
2. **Color** - Varies by product (filament colors available)
3. **Material** - PLA or PETG only

**Note:** All variants share the same product images (no per-variant images).

### Pricing Model

- **Base Price:** Set per product
- **Variant Modifiers:** Add or subtract from base price
  - Example: Base $25, Large size +$5, PETG +$3 = $33

### Inventory

- **Print-on-Demand Model:** No stock tracking
- Products are always available unless manually marked inactive

### Organization

- **Categories:** Hierarchical product categorization (e.g., Home Decor > Planters)
- **Tags:** Flexible tagging system for cross-cutting filters (e.g., "minimalist", "gift", "holiday")

---

## User Experience

### Authentication

- **Provider:** Google OAuth only (via Firebase Auth)
- **Admin Detection:** Check if `email === 'admin@example.com'`

### Guest vs Authenticated

| Feature | Guest | Logged In |
|---------|-------|-----------|
| Browse products | ✅ | ✅ |
| Search & filter | ✅ | ✅ |
| View product details | ✅ | ✅ |
| Add to cart | ✅ | ✅ |
| Checkout | ❌ | ✅ |
| Order history | ❌ | ✅ |
| Saved addresses | ❌ | ✅ |
| Wishlist | ❌ | ✅ |
| Order tracking | ❌ | ✅ |

### User Account Features

1. **Order History**
   - View all past orders
   - See order status progression
   - Download invoices (PDF)
   - View tracking information

2. **Saved Addresses**
   - Add multiple shipping addresses
   - Set default address
   - Edit/delete addresses

3. **Wishlist**
   - Save products for later
   - Quick add-to-cart from wishlist
   - Share wishlist (optional, future feature)

4. **Order Tracking**
   - Real-time status updates
   - Tracking number with carrier link
   - Estimated delivery (when available)

---

## Storefront Features

### Homepage

- Hero section with featured products/promotions
- Category quick links
- **Featured products grid** (admin manually selects via `isFeatured` flag)
- Products with "New" badge highlighted
- About snippet with CTA

### Product Listing Page

- Grid/list view toggle
- **Filters:**
  - Category (single select)
  - Tags (multi-select)
  - Price range (min/max slider)
- **Search:** Full-text search on name and description
- **Sort:** Price (low/high), Newest, Name (A-Z)
- Pagination or infinite scroll

### Product Detail Page

**URL Structure:** `/products/[slug]` (e.g., `/products/modern-planter`)

- Image gallery (up to 5 images)
- Product name and description
- Base price display
- Variant selectors (Size, Color, Material)
  - **Material tooltip:** Info icon with PLA vs PETG explanation
    - PLA: Eco-friendly, ideal for indoor decor, not heat resistant
    - PETG: More durable, slightly flexible, better heat resistance
- Dynamic price calculation based on variant selection
- Add to cart button
- Add to wishlist button (if logged in)
- "New" or "Sale" badge display (if applicable)
- Related products section

### Shopping Cart

- **Persistent cart:**
  - Guests: localStorage with 7-day expiration
  - Logged-in users: Synced to Firestore
- Line items with variant details
- Quantity adjustment
- Remove items
- Subtotal calculation
- Shipping cost preview ($5 or FREE if over $50)
- Discount code input
- Proceed to checkout button

### Checkout Flow

1. **Login Gate:** Require Google login if not authenticated
2. **Shipping Address:**
   - Select from saved addresses (if available)
   - Add new address form with **Google Places autocomplete**
   - Fields: Name, Street, Apt/Suite, City, State, ZIP
   - Address validation for US addresses only
3. **Order Review:**
   - Line items summary
   - Shipping cost
   - Discount (if applied)
   - Total
4. **Place Order:**
   - Confirm order submission
   - Show confirmation page with order number
   - Send order confirmation email

---

## Order Management

### Order Flow (Manual Review)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Customer  │     │    Admin     │     │     Customer     │
│ Places Order│ ──▶ │   Reviews    │ ──▶ │ Receives Invoice │
└─────────────┘     └──────────────┘     └──────────────────┘
                           │
                           ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Delivered  │ ◀── │   Shipped    │ ◀── │ Payment Received │
└─────────────┘     └──────────────┘     └──────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Printing   │
                    └──────────────┘
```

### Order Statuses

| Status | Description | Triggers |
|--------|-------------|----------|
| `pending_review` | Order placed, awaiting admin review | Order submission |
| `invoice_sent` | Invoice emailed to customer | Admin action |
| `payment_received` | Customer has paid (admin confirms) | Admin action |
| `printing` | Item(s) being 3D printed | Admin action |
| `shipped` | Order shipped, tracking added | Admin action |
| `delivered` | Order delivered to customer | Admin action |
| `cancelled` | Order cancelled | Admin or system action |

### Order Cancellation Policy

- **Customer can cancel:** Any time before status changes to "Printing"
- **Cancellation method:** Button in order details (account page)
- **After printing begins:** No cancellation allowed

### Invoice

- **Format:** PDF
- **Delivery:** Email + downloadable from account
- **Payment Due:** 14 days from invoice date
- **Accepted Payment Methods:**
  - Apple Pay
  - Zelle
- **Contents:**
  - Invoice number
  - Order date
  - Due date (14 days from invoice)
  - Business details (Pasargad Prints)
  - Customer details
  - Line items with variants
  - Subtotal, shipping, discount, total
  - Payment instructions (Apple Pay / Zelle details - admin configurable)

---

## Shipping

### Rates

| Order Total | Shipping Cost |
|-------------|---------------|
| Under $50 | $5.00 flat rate |
| $50 or more | FREE |

### Shipping Information

- **Region:** USA only (validate ZIP code)
- **Tracking:** Manual entry by admin
- **Carrier:** Not specified (admin enters tracking URL/number)

---

## Discounts & Coupons

### Discount Types

1. **Percentage Off**
   - Example: `SAVE10` = 10% off order

2. **Fixed Amount Off**
   - Example: `SAVE5` = $5 off order

### Discount Rules

| Field | Description |
|-------|-------------|
| Code | Unique alphanumeric code |
| Type | `percentage` or `fixed` |
| Value | Percentage (0-100) or dollar amount |
| Min Order | Minimum order value to apply (optional) |
| Max Uses | Total redemption limit (optional) |
| Expiry Date | Expiration date (optional) |
| Active | Enable/disable toggle |

---

## Admin Dashboard

### Access Control

- Single admin: `admin@example.com`
- Protected routes with Firebase Auth check
- Redirect non-admin users to storefront

### Dashboard Home

- Quick stats cards:
  - Total orders (today/week/month)
  - Revenue (today/week/month)
  - Pending orders count
  - Low attention items (orders pending > 24h)
- Recent orders list
- Quick actions

### Product Management

| Feature | Description |
|---------|-------------|
| List View | Searchable, sortable table of all products |
| Create Product | Form with all product fields |
| Edit Product | Update any product attribute |
| Delete Product | Soft delete (mark inactive) or hard delete |
| Duplicate | Clone product as template for new item |
| Image Upload | Drag-drop multiple images, reorder, set primary |
| Bulk Import | CSV upload for mass product creation |
| Bulk Export | CSV download of all products |

#### CSV Import Format

```csv
name,description,base_price,sku,category,tags,sizes,colors,materials
"Modern Planter","Minimalist design...",25.00,PLT-001,Planters,"minimalist,modern","Small:0,Medium:5,Large:10","White,Black,Gray","PLA:0,PETG:3"
```

### Order Management

| Feature | Description |
|---------|-------------|
| List View | Filterable by status, searchable by order #/customer |
| Order Detail | Full order information, customer details |
| Status Update | Change status with optional notification |
| Send Invoice | Generate and email invoice PDF |
| Add Tracking | Enter tracking number and carrier |
| Add Notes | Internal admin notes on order |
| Cancel Order | Cancel with optional reason |
| Refund Note | Mark refund status (manual process) |

### Customer Management

| Feature | Description |
|---------|-------------|
| List View | All registered customers |
| Customer Detail | Profile, all orders, total spent |
| Order History | View all orders for customer |
| Admin Notes | Private notes about customer |
| Block User | Prevent user from placing orders |

### Discount Management

| Feature | Description |
|---------|-------------|
| List View | All discount codes |
| Create Code | New discount with all rules |
| Edit Code | Modify existing discount |
| Delete Code | Remove discount code |
| Usage Stats | Times used, total savings given |

### Analytics Dashboard

#### Sales Overview
- Revenue chart (daily/weekly/monthly)
- Order count chart
- Average order value
- Shipping revenue vs free shipping orders

#### Product Performance
- Best selling products
- Views per product (if tracking implemented)
- Revenue by product
- Revenue by category

#### Customer Insights
- New customers (this period)
- Returning customers
- Top customers by spend
- Customer acquisition over time

### Contact Messages

- List of all contact form submissions
- Mark as read/unread
- Reply via email (opens email client)
- Archive/delete messages

### Settings

- Store information (name, contact email)
- Shipping rates configuration
- Email templates preview
- Export all data

---

## Static Pages

### About Page
- Business story
- 3D printing process explanation
- Materials information (PLA vs PETG)
- Images/gallery

### Contact Page
- Contact form (Name, Email, Subject, Message)
- **Cloudflare Turnstile CAPTCHA** - Required before submission
- Business email display
- Social media links (if applicable)
- Form submits to Firestore + emails admin
- Rate limited (3 submissions per minute per IP)

### Shipping & Returns Page

**Shipping Policy:**
- Processing time: 5-7 business days
- Shipping: USA only
- $5 flat rate, FREE on orders $50+

**Returns Policy:**
- All sales are final (custom/made-to-order items)
- No returns or exchanges

**Damaged Items:**
- Handled case-by-case
- Customer must provide photos of damage
- Contact within 7 days of delivery
- Resolution at seller's discretion (replacement or partial refund)

**Order Cancellation:**
- Orders can be cancelled before printing begins
- Once printing starts, orders cannot be cancelled

---

## Email Notifications

### Customer Emails

| Email | Trigger | Contents |
|-------|---------|----------|
| Order Confirmation | Order placed | Order summary, next steps |
| Invoice | Admin sends invoice | PDF attachment, payment instructions |
| Shipping Notification | Status → Shipped | Tracking number, carrier link |

### Admin Emails

| Email | Trigger | Contents |
|-------|---------|----------|
| New Order Alert | Order placed (instant) | Order summary, link to dashboard |
| Contact Form | Form submitted (instant) | Message details, reply link |
| IP Blocked Alert | 5 failed password attempts | Blocked IP, timestamp, unblock time |

**Delivery:** Instant email notifications (no digest mode)

### Email Templates (Implemented)

Located in `src/lib/email/templates/`:

| Template | File | Purpose |
|----------|------|---------|
| Order Confirmation | `order-confirmation.ts` | Customer order receipt |
| Shipping Notification | `shipping-notification.ts` | Tracking info to customer |
| Admin New Order | `admin-new-order.ts` | New order alert to admin |

### Email Template Style

- **Framework:** HTML template strings (TypeScript functions)
- **Delivery:** Resend API
- **Design:** Minimal, branded
  - Site name header (black background)
  - Clean typography (system fonts)
  - Responsive tables (max-width: 600px)
  - Simple CTA buttons
- **Structure:**
  ```
  ┌─────────────────────────┐
  │   [Site Name Header]    │
  ├─────────────────────────┤
  │                         │
  │   Email Content         │
  │                         │
  │   [CTA Button]          │
  │                         │
  ├─────────────────────────┤
  │   Footer: Pasargad      │
  │   Prints                │
  └─────────────────────────┘
  ```

### System Error Emails (Admin)

| Email | Trigger |
|-------|---------|
| Email Send Failed | Resend API error |
| Order Processing Error | Database write failure |

---

## Technical Architecture

### Tech Stack (Self-Hosted - 100% Free)

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 15 (App Router) | React Server Components, Turbopack |
| Styling | Tailwind CSS + shadcn/ui | Utility-first with components |
| State | Zustand | Client-side cart state with localStorage persistence |
| Backend/DB | PocketBase | Single Go binary: SQLite DB + Auth + File Storage + REST API |
| Auth | PocketBase OAuth2 | Google OAuth provider (built-in) |
| Storage | PocketBase Files | Product images (built-in file storage) |
| Hosting | Docker Compose + Caddy | Local machine with Cloudflare Tunnel for public access |
| Email | Nodemailer + SMTP | Free with Gmail SMTP or self-hosted Mailcow |
| PDF | jsPDF + jspdf-autotable | Invoice generation |
| Address | Photon (OpenStreetMap) | Self-hosted geocoding/autocomplete |
| Analytics | Umami | Self-hosted, privacy-focused analytics |
| CAPTCHA | hCaptcha | Free tier (10k requests/month) |
| Rate Limiting | Redis (Docker) | Self-hosted, in-memory fallback |

### Self-Hosted Infrastructure Overview

```
                         Internet
                             │
                    ┌────────▼────────┐
                    │ Cloudflare Tunnel│  (Free - exposes local to web)
                    │   cloudflared    │
                    └────────┬────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      Local Machine                               │
│                    (Docker Compose)                              │
├─────────────────────────────────────────────────────────────────┤
│                          Caddy                                   │
│              (Reverse Proxy + Auto HTTPS)                        │
│                        :80/:443                                  │
├──────────┬──────────┬──────────┬──────────┬─────────────────────┤
│  Next.js │ PocketBase│  Umami  │  Redis  │  Photon (optional)  │
│   App    │ (Backend) │(Analytics)│(Cache) │   (Geocoding)       │
│  :3000   │   :8090   │  :3001  │  :6379  │      :2322          │
└──────────┴──────────┴──────────┴──────────┴─────────────────────┘
```

### Why PocketBase?

PocketBase replaces Firebase entirely with a single ~50MB Go binary:
- **Embedded SQLite** with real-time subscriptions
- **Built-in Auth** with OAuth2 (Google, GitHub, etc.)
- **Built-in File Storage** with image optimization
- **REST API** auto-generated from schema
- **Admin Dashboard** included
- **Zero dependencies** - just run the binary

### Local Hosting with Public Access

Run everything on your local machine with Cloudflare Tunnel for public access:

**Why Cloudflare Tunnel?**
- **Free** - No cost for personal use
- **No port forwarding** - Works behind NAT/firewalls
- **Automatic HTTPS** - SSL handled by Cloudflare
- **DDoS protection** - Built-in
- **Works with dynamic IP** - No need for static IP

**Requirements:**
- Local machine (Mac, Linux, Windows with WSL2)
- Docker & Docker Compose
- Free Cloudflare account
- Domain name (can use free `.pages.dev` subdomain)

### Service Migration Map

| Original Service | Self-Hosted Alternative | Notes |
|-----------------|------------------------|-------|
| Firebase Firestore | PocketBase SQLite | Embedded, real-time capable |
| Firebase Auth | PocketBase Auth | OAuth2, email/password, OTP |
| Firebase Storage | PocketBase Files | Built-in with CDN-ready URLs |
| Vercel | Docker + Caddy + Cloudflare Tunnel | Local hosting with public access |
| Resend | Nodemailer + SMTP | Gmail SMTP (500/day) or Mailcow |
| Google Places API | Photon API | OpenStreetMap-based (or use public endpoint) |
| Google Analytics | Umami | Privacy-focused, GDPR compliant |
| Cloudflare Turnstile | hCaptcha | Free tier available |
| Upstash Redis | Redis (Docker) | Self-hosted container |

### PocketBase Collections Schema

PocketBase uses SQLite with a schema defined via the Admin UI or migration files. Collections map directly to tables.

#### `products` (Collection)
```typescript
// PocketBase auto-generates: id, created, updated
{
  name: string;
  slug: string; // URL-friendly name (unique index)
  description: string; // Rich text/editor field
  basePrice: number;
  sku: string; // Unique index
  category: relation; // -> categories
  tags: json; // string[]
  images: file[]; // Up to 5 files, max 5MB each
  sizes: json; // { name: string; priceModifier: number }[]
  colors: json; // { name: string; hex?: string; priceModifier: number }[]
  materials: json; // { name: string; priceModifier: number }[]
  status: select; // 'active' | 'inactive'
  isFeatured: bool;
  badge: select; // 'new' | 'sale' | '' (empty)
}
```

#### `categories` (Collection)
```typescript
{
  name: string;
  slug: string; // Unique index
  parent: relation; // -> categories (self-referential, nullable)
  order: number;
}
```

#### `users` (Auth Collection)
```typescript
// PocketBase Auth collection - extends built-in user fields
// Built-in: id, email, emailVisibility, verified, created, updated
{
  name: string; // Display name
  avatar: file; // Profile photo
  isBlocked: bool;
  adminNotes: text;
}
```

#### `addresses` (Collection)
```typescript
// Separate collection for user addresses (one-to-many)
{
  user: relation; // -> users
  name: string;
  street: string;
  apt: string; // Optional
  city: string;
  state: string;
  zip: string;
  isDefault: bool;
}
```

#### `wishlist` (Collection)
```typescript
// Junction table for user wishlist
{
  user: relation; // -> users
  product: relation; // -> products
}
```

#### `orders` (Collection)
```typescript
{
  orderNumber: string; // PP-YYYYMMDD-XXXX (unique)
  user: relation; // -> users
  customerEmail: email;
  customerName: string;
  items: json; // Array of order line items
  shippingAddress: json; // { name, street, apt, city, state, zip }
  subtotal: number;
  shippingCost: number;
  discountCode: string;
  discountAmount: number;
  total: number;
  status: select; // 'pending_review' | 'invoice_sent' | 'payment_received' | 'printing' | 'shipped' | 'delivered' | 'cancelled'
  invoiceSentAt: date;
  paymentDueAt: date;
  tracking: json; // { carrier, number, url }
  cancelledAt: date;
  cancellationReason: text;
  adminNotes: text;
  statusHistory: json; // Array of { status, timestamp, note }
}
```

#### `discounts` (Collection)
```typescript
{
  code: string; // Uppercase, unique index
  type: select; // 'percentage' | 'fixed'
  value: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  expiresAt: date;
  isActive: bool;
}
```

#### `contact_messages` (Collection)
```typescript
{
  name: string;
  email: email;
  subject: string;
  message: text;
  isRead: bool;
  isArchived: bool;
}
```

### API Routes (Next.js)

```
/api/
├── auth/
│   └── [...nextauth]/     # NextAuth handlers (or Firebase client SDK)
├── products/
│   ├── route.ts           # GET (list), POST (create - admin)
│   └── [id]/route.ts      # GET, PUT, DELETE (admin)
├── orders/
│   ├── route.ts           # GET (user's orders), POST (create order)
│   └── [id]/
│       ├── route.ts       # GET order details
│       ├── invoice/route.ts # GET invoice PDF
│       └── status/route.ts  # PUT status update (admin)
├── cart/
│   └── route.ts           # GET, POST, PUT, DELETE cart items
├── discounts/
│   ├── route.ts           # GET (admin), POST (admin)
│   ├── [id]/route.ts      # PUT, DELETE (admin)
│   └── validate/route.ts  # POST validate code at checkout
├── site-access/
│   └── route.ts           # POST verify password, GET check status
├── turnstile/
│   └── verify/route.ts    # POST verify Cloudflare Turnstile token
├── users/
│   ├── route.ts           # GET all users (admin)
│   └── [id]/route.ts      # GET, PUT user (admin block, notes)
├── contact/
│   └── route.ts           # POST contact form
├── admin/
│   ├── analytics/route.ts # GET dashboard analytics
│   ├── import/route.ts    # POST CSV import
│   └── export/route.ts    # GET CSV export
└── email/
    ├── order-confirmation/route.ts
    ├── invoice/route.ts
    └── shipping/route.ts
```

### Folder Structure

```
/
├── app/
│   ├── (gate)/
│   │   └── password/page.tsx        # Site password entry
│   ├── (storefront)/
│   │   ├── page.tsx                 # Homepage
│   │   ├── products/
│   │   │   ├── page.tsx             # Product listing
│   │   │   └── [slug]/page.tsx      # Product detail
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── account/
│   │   │   ├── page.tsx             # Account overview
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx         # Order history
│   │   │   │   └── [id]/page.tsx    # Order detail
│   │   │   ├── addresses/page.tsx
│   │   │   └── wishlist/page.tsx
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   └── shipping-returns/page.tsx
│   ├── (admin)/
│   │   └── admin/
│   │       ├── page.tsx             # Dashboard home
│   │       ├── products/
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── orders/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── customers/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── discounts/
│   │       │   ├── page.tsx
│   │       │   └── new/page.tsx
│   │       ├── messages/page.tsx
│   │       └── analytics/page.tsx
│   ├── api/
│   │   └── ... (see API routes above)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── storefront/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── VariantSelector.tsx
│   │   └── ...
│   ├── admin/
│   │   ├── Sidebar.tsx
│   │   ├── DataTable.tsx
│   │   ├── StatsCard.tsx
│   │   ├── OrderStatusBadge.tsx
│   │   └── ...
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── EmptyState.tsx
│       └── ...
├── lib/
│   ├── pocketbase/
│   │   ├── client.ts          # PocketBase SDK client
│   │   ├── auth.ts            # Auth helpers
│   │   ├── collections.ts     # Type-safe collection access
│   │   └── files.ts           # File upload/download helpers
│   ├── email/
│   │   ├── nodemailer.ts      # Nodemailer SMTP config
│   │   └── templates/
│   ├── pdf/
│   │   └── invoice.ts
│   ├── redis/
│   │   └── client.ts          # Redis rate limiting
│   ├── utils.ts
│   └── constants.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useProducts.ts
│   └── ...
├── types/
│   └── index.ts
├── public/
│   ├── logo.png
│   └── ...
└── next.config.js
```

### Environment Variables

```env
# PocketBase
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090  # or https://api.pasargadprints.com
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=  # Set during initial setup

# Email (Nodemailer + SMTP)
SMTP_HOST=smtp.gmail.com  # or your SMTP server
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=  # Gmail App Password or SMTP password
SMTP_FROM=noreply@pasargadprints.com

# Photon Geocoding (Self-hosted OpenStreetMap)
NEXT_PUBLIC_PHOTON_URL=http://localhost:2322  # or https://photon.komoot.io (public)

# Umami Analytics (Self-hosted)
NEXT_PUBLIC_UMAMI_URL=http://localhost:3001
NEXT_PUBLIC_UMAMI_WEBSITE_ID=  # Get from Umami dashboard

# hCaptcha
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=
HCAPTCHA_SECRET_KEY=

# Redis (Self-hosted)
REDIS_URL=redis://localhost:6379

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or https://pasargadprints.com
ADMIN_EMAIL=admin@example.com

# Site Password Protection (Optional)
SITE_PASSWORD=  # Set to enable password gate, leave empty to disable

# Google OAuth (for PocketBase)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Design System

### Brand

- **Name:** Pasargad Prints
- **Logo:** Provided (`company-logo.png`)
- **Colors:** Extract from logo (primary, secondary, accent)
- **Typography:** System fonts or Google Fonts (clean, modern)

### Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |

### Component Library

Using **shadcn/ui** components:
- Button, Input, Select, Checkbox
- Card, Badge, Avatar
- Dialog, Sheet, Dropdown Menu
- Table, Tabs, Accordion
- Toast notifications
- Form with validation (react-hook-form + zod)

### Loading & Error States

- **Loading:** Skeleton loaders (gray placeholder shapes)
- **Errors:** Toast notifications for user-facing errors
- **Admin Alerts:** Email notifications for system errors (failed emails, etc.)

### Dark Mode

- Light and dark theme support
- Theme toggle in header/footer
- Respects `prefers-color-scheme` on first visit
- Persists user preference in localStorage

---

## Analytics

### Umami (Self-Hosted)

- **Privacy-focused** - no cookies, GDPR compliant
- Track page views, add-to-cart, checkout events
- Custom event tracking for e-commerce
- Self-hosted on the same server as the app
- Environment variables: `NEXT_PUBLIC_UMAMI_URL`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID`

```typescript
// Example: Track custom events
umami.track('add_to_cart', { productId: 'xxx', price: 25.00 });
umami.track('checkout', { total: 55.00, items: 3 });
```

---

## Security Considerations

1. **Authentication:** PocketBase handles OAuth2 securely (Google, GitHub, etc.)
2. **Authorization:** PocketBase collection rules + server-side admin checks
3. **Data Validation:** Zod schemas for all API inputs + PocketBase field validation
4. **File Uploads:** PocketBase validates file types, size limits (5MB per image)
5. **Rate Limiting:** Redis for distributed rate limiting (falls back to in-memory)
6. **CORS:** Configure PocketBase allowed origins for production domain only
7. **Environment Variables:** Never expose server secrets to client
8. **Site-Wide Password Protection:** Optional password gate for entire site
9. **Content Security Policy (CSP):** Strict CSP headers via Next.js middleware
10. **CAPTCHA:** hCaptcha on contact form to prevent spam
11. **HTTPS:** Coolify auto-provisions Let's Encrypt SSL certificates

### Site Password Protection

Optional feature to require a password before accessing any page on the site.

| Feature | Description |
|---------|-------------|
| Password Gate | Users must enter password at `/password` before accessing site |
| Cookie-Based Auth | 30-day `site-access` cookie set on successful login |
| IP Tracking | Failed attempts tracked per IP (Upstash Redis or in-memory) |
| Auto-Block | IP blocked for 24 hours after 5 failed attempts |
| Admin Notification | Email sent to admin when IP is blocked |
| Enable/Disable | Set `SITE_PASSWORD` env var to enable, leave empty to disable |

**Flow:**
```
User visits any page → Middleware checks cookie →
  ├─ Cookie valid → Allow access
  └─ Cookie missing/invalid → Redirect to /password
      └─ Enter password →
          ├─ Correct → Set cookie, redirect to homepage
          └─ Wrong → Track attempt, show error with remaining attempts
              └─ 5 failures → Block IP, notify admin
```

### PocketBase Collection Rules

PocketBase uses filter-based rules defined per collection in the Admin UI. Rules use a simple expression syntax.

```javascript
// Collection: products
{
  listRule: "",           // Public read (empty = allow all)
  viewRule: "",           // Public read
  createRule: "@request.auth.email = 'admin@example.com'",  // Admin only
  updateRule: "@request.auth.email = 'admin@example.com'",  // Admin only
  deleteRule: "@request.auth.email = 'admin@example.com'"   // Admin only
}

// Collection: categories
{
  listRule: "",           // Public read
  viewRule: "",           // Public read
  createRule: "@request.auth.email = 'admin@example.com'",
  updateRule: "@request.auth.email = 'admin@example.com'",
  deleteRule: "@request.auth.email = 'admin@example.com'"
}

// Collection: users (Auth Collection)
{
  listRule: "@request.auth.email = 'admin@example.com'",    // Admin only
  viewRule: "@request.auth.id = id || @request.auth.email = 'admin@example.com'",
  createRule: "",         // Handled by OAuth
  updateRule: "@request.auth.id = id || @request.auth.email = 'admin@example.com'",
  deleteRule: "@request.auth.email = 'admin@example.com'"
}

// Collection: addresses
{
  listRule: "@request.auth.id = user || @request.auth.email = 'admin@example.com'",
  viewRule: "@request.auth.id = user || @request.auth.email = 'admin@example.com'",
  createRule: "@request.auth.id != ''",   // Any authenticated user
  updateRule: "@request.auth.id = user",  // Owner only
  deleteRule: "@request.auth.id = user"   // Owner only
}

// Collection: orders
{
  listRule: "@request.auth.id = user || @request.auth.email = 'admin@example.com'",
  viewRule: "@request.auth.id = user || @request.auth.email = 'admin@example.com'",
  createRule: "@request.auth.id != '' && @request.auth.id = @request.data.user",
  updateRule: "@request.auth.email = 'admin@example.com'",  // Admin only
  deleteRule: "@request.auth.email = 'admin@example.com'"   // Admin only
}

// Collection: discounts
{
  listRule: "@request.auth.email = 'admin@example.com'",    // Admin only
  viewRule: "isActive = true",  // Active discounts viewable for validation
  createRule: "@request.auth.email = 'admin@example.com'",
  updateRule: "@request.auth.email = 'admin@example.com'",
  deleteRule: "@request.auth.email = 'admin@example.com'"
}

// Collection: contact_messages
{
  listRule: "@request.auth.email = 'admin@example.com'",    // Admin only
  viewRule: "@request.auth.email = 'admin@example.com'",    // Admin only
  createRule: "",         // Public create (contact form)
  updateRule: "@request.auth.email = 'admin@example.com'",
  deleteRule: "@request.auth.email = 'admin@example.com'"
}
```

### PocketBase File Storage

PocketBase handles file storage automatically for `file` type fields:
- Files are stored in `pb_data/storage/` directory
- Automatic thumbnail generation for images
- Configurable max file size per field (5MB for product images)
- MIME type validation built-in
- Served via PocketBase's built-in static file server

---

## Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Cumulative Layout Shift | < 0.1 |

### Optimization Strategies

- Next.js Image optimization
- Static generation for product pages
- Incremental Static Regeneration
- Lazy loading for images below fold
- Code splitting by route

---

## Future Considerations (Out of Scope)

- Multiple payment processors
- Multi-currency support
- International shipping
- Product reviews
- Social media integration
- Email marketing (newsletters)
- Inventory management
- Multiple admin users

---

## Self-Hosted Deployment (Local Machine)

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Caddy Reverse Proxy (handles HTTPS locally)
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - app
      - pocketbase
      - umami
    restart: unless-stopped

  # Next.js Application
  app:
    build: .
    expose:
      - "3000"
    environment:
      - NEXT_PUBLIC_POCKETBASE_URL=${PUBLIC_POCKETBASE_URL}
      - NEXT_PUBLIC_UMAMI_URL=${PUBLIC_UMAMI_URL}
      - NEXT_PUBLIC_PHOTON_URL=https://photon.komoot.io  # Use public API
      - REDIS_URL=redis://redis:6379
    depends_on:
      - pocketbase
      - redis
    restart: unless-stopped

  # PocketBase (Database + Auth + Storage)
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    expose:
      - "8090"
    volumes:
      - ./pb_data:/pb_data
      - ./pb_public:/pb_public
    restart: unless-stopped
    command: serve --http=0.0.0.0:8090

  # Redis (Rate Limiting & Caching)
  redis:
    image: redis:7-alpine
    expose:
      - "6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Umami Analytics
  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    expose:
      - "3000"
    environment:
      DATABASE_URL: postgresql://umami:${UMAMI_DB_PASSWORD}@umami-db:5432/umami
      DATABASE_TYPE: postgresql
      APP_SECRET: ${UMAMI_APP_SECRET}
    depends_on:
      - umami-db
    restart: unless-stopped

  umami-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: ${UMAMI_DB_PASSWORD}
    volumes:
      - umami_db_data:/var/lib/postgresql/data
    restart: unless-stopped

  # Cloudflare Tunnel (exposes local services to internet)
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    restart: unless-stopped
    depends_on:
      - caddy

volumes:
  caddy_data:
  caddy_config:
  redis_data:
  umami_db_data:
```

### Caddyfile (Reverse Proxy Config)

```Caddyfile
# Caddyfile
{
  # For local development, use internal TLS
  local_certs
}

# Main app
:443 {
  reverse_proxy app:3000
}

# PocketBase API
api.localhost:443 {
  reverse_proxy pocketbase:8090
}

# Umami Analytics
analytics.localhost:443 {
  reverse_proxy umami:3000
}
```

### Local Deployment Steps

#### 1. Install Prerequisites

```bash
# macOS
brew install docker docker-compose

# Ubuntu/Debian
sudo apt update && sudo apt install docker.io docker-compose-v2

# Start Docker
sudo systemctl start docker  # Linux
# Docker Desktop handles this on macOS
```

#### 2. Clone and Configure

```bash
# Create project directory
mkdir pasargad-prints && cd pasargad-prints

# Create .env file
cat > .env << 'EOF'
# Public URLs (update after setting up Cloudflare Tunnel)
PUBLIC_POCKETBASE_URL=https://api.yourdomain.com
PUBLIC_UMAMI_URL=https://analytics.yourdomain.com

# Umami
UMAMI_DB_PASSWORD=your-secure-password-here
UMAMI_APP_SECRET=your-random-secret-here

# Cloudflare Tunnel (get from dashboard)
CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token
EOF
```

#### 3. Set Up Cloudflare Tunnel (Free)

1. **Create Cloudflare Account** (free)
   - Go to https://dash.cloudflare.com
   - Add your domain (or use free `*.pages.dev` subdomain)

2. **Create Tunnel**
   ```bash
   # Install cloudflared CLI
   brew install cloudflare/cloudflare/cloudflared  # macOS
   # or download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation

   # Login to Cloudflare
   cloudflared tunnel login

   # Create tunnel
   cloudflared tunnel create pasargad-prints

   # Get tunnel token (copy this to .env)
   cloudflared tunnel token pasargad-prints
   ```

3. **Configure Tunnel Routes** (in Cloudflare Dashboard)
   - Go to Zero Trust → Networks → Tunnels
   - Select your tunnel → Configure
   - Add public hostnames:
     | Subdomain | Service |
     |-----------|---------|
     | `@` or `www` | `http://caddy:443` |
     | `api` | `http://pocketbase:8090` |
     | `analytics` | `http://umami:3000` |

#### 4. Start Services

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f

# Check status
docker compose ps
```

#### 5. Initial Configuration

**PocketBase Setup:**
```bash
# Access admin UI (first time creates admin account)
open https://api.yourdomain.com/_/

# Or locally: https://api.localhost/_/
```

**Umami Setup:**
```bash
# Default login: admin / umami
open https://analytics.yourdomain.com

# Change password immediately!
# Add website and copy tracking ID
```

### Development Mode (No Tunnel)

For local development without public access:

```bash
# Start without cloudflared
docker compose up -d caddy app pocketbase redis umami umami-db

# Access locally:
# App: https://localhost
# PocketBase: https://api.localhost/_/
# Umami: https://analytics.localhost
```

### Backup Strategy

```bash
#!/bin/bash
# backup.sh - Run daily via cron

BACKUP_DIR="./backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup PocketBase (SQLite + uploaded files)
cp -r ./pb_data $BACKUP_DIR/pb_data
cp -r ./pb_public $BACKUP_DIR/pb_public

# Backup Umami PostgreSQL
docker compose exec -T umami-db pg_dump -U umami umami > $BACKUP_DIR/umami.sql

# Compress
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

# Keep last 30 days
find ./backups -name "*.tar.gz" -mtime +30 -delete

echo "Backup complete: $BACKUP_DIR.tar.gz"
```

```bash
# Add to crontab for daily backups at 2 AM
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### Estimated Resource Usage

| Service | RAM | CPU | Notes |
|---------|-----|-----|-------|
| Next.js App | ~512MB | 0.5 core | Production build |
| PocketBase | ~128MB | 0.2 core | Very lightweight |
| Redis | ~64MB | 0.1 core | Minimal usage |
| Umami + Postgres | ~256MB | 0.3 core | Analytics |
| Caddy | ~32MB | 0.1 core | Reverse proxy |
| Cloudflared | ~64MB | 0.1 core | Tunnel |
| **Total** | **~1GB** | **~1.3 cores** | |

*Runs comfortably on any modern laptop or desktop*

### Keeping Services Running

**macOS (launchd):**
```bash
# Create launch agent to start on boot
cat > ~/Library/LaunchAgents/com.pasargad.docker.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.pasargad.docker</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/docker</string>
        <string>compose</string>
        <string>-f</string>
        <string>/path/to/pasargad-prints/docker-compose.yml</string>
        <string>up</string>
        <string>-d</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
EOF

launchctl load ~/Library/LaunchAgents/com.pasargad.docker.plist
```

**Linux (systemd):**
```bash
# Create systemd service
sudo cat > /etc/systemd/system/pasargad.service << 'EOF'
[Unit]
Description=Pasargad Prints
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/pasargad-prints
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable pasargad
sudo systemctl start pasargad
```

---

## Appendix

### Order Number Format

`PP-YYYYMMDD-XXXX`

- `PP` - Pasargad Prints prefix
- `YYYYMMDD` - Date
- `XXXX` - Sequential number (reset daily or continuous)

Example: `PP-20250127-0001`

### Status Color Coding

| Status | Color | Hex |
|--------|-------|-----|
| Pending Review | Yellow | `#EAB308` |
| Invoice Sent | Blue | `#3B82F6` |
| Payment Received | Cyan | `#06B6D4` |
| Printing | Purple | `#8B5CF6` |
| Shipped | Orange | `#F97316` |
| Delivered | Green | `#22C55E` |
| Cancelled | Red | `#EF4444` |
