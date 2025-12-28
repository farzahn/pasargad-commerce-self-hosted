# Pasargad Prints

A modern e-commerce platform for 3D printed home decor products. Built with Next.js 16, Firebase, and Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Firebase](https://img.shields.io/badge/Firebase-11.1-orange)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## Overview

Pasargad Prints is a single-seller e-commerce platform designed for selling custom 3D printed products. It features a clean, minimal design with full admin dashboard, order management, and invoice generation capabilities.

### Key Features

- **Product Catalog** - Variants for size, color, and material with dynamic pricing
- **Shopping Cart** - Persistent cart with Zustand (localStorage for guests)
- **User Accounts** - Google OAuth authentication via Firebase
- **Order Management** - Full order lifecycle from placement to delivery
- **Admin Dashboard** - Product, order, customer, and discount management
- **Invoice Generation** - PDF invoices with jsPDF
- **Email Notifications** - Transactional emails via Resend
- **Dark Mode** - System-aware theme with manual toggle
- **Password Protection** - Optional site-wide password gate

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (Google OAuth) |
| Storage | Firebase Storage |
| Email | Resend |
| PDF | jsPDF + jspdf-autotable |
| Rate Limiting | Upstash Redis |
| CAPTCHA | Cloudflare Turnstile |
| Analytics | Google Analytics 4 |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project
- Resend account (for emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/farzahn/pasargad-prints.git
   cd pasargad-prints
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your credentials (see [Environment Variables](#environment-variables) below).

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000)

### Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** with Google provider
3. Create a **Firestore Database**
4. Enable **Storage** for product images
5. Generate a service account key for admin SDK
6. Copy credentials to `.env.local`

### Firestore Security Rules

Deploy these security rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.token.email == 'YOUR_ADMIN_EMAIL';
    }

    // Products & Categories: Public read, admin write
    match /products/{doc} { allow read: if true; allow write: if isAdmin(); }
    match /categories/{doc} { allow read: if true; allow write: if isAdmin(); }

    // Users: Own data or admin
    match /users/{userId} {
      allow read: if isAdmin() || request.auth.uid == userId;
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId || isAdmin();
    }

    // Orders: Own orders or admin
    match /orders/{doc} {
      allow read: if isAdmin() || resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if isAdmin();
    }

    // Admin only
    match /discounts/{doc} { allow read, write: if isAdmin(); }

    // Contact: Public create, admin read
    match /contactMessages/{doc} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }
  }
}
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Secret)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Email (Resend)
RESEND_API_KEY=

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Google Services (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Upstash Redis (Optional - falls back to in-memory)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=your-email@example.com

# Site Password Protection (Optional)
SITE_PASSWORD=
```

## Project Structure

```
src/
├── app/
│   ├── (gate)/              # Password protection
│   │   └── password/
│   ├── (storefront)/        # Public pages
│   │   ├── page.tsx         # Homepage
│   │   ├── products/        # Product listing & detail
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── account/         # User account pages
│   │   ├── about/
│   │   ├── contact/
│   │   └── shipping-returns/
│   ├── (admin)/             # Admin dashboard
│   │   └── admin/
│   │       ├── page.tsx     # Dashboard home
│   │       ├── products/
│   │       ├── orders/
│   │       ├── customers/
│   │       ├── discounts/
│   │       ├── messages/
│   │       └── analytics/
│   └── api/                 # API routes
│       ├── email/
│       ├── site-access/
│       └── turnstile/
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── storefront/          # Store components
│   ├── admin/               # Admin components
│   └── shared/              # Shared components
├── hooks/                   # Custom React hooks
├── lib/
│   ├── firebase/            # Firebase configuration
│   ├── email/               # Email templates
│   ├── pdf/                 # Invoice generation
│   └── api/                 # API utilities
└── types/                   # TypeScript types
```

## Features

### Storefront

- **Homepage** - Hero, featured products, category links
- **Product Listing** - Filter by category, tags, price; search; sort
- **Product Detail** - Image gallery, variant selection, dynamic pricing
- **Shopping Cart** - Add/remove items, quantity adjustment, discount codes
- **Checkout** - Address selection, order review, confirmation
- **User Account** - Order history, saved addresses, wishlist

### Admin Dashboard

- **Dashboard** - Quick stats, recent orders, pending actions
- **Products** - CRUD operations, image upload, variant management
- **Orders** - Status management, invoice generation, tracking
- **Customers** - View profiles, order history, admin notes
- **Discounts** - Create percentage or fixed amount codes
- **Messages** - View and manage contact form submissions
- **Analytics** - Sales charts, top products, customer insights

### Order Flow

```
Customer Places Order
        ↓
   Pending Review ──→ Admin Reviews
        ↓
   Invoice Sent ──→ Customer Pays (Apple Pay / Zelle)
        ↓
  Payment Received
        ↓
     Printing
        ↓
     Shipped ──→ Tracking Added
        ↓
    Delivered
```

### Security Features

- **Authentication** - Google OAuth via Firebase
- **Authorization** - Admin-only routes protected server-side
- **Rate Limiting** - Upstash Redis (with in-memory fallback)
- **CAPTCHA** - Cloudflare Turnstile on contact form
- **CSP Headers** - Strict Content Security Policy
- **Password Protection** - Optional site-wide password gate with IP blocking

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Other Platforms

The project can be deployed to any platform supporting Next.js:
- AWS Amplify
- Netlify
- Railway
- Self-hosted with `npm run build && npm run start`

## Configuration

### Shipping

- **USA only** - Address validation for US ZIP codes
- **Rates**: $5 flat rate, FREE on orders $50+
- **Processing**: 5-7 business days before shipping

### Payment

- Manual invoice process (no payment gateway integration)
- Accepted methods: Apple Pay, Zelle
- Payment due: 14 days from invoice

### Products

- **Variants**: Size, Color, Material (PLA/PETG)
- **Pricing**: Base price + variant modifiers
- **Images**: Up to 5 per product (5MB max, WebP optimized)
- **Inventory**: Print-on-demand (no stock tracking)

## Contributing

This is a private project. For any questions, contact the admin.

## License

Private - All rights reserved.

---

**Pasargad Prints** - Premium 3D Printed Home Decor

Made with care in the USA
