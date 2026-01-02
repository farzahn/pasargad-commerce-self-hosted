# Getting Started Guide

This guide walks you through setting up your self-hosted e-commerce store from scratch. By the end, you'll have a fully functional store running on your local machine.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [First Run Setup](#first-run-setup)
5. [Google OAuth Setup](#google-oauth-setup)
6. [Adding Your First Product](#adding-your-first-product)
7. [Customization](#customization)
8. [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have:

### Required
- **Docker Desktop** (includes Docker Compose)
  - [Download for Mac](https://docs.docker.com/desktop/install/mac-install/)
  - [Download for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - [Download for Linux](https://docs.docker.com/desktop/install/linux-install/)

### Optional (for development without Docker)
- **Node.js 20+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)

### For Customer Login (Required)
- **Google Cloud account** - Free, for OAuth credentials

---

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/self-hosted-ecommerce.git
cd self-hosted-ecommerce
```

### Step 2: Copy Environment File

```bash
cp .env.example .env
```

### Step 3: Install Dependencies (Optional)

Only needed if developing without Docker:

```bash
npm install
```

---

## Configuration

Open `.env` in your editor and configure the essential settings:

### Minimal Configuration

```env
# Your store name (appears in header, emails, invoices)
STORE_NAME=My Awesome Store

# Your email (grants admin dashboard access when logged in)
NEXT_PUBLIC_ADMIN_EMAIL=yourname@gmail.com

# PocketBase API URL (keep default for local development)
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090
```

### Email Configuration (for order notifications)

```env
# Gmail example (requires App Password, not your regular password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=noreply@yourstore.com
```

> **Gmail App Password**: Go to [Google Account Security](https://myaccount.google.com/security) → 2-Step Verification → App passwords → Generate for "Mail"

### Shipping Configuration

```env
# Shipping cost in cents ($5.00)
SHIPPING_FLAT_RATE=500

# Free shipping threshold in cents ($50.00, set to 0 to disable)
FREE_SHIPPING_THRESHOLD=5000
```

---

## First Run Setup

### Step 1: Start Docker Services

```bash
npm run docker:dev
```

This starts:
- **Next.js App** at http://localhost:3000
- **PocketBase** at http://localhost:8090
- **Caddy** (reverse proxy) at https://localhost
- **Redis** (caching)
- **Umami** (analytics)

Wait for all services to be healthy (1-2 minutes on first run).

### Step 2: Create PocketBase Admin Account

1. Open **http://localhost:8090/_/** in your browser
2. You'll see the "Create Admin Account" form
3. Enter your email and a secure password
4. Click **Create and Login**

> **Important**: This is your database admin account. Keep these credentials safe!

### Step 3: Verify Database Setup

The database schema is automatically created from migrations. Verify by checking:

1. In PocketBase admin, click **Collections** in the sidebar
2. You should see: `users`, `products`, `orders`, `categories`, etc.

---

## Google OAuth Setup

Google OAuth is required for customer login. Here's how to set it up:

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name it (e.g., "My Store") and click **Create**

### Step 2: Enable OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** and click **Create**
3. Fill in:
   - **App name**: Your store name
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **Save and Continue** through remaining steps
5. Click **Publish App** (or stay in testing mode for development)

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Add authorized redirect URIs:
   - For local: `http://localhost:8090/api/oauth2-redirect`
   - For production: `https://api.yourdomain.com/api/oauth2-redirect`
5. Click **Create**
6. **Copy the Client ID and Client Secret**

### Step 4: Configure in PocketBase

1. Open PocketBase Admin: http://localhost:8090/_/
2. Go to **Settings** → **Auth providers**
3. Find **Google** and click to enable
4. Paste your **Client ID** and **Client Secret**
5. Click **Save changes**

### Step 5: Test Login

1. Visit http://localhost:3000
2. Click **Sign In**
3. Complete Google OAuth flow
4. You should be logged in!

---

## Adding Your First Product

### Step 1: Access Admin Dashboard

1. Make sure you're logged in with the email set in `NEXT_PUBLIC_ADMIN_EMAIL`
2. You'll see **Admin** link in the header dropdown
3. Click it to access the admin dashboard

### Step 2: Create a Category

1. Products need categories, but the system creates a default "General" category
2. Or create custom categories via PocketBase admin

### Step 3: Add a Product

1. In admin dashboard, click **Products** → **Add Product**
2. Fill in:
   - **Name**: Product title
   - **Description**: Product details (supports formatting)
   - **Price**: In dollars (e.g., 29.99)
   - **SKU**: Stock keeping unit (optional)
   - **Images**: Upload product photos
3. Configure variants (optional):
   - **Sizes**: e.g., Small, Medium, Large
   - **Colors**: e.g., Red, Blue, Green
4. Set **Status** to **Active** to publish
5. Click **Save**

### Step 4: View Your Product

Visit http://localhost:3000/products to see your product catalog!

---

## Customization

### Branding

1. **Logo**: Replace `public/logo.png`
2. **Store Name**: Update `STORE_NAME` in `.env`
3. **Colors**: Edit `tailwind.config.ts` for custom theme

### Order Workflow

Customize the "Processing" status name for your business:

```env
# For 3D printing business
PROCESSING_STATUS_NAME=printing

# For handmade items
PROCESSING_STATUS_NAME=crafting

# For standard retail
PROCESSING_STATUS_NAME=packing
```

### Product Variants

Default variants are Size, Color, and Options. To customize:

1. Edit `src/types/pocketbase.ts` for TypeScript types
2. Update PocketBase collection schema in admin
3. Modify product forms in admin components

### Password Protection

To password-protect your entire site:

```env
SITE_PASSWORD=your-secret-password
```

Visitors must enter this password before browsing.

---

## Next Steps

Now that your store is running:

1. **Add more products** via the admin dashboard
2. **Configure email** to send order notifications
3. **Set up analytics** with Umami
4. **Deploy to production** - See [Deployment Guide](DEPLOYMENT.md)
5. **Customize styles** - See [Development Guide](DEVELOPMENT.md)

## Troubleshooting

### Docker services won't start

```bash
# Check logs for errors
npm run docker:logs

# Rebuild containers
npm run docker:down
docker-compose build --no-cache
npm run docker:dev
```

### PocketBase admin page shows blank

Wait 30 seconds for the service to fully initialize, then refresh.

### Google OAuth redirects to wrong URL

Ensure your redirect URI in Google Cloud Console exactly matches:
- Local: `http://localhost:8090/api/oauth2-redirect`
- No trailing slash!

### Email not sending

1. Check SMTP credentials in `.env`
2. For Gmail, use an App Password (not your regular password)
3. Check spam folder
4. View logs: `npm run docker:logs app`

---

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions and share ideas
- **Documentation**: Check other guides in `/docs`
