# Pasargad Prints

A modern, self-hosted e-commerce platform for 3D printed home decor products. Built with Next.js 15, PocketBase, and Docker.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![PocketBase](https://img.shields.io/badge/PocketBase-0.21-7c3aed)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## Overview

Pasargad Prints is a **100% self-hosted** single-seller e-commerce platform designed for selling custom 3D printed products. No external services required - everything runs on your local machine with Docker.

### Key Features

- **Product Catalog** - Variants for size, color, and material with dynamic pricing
- **Shopping Cart** - Persistent cart with Zustand (localStorage for guests)
- **User Accounts** - Google OAuth authentication via PocketBase
- **Order Management** - Full order lifecycle from placement to delivery
- **Admin Dashboard** - Product, order, customer, and discount management
- **Invoice Generation** - PDF invoices with jsPDF
- **Email Notifications** - Transactional emails via Nodemailer + SMTP
- **Analytics** - Privacy-focused tracking with Umami
- **Dark Mode** - System-aware theme with manual toggle
- **Password Protection** - Optional site-wide password gate

## Self-Hosted Architecture

```
                    Internet (Optional)
                           │
                  ┌────────▼────────┐
                  │ Cloudflare Tunnel│
                  └────────┬────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│                   Your Local Machine                 │
├─────────────────────────────────────────────────────┤
│                       Caddy                          │
│            (Reverse Proxy + Auto HTTPS)              │
├───────────┬───────────┬───────────┬─────────────────┤
│  Next.js  │ PocketBase│   Umami   │      Redis      │
│    App    │ (Backend) │(Analytics)│     (Cache)     │
│   :3000   │   :8090   │   :3001   │     :6379       │
└───────────┴───────────┴───────────┴─────────────────┘
```

## Tech Stack (Self-Hosted)

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15 (App Router) | React Server Components, Turbopack |
| Styling | Tailwind CSS + shadcn/ui | Utility-first with components |
| State | Zustand | Client-side cart state |
| Backend/DB | PocketBase | SQLite + Auth + File Storage + REST API |
| Auth | PocketBase OAuth2 | Google OAuth provider |
| Storage | PocketBase Files | Product images |
| Reverse Proxy | Caddy | Auto HTTPS, compression |
| Email | Nodemailer + SMTP | Gmail SMTP or self-hosted |
| PDF | jsPDF + jspdf-autotable | Invoice generation |
| Analytics | Umami | Privacy-focused, GDPR compliant |
| CAPTCHA | hCaptcha | Bot protection (free tier) |
| Rate Limiting | Redis | Distributed rate limiting |
| Tunnel | Cloudflare Tunnel | Public access without port forwarding |

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Free Cloudflare account (optional, for public access)
- Google Cloud Console project (for OAuth)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/farzahn/pasargad-prints.git
   cd pasargad-prints
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Start all services**
   ```bash
   # Development mode (local only)
   npm run docker:dev

   # With public access via Cloudflare Tunnel
   npm run docker:prod
   ```

4. **Access the services**
   - App: https://localhost
   - PocketBase Admin: https://api.localhost/_/
   - Umami Analytics: https://analytics.localhost

### First-Time Setup

1. **Configure PocketBase**
   - Open https://api.localhost/_/
   - Create admin account
   - Go to Settings → Auth Providers → Google
   - Add your Google OAuth credentials

2. **Configure Umami**
   - Open https://analytics.localhost
   - Login with `admin` / `umami`
   - Change password immediately
   - Add website and copy tracking ID

3. **Import Collections** (optional)
   - Import the schema from `pb_migrations/` if provided
   - Or create collections manually per spec.md

## Environment Variables

Create a `.env` file with the following:

```env
# PocketBase
PUBLIC_POCKETBASE_URL=https://api.localhost
POCKETBASE_ADMIN_EMAIL=your-email@example.com

# Email (Gmail SMTP - 500 emails/day free)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yoursite.com

# Umami
UMAMI_DB_PASSWORD=secure-password
UMAMI_APP_SECRET=random-32-char-secret

# hCaptcha (from dashboard.hcaptcha.com)
HCAPTCHA_SITE_KEY=
HCAPTCHA_SECRET_KEY=

# Google OAuth (from console.cloud.google.com)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Application
ADMIN_EMAIL=admin@example.com
SITE_PASSWORD=  # Leave empty to disable

# Cloudflare Tunnel (optional)
CLOUDFLARE_TUNNEL_TOKEN=
```

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
│   │   ├── email/         # Nodemailer templates
│   │   └── pdf/           # Invoice generation
│   ├── hooks/             # Custom React hooks
│   └── types/             # TypeScript definitions
├── pb_data/               # PocketBase SQLite + files
├── pb_migrations/         # Schema migrations
└── scripts/
    └── backup.sh          # Automated backup script
```

## Available Scripts

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
npm run docker:build     # Rebuild containers

# Utilities
npm run backup           # Run backup script
npm run pb:admin         # Open PocketBase admin
npm run umami:admin      # Open Umami dashboard
```

## Backup & Recovery

### Automated Backups

```bash
# Run backup manually
npm run backup

# Schedule daily backups (add to crontab)
crontab -e
# Add: 0 2 * * * /path/to/project/scripts/backup.sh
```

Backups include:
- PocketBase SQLite database
- Uploaded product images
- Umami PostgreSQL database
- Environment file (for reference)

### Restore from Backup

```bash
# Extract backup
tar -xzf backups/backup_YYYYMMDD.tar.gz -C ./restore

# Restore PocketBase
cp -r restore/pb_data/* ./pb_data/
cp -r restore/pb_public/* ./pb_public/

# Restore Umami
docker compose exec -T umami-db psql -U umami umami < restore/umami.sql
```

## Resource Requirements

| Service | RAM | CPU | Storage |
|---------|-----|-----|---------|
| Next.js App | ~512MB | 0.5 core | 500MB |
| PocketBase | ~128MB | 0.2 core | Variable |
| Redis | ~64MB | 0.1 core | 100MB |
| Umami + Postgres | ~256MB | 0.3 core | 1GB |
| Caddy | ~32MB | 0.1 core | 10MB |
| **Total** | **~1GB** | **~1.2 cores** | ~2GB+ |

Runs comfortably on any modern laptop or desktop.

## Public Access with Cloudflare Tunnel

To expose your local instance to the internet:

1. **Create Cloudflare account** (free)
2. **Install cloudflared**
   ```bash
   brew install cloudflare/cloudflare/cloudflared  # macOS
   ```
3. **Create tunnel**
   ```bash
   cloudflared tunnel login
   cloudflared tunnel create pasargad-prints
   cloudflared tunnel token pasargad-prints
   # Copy token to .env CLOUDFLARE_TUNNEL_TOKEN
   ```
4. **Configure routes** in Cloudflare Dashboard:
   - Zero Trust → Networks → Tunnels → Configure
   - Add hostnames pointing to your services
5. **Start with tunnel**
   ```bash
   npm run docker:prod
   ```

## Order Flow

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

## Configuration

### Shipping
- **USA only** - Address validation for US ZIP codes
- **Rates**: $5 flat rate, FREE on orders $50+
- **Processing**: 5-7 business days before shipping

### Payment
- Manual invoice process (no payment gateway)
- Accepted methods: Apple Pay, Zelle
- Payment due: 14 days from invoice

### Products
- **Variants**: Size, Color, Material (PLA/PETG)
- **Pricing**: Base price + variant modifiers
- **Images**: Up to 5 per product (5MB max, WebP optimized)

## Security

- **Authentication**: PocketBase OAuth2 with Google
- **Authorization**: Collection rules + admin checks
- **Rate Limiting**: Redis-backed with fallback
- **HTTPS**: Automatic via Caddy (local) or Cloudflare (public)
- **CAPTCHA**: hCaptcha on contact form
- **CSP Headers**: Strict Content Security Policy

## Contributing

This is a private project. For questions, contact the admin.

## License

Private - All rights reserved.

---

**Pasargad Prints** - Premium 3D Printed Home Decor

Self-hosted with love 🏠
