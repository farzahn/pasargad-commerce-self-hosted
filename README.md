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

| Feature | Description |
|---------|-------------|
| **Product Catalog** | Flexible variants (size, color, or any custom option) |
| **Shopping Cart** | Persistent cart with localStorage (guests) or database (logged in) |
| **User Accounts** | Google OAuth authentication |
| **Order Management** | Customizable order workflow with status tracking |
| **Admin Dashboard** | Manage products, orders, customers, and discounts |
| **Invoice Generation** | PDF invoices with jsPDF |
| **Email Notifications** | Transactional emails via SMTP |
| **Analytics** | Privacy-focused tracking with Umami |
| **Dark Mode** | System-aware theme with manual toggle |
| **Wishlist** | Save products for later |
| **Discount Codes** | Percentage and fixed-amount discounts |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development without Docker)
- Google OAuth credentials (for customer login)

### 1. Clone and Configure

```bash
git clone https://github.com/yourusername/self-hosted-ecommerce.git
cd self-hosted-ecommerce

# Copy environment template
cp .env.example .env
```

### 2. Edit Environment Variables

Open `.env` and set your store details:

```env
STORE_NAME=My Awesome Store
NEXT_PUBLIC_ADMIN_EMAIL=you@gmail.com
```

### 3. Start Services

```bash
# Start all services with Docker
npm run docker:dev

# Or for development without Docker:
npm install
npm run dev
```

### 4. Initial Setup

1. Open **http://localhost:8090/_/** to create a PocketBase admin account
2. Configure Google OAuth in PocketBase: Settings → Auth providers → Google
3. Visit **http://localhost:3000** to see your store

For detailed setup instructions, see [Getting Started Guide](docs/GETTING_STARTED.md).

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/GETTING_STARTED.md) | First-time setup guide with step-by-step instructions |
| [Development Guide](docs/DEVELOPMENT.md) | Code structure, conventions, and development workflow |
| [Deployment Guide](docs/DEPLOYMENT.md) | Production deployment options (Docker, Coolify, VPS) |
| [API Reference](docs/API.md) | API routes, PocketBase integration, and data models |
| [Architecture](docs/ARCHITECTURE.md) | System design, component structure, and decisions |

## Architecture Overview

```
                         Internet
                            │
                   ┌────────▼────────┐
                   │ Cloudflare Edge │  (SSL/CDN/DDoS Protection)
                   └────────┬────────┘
                            │
                   ┌────────▼────────┐
                   │ Cloudflare Tunnel│  (cloudflared)
                   └────────┬────────┘
                            │
┌───────────────────────────▼───────────────────────────┐
│                    Your Machine                        │
├────────────┬────────────┬────────────┬───────────────┤
│  Next.js   │ PocketBase │   Umami    │     Redis     │
│    App     │ (Backend)  │ (Analytics)│    (Cache)    │
│   :3000    │   :8090    │   :3001    │    :6379      │
└────────────┴────────────┴────────────┴───────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15 (App Router) | React framework with SSR/SSG |
| Styling | Tailwind CSS + shadcn/ui | Utility-first CSS + accessible components |
| State | Zustand | Client-side state management |
| Backend/DB | PocketBase (SQLite) | Database, auth, file storage |
| Reverse Proxy | Cloudflare Tunnel | SSL termination, routing, DDoS protection |
| Email | Nodemailer + SMTP | Transactional emails |
| Analytics | Umami | Privacy-focused analytics |
| Cache | Redis | Rate limiting, session cache |

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/           # Admin dashboard pages
│   │   ├── (auth)/            # Login/auth pages
│   │   ├── (storefront)/      # Customer-facing pages
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── shared/            # Reusable components
│   │   ├── storefront/        # Storefront-specific
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and helpers
│   │   ├── pocketbase/        # PocketBase client & queries
│   │   ├── config.ts          # Store configuration
│   │   ├── constants.ts       # App constants
│   │   ├── env.ts             # Environment validation
│   │   └── logger.ts          # Structured logging
│   └── types/                 # TypeScript definitions
├── pb_migrations/             # PocketBase schema migrations
├── docs/                      # Documentation
├── docker-compose.yml         # Production deployment
├── docker-compose.local.yml   # Local development
└── cloudflared/               # Cloudflare Tunnel config
    └── config.yml             # Ingress routing rules
```

## Scripts

```bash
# Development
npm run dev              # Start Next.js dev server (Turbopack)
npm run build            # Build for production
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript compiler
npm run test             # Run Vitest tests

# Docker
npm run docker:dev       # Start local development stack
npm run docker:prod      # Start with Cloudflare Tunnel
npm run docker:down      # Stop all services
npm run docker:logs      # View container logs

# Utilities
npm run pb:admin         # Open PocketBase admin panel
npm run backup           # Run backup script
```

## Environment Variables

See [.env.example](.env.example) for all available options.

### Essential Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `STORE_NAME` | Your store name | Yes |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Admin email (gets dashboard access) | Yes |
| `NEXT_PUBLIC_POCKETBASE_URL` | PocketBase API URL | Yes |

### Email Configuration

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server (e.g., smtp.gmail.com) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password/app password |

## Resource Requirements

| Service | RAM | CPU |
|---------|-----|-----|
| Next.js App | ~512MB | 0.5 core |
| PocketBase | ~128MB | 0.2 core |
| Redis | ~64MB | 0.1 core |
| Umami + Postgres | ~256MB | 0.3 core |
| Cloudflared | ~32MB | 0.1 core |
| **Total** | **~1GB** | **~1.2 cores** |

Runs comfortably on a Raspberry Pi 4 or any modern VPS.

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - Use freely for personal or commercial projects.

---

**Built with care for makers, small businesses, and anyone who values ownership.**
