# Self-Hosted E-Commerce Template

A modern, 100% self-hosted e-commerce template built with Next.js 15, PocketBase, and Docker. Perfect for small businesses, makers, and anyone who wants complete control over their online store.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![PocketBase](https://img.shields.io/badge/PocketBase-0.21-7c3aed)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed)
![License](https://img.shields.io/badge/License-MIT-green)

## Why This Template?

- **100% Free** - No monthly fees, no transaction fees, no vendor lock-in
- **Self-Hosted** - Run on your own hardware or any cloud provider
- **Customizable** - Adapt to any product type (physical goods, digital, services)
- **Modern Stack** - Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Simple** - Single-seller focus, no complex multi-vendor features

## Features

- **Product Catalog** - Flexible variants (size, color, or any custom option)
- **Shopping Cart** - Persistent cart with localStorage (guests) or database (logged in)
- **User Accounts** - Google OAuth authentication
- **Order Management** - Customizable order workflow
- **Admin Dashboard** - Products, orders, customers, discounts
- **Invoice Generation** - PDF invoices with jsPDF
- **Email Notifications** - Transactional emails via SMTP
- **Analytics** - Privacy-focused tracking with Umami
- **Dark Mode** - System-aware theme with manual toggle

## Architecture

```
                    Internet (Optional)
                           │
                  ┌────────▼────────┐
                  │ Cloudflare Tunnel│  (Free public access)
                  └────────┬────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│                   Your Machine                       │
├─────────────────────────────────────────────────────┤
│                       Caddy                          │
│            (Reverse Proxy + Auto HTTPS)              │
├───────────┬───────────┬───────────┬─────────────────┤
│  Next.js  │ PocketBase│   Umami   │      Redis      │
│    App    │ (Backend) │(Analytics)│     (Cache)     │
│   :3000   │   :8090   │   :3001   │     :6379       │
└───────────┴───────────┴───────────┴─────────────────┘
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Free Cloudflare account (optional, for public access)

### 1. Clone and Configure

```bash
git clone https://github.com/farzahn/pasargad-commerce-self-hosted.git
cd pasargad-commerce-self-hosted

# Copy and edit environment variables
cp .env.example .env
```

### 2. Customize Your Store

Edit `.env` with your store details:

```env
# Your store name
STORE_NAME=My Awesome Store

# Order number prefix (e.g., ORD-20250127-0001)
ORDER_PREFIX=ORD

# Admin email
ADMIN_EMAIL=you@example.com

# SMTP for emails
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Start Services

```bash
# Development (local only)
npm run docker:dev

# With public access via Cloudflare Tunnel
npm run docker:prod
```

### 4. Access Your Store

- **App**: https://localhost
- **PocketBase Admin**: https://api.localhost/_/
- **Umami Analytics**: https://analytics.localhost

## Customization Guide

### Product Variants

The template supports flexible product variants. By default, products have:

- **Sizes** - e.g., Small, Medium, Large
- **Colors** - e.g., Red, Blue, Green
- **Options** - Generic field for any other variant (material, style, etc.)

To customize variants, modify `src/types/pocketbase.ts` and update the PocketBase collection schema.

### Order Workflow

Default order flow:
```
Pending Review → Invoice Sent → Payment Received → Processing → Shipped → Delivered
```

The "Processing" status name is customizable via `PROCESSING_STATUS_NAME`:
- `printing` - for 3D printed products
- `preparing` - for made-to-order items
- `manufacturing` - for custom manufacturing
- `packing` - for standard retail

### Shipping

Configure in `.env`:
```env
SHIPPING_FLAT_RATE=500          # $5.00 in cents
FREE_SHIPPING_THRESHOLD=5000    # Free shipping at $50.00 (0 to disable)
SHIPPING_REGION=US              # For address validation
```

### Branding

1. Replace `public/logo.png` with your logo
2. Update `STORE_NAME` in `.env`
3. Customize colors in `tailwind.config.ts`

## Project Structure

```
├── docker-compose.yml     # Service orchestration
├── Dockerfile             # Next.js production build
├── Caddyfile              # Reverse proxy config
├── src/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   ├── lib/
│   │   ├── pocketbase/    # PocketBase client & helpers
│   │   ├── config.ts      # Store configuration
│   │   ├── email/         # Email templates
│   │   └── pdf/           # Invoice generation
│   ├── hooks/             # Custom React hooks
│   └── types/             # TypeScript definitions
├── pb_data/               # PocketBase SQLite + files
└── scripts/
    └── backup.sh          # Automated backup script
```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `STORE_NAME` | Your store name | My Store |
| `ADMIN_EMAIL` | Admin email address | admin@example.com |
| `SMTP_HOST` | SMTP server | smtp.gmail.com |
| `SMTP_USER` | SMTP username | you@gmail.com |
| `SMTP_PASS` | SMTP password/app password | your-app-password |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `ORDER_PREFIX` | Order number prefix | ORD |
| `CURRENCY_SYMBOL` | Currency symbol | $ |
| `SHIPPING_FLAT_RATE` | Flat rate in cents | 500 |
| `FREE_SHIPPING_THRESHOLD` | Free shipping threshold in cents | 5000 |
| `PROCESSING_STATUS_NAME` | Custom name for processing status | processing |
| `SITE_PASSWORD` | Password protect entire site | (empty = disabled) |
| `COMPOSE_PROJECT_NAME` | Docker container prefix | ecommerce |

## Scripts

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run lint             # Run ESLint

# Docker
npm run docker:dev       # Start local development stack
npm run docker:prod      # Start with Cloudflare Tunnel
npm run docker:down      # Stop all services
npm run docker:logs      # View container logs

# Utilities
npm run backup           # Run backup script
```

## Backup & Recovery

### Automated Backups

```bash
# Run manually
npm run backup

# Schedule daily (crontab)
0 2 * * * /path/to/project/scripts/backup.sh
```

Backups include:
- PocketBase SQLite database
- Uploaded product images
- Umami analytics database

### Restore

```bash
tar -xzf backups/backup_YYYYMMDD.tar.gz -C ./restore
cp -r restore/pb_data/* ./pb_data/
```

## Public Access with Cloudflare Tunnel

To expose your local store to the internet (free):

1. Create a [Cloudflare account](https://dash.cloudflare.com)
2. Install cloudflared: `brew install cloudflare/cloudflare/cloudflared`
3. Create tunnel:
   ```bash
   cloudflared tunnel login
   cloudflared tunnel create my-store
   cloudflared tunnel token my-store
   # Copy token to .env CLOUDFLARE_TUNNEL_TOKEN
   ```
4. Configure routes in Cloudflare Dashboard
5. Start with: `npm run docker:prod`

## Resource Requirements

| Service | RAM | CPU |
|---------|-----|-----|
| Next.js App | ~512MB | 0.5 core |
| PocketBase | ~128MB | 0.2 core |
| Redis | ~64MB | 0.1 core |
| Umami + Postgres | ~256MB | 0.3 core |
| Caddy | ~32MB | 0.1 core |
| **Total** | **~1GB** | **~1.2 cores** |

Runs comfortably on any modern laptop or Raspberry Pi 4.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Backend/DB | PocketBase (SQLite) |
| Auth | PocketBase OAuth2 |
| Reverse Proxy | Caddy |
| Email | Nodemailer + SMTP |
| Analytics | Umami |
| Cache | Redis |

## Contributing

Contributions welcome! Please read the contributing guidelines first.

## License

MIT License - Use freely for personal or commercial projects.

---

**Built with ❤️ for makers, small businesses, and anyone who values ownership.**
