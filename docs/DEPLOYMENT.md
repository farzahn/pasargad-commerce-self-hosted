# Deployment Guide

This guide covers deploying your self-hosted e-commerce store to production environments using Cloudflare Tunnel as the primary reverse proxy.

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Cloudflare Tunnel Setup (Recommended)](#cloudflare-tunnel-setup-recommended)
3. [Local Network Deployment](#local-network-deployment)
4. [Coolify Deployment](#coolify-deployment)
5. [VPS Deployment](#vps-deployment)
6. [Production Checklist](#production-checklist)
7. [Backup & Recovery](#backup--recovery)
8. [Monitoring](#monitoring)

---

## Deployment Options

| Option | Cost | Complexity | Best For |
|--------|------|------------|----------|
| Cloudflare Tunnel | Free | Low | Public access from anywhere |
| Local Network | Free | Low | Home/office use only |
| Coolify | $4-20/mo VPS | Low | Self-hosted PaaS |
| VPS + Tunnel | $4-20/mo | Medium | Full control + public access |

---

## Cloudflare Tunnel Setup (Recommended)

Cloudflare Tunnel is the primary reverse proxy for this project. It provides:
- **Free SSL certificates** at Cloudflare's edge
- **DDoS protection** included
- **No port forwarding** required
- **Works behind NAT/firewalls**

### Prerequisites

- Free Cloudflare account
- Domain added to Cloudflare (free plan works)

### Step 1: Install cloudflared

```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# Windows
# Download from https://github.com/cloudflare/cloudflared/releases
```

### Step 2: Authenticate

```bash
cloudflared tunnel login
```

This opens a browser to authenticate with Cloudflare.

### Step 3: Create Tunnel

```bash
cloudflared tunnel create my-store
```

This creates a tunnel and outputs credentials. Note the tunnel ID.

### Step 4: Get Tunnel Token

```bash
cloudflared tunnel token my-store
```

Copy the token for your `.env` file.

### Step 5: Configure DNS Routes

Route your subdomains to the tunnel:

```bash
# Main storefront
cloudflared tunnel route dns my-store shop.yourdomain.com

# PocketBase API
cloudflared tunnel route dns my-store api.yourdomain.com

# Analytics dashboard
cloudflared tunnel route dns my-store analytics.yourdomain.com
```

### Step 6: Update Configuration

1. Update `.env`:

```env
CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token-here

# Update URLs to your domain
NEXT_PUBLIC_POCKETBASE_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://shop.yourdomain.com
PUBLIC_UMAMI_URL=https://analytics.yourdomain.com
```

2. Update `cloudflared/config.yml` with your domain:

```yaml
ingress:
  - hostname: api.yourdomain.com
    service: http://pocketbase:8090
  - hostname: analytics.yourdomain.com
    service: http://umami:3000
  - hostname: shop.yourdomain.com
    service: http://app:3000
  - hostname: yourdomain.com
    service: http://app:3000
  - service: http_status:404
```

### Step 7: Start Services

```bash
# Local development
npm run docker:dev

# Or production
docker compose up -d
```

Your store is now publicly accessible at your domain!

---

## Local Network Deployment

Run the store on your local network for home or office use (without public internet access).

### Step 1: Start Services (without tunnel)

```bash
# Start services without cloudflared
docker compose up app pocketbase redis umami umami-db -d
```

### Step 2: Find Your Local IP

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr /i "IPv4"
```

### Step 3: Access from Other Devices

Other devices on your network can access:
- **Store**: `http://YOUR_LOCAL_IP:3000`
- **PocketBase**: `http://YOUR_LOCAL_IP:8090`

### Step 4: Configure for Local Network

Update `.env`:

```env
NEXT_PUBLIC_POCKETBASE_URL=http://YOUR_LOCAL_IP:8090
NEXT_PUBLIC_SITE_URL=http://YOUR_LOCAL_IP:3000
```

Rebuild:
```bash
docker compose down
docker compose up app pocketbase redis umami umami-db -d
```

> **Note**: For public internet access, use Cloudflare Tunnel instead.

---

## Coolify Deployment

[Coolify](https://coolify.io) is a self-hosted Heroku/Vercel alternative.

### Step 1: Set Up Coolify

1. Get a VPS (DigitalOcean, Hetzner, etc.)
2. Install Coolify:
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```
3. Access Coolify at `http://YOUR_VPS_IP:8000`

### Step 2: Add Your Server

In Coolify dashboard:
1. Go to **Servers** → **Add Server**
2. Add your VPS or use the local server

### Step 3: Create Project

1. Create a new project
2. Add environment (production)

### Step 4: Deploy Services

The project uses `docker-compose.yml` configured for Coolify:

1. **Add Application** → **Docker Compose**
2. Connect your Git repository
3. Select `docker-compose.yml`
4. Configure domains:
   - App: `shop.yourdomain.com`
   - PocketBase: `api.yourdomain.com`
   - Umami: `analytics.yourdomain.com`

### Step 5: Configure Environment Variables

In Coolify, add all variables from `.env.example`:

```env
STORE_NAME=My Store
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com
PUBLIC_POCKETBASE_URL=https://api.yourdomain.com
PUBLIC_SITE_URL=https://shop.yourdomain.com
# ... etc
```

### Step 6: Deploy

Click **Deploy** and Coolify handles the rest!

Coolify provides:
- Automatic SSL certificates
- Zero-downtime deployments
- Easy rollbacks
- Built-in monitoring

---

## VPS Deployment

Manual deployment to any VPS provider using Cloudflare Tunnel.

### Step 1: Provision VPS

Recommended specs:
- **RAM**: 2GB minimum, 4GB recommended
- **CPU**: 2 cores
- **Storage**: 20GB SSD
- **OS**: Ubuntu 22.04 LTS

Providers: DigitalOcean, Hetzner, Linode, Vultr

### Step 2: Initial Server Setup

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install docker-compose-plugin

# Create non-root user (optional but recommended)
adduser deploy
usermod -aG docker deploy
```

### Step 3: Clone Repository

```bash
# As deploy user
su - deploy

git clone https://github.com/yourusername/self-hosted-ecommerce.git
cd self-hosted-ecommerce
```

### Step 4: Set Up Cloudflare Tunnel

On your local machine (with cloudflared installed):

```bash
# Create tunnel
cloudflared tunnel create my-store-vps

# Get token
cloudflared tunnel token my-store-vps

# Configure DNS routes
cloudflared tunnel route dns my-store-vps shop.yourdomain.com
cloudflared tunnel route dns my-store-vps api.yourdomain.com
cloudflared tunnel route dns my-store-vps analytics.yourdomain.com
```

### Step 5: Configure Environment

```bash
cp .env.example .env
nano .env
```

Set production values:

```env
STORE_NAME=My Store
NEXT_PUBLIC_POCKETBASE_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://shop.yourdomain.com
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com
CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token-here
```

### Step 6: Update Cloudflare Tunnel Config

Edit `cloudflared/config.yml` with your domains:

```yaml
ingress:
  - hostname: api.yourdomain.com
    service: http://pocketbase:8090
  - hostname: analytics.yourdomain.com
    service: http://umami:3000
  - hostname: shop.yourdomain.com
    service: http://app:3000
  - service: http_status:404
```

### Step 7: Deploy

```bash
docker compose up -d
```

Cloudflare handles SSL automatically at the edge!

### Step 8: Verify

- Visit `https://shop.yourdomain.com`
- Check `https://api.yourdomain.com/_/` for PocketBase admin

---

## Production Checklist

Before going live, ensure:

### Security

- [ ] PocketBase admin password is strong
- [ ] Google OAuth is configured correctly
- [ ] SMTP credentials are set (for order emails)
- [ ] `SITE_PASSWORD` removed (unless intentional)
- [ ] Admin email is correct in `NEXT_PUBLIC_ADMIN_EMAIL`

### Configuration

- [ ] All URLs use HTTPS
- [ ] Store name and description are set
- [ ] Shipping rates are configured
- [ ] Currency symbol is correct

### Testing

- [ ] Can browse products
- [ ] Can add to cart
- [ ] Can checkout (place test order)
- [ ] Can login with Google
- [ ] Admin dashboard accessible
- [ ] Email notifications working

### Performance

- [ ] Images are optimized
- [ ] Build completed without errors
- [ ] Page loads under 3 seconds

---

## Backup & Recovery

### Automated Backups

Set up daily backups:

```bash
# Add to crontab
crontab -e

# Run backup daily at 2 AM
0 2 * * * /path/to/project/scripts/backup.sh
```

### What Gets Backed Up

- `pb_data/` - PocketBase database and files
- Umami PostgreSQL database

### Manual Backup

```bash
npm run backup
```

Creates timestamped archive in `backups/`.

### Restore from Backup

```bash
# Stop services
npm run docker:down

# Extract backup
tar -xzf backups/backup_20250101.tar.gz -C ./restore

# Copy data
cp -r restore/pb_data/* ./pb_data/

# Restart
npm run docker:dev
```

---

## Monitoring

### Health Check Endpoint

The app includes a health check at `/api/health`:

```bash
curl https://shop.yourdomain.com/api/health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "app": { "status": "up", "latency": 5 },
    "pocketbase": { "status": "up", "latency": 12 }
  }
}
```

### Docker Logs

```bash
# All services
npm run docker:logs

# Specific service
docker logs ecommerce-app -f
docker logs ecommerce-pocketbase -f
```

### Uptime Monitoring

Use free services:
- [UptimeRobot](https://uptimerobot.com) - Monitor `/api/health`
- [Healthchecks.io](https://healthchecks.io) - Cron job monitoring

### Analytics

Access Umami at `https://analytics.yourdomain.com`:
- Default login: admin / umami
- Change password immediately!

---

## Scaling Considerations

For high-traffic stores:

### Database

PocketBase uses SQLite, which handles thousands of concurrent users well. For higher scale:
- Consider migrating to PostgreSQL
- Implement read replicas

### Caching

Redis is included for:
- Session caching
- Rate limiting
- Future: Product caching

### CDN

Put Cloudflare in front for:
- Static asset caching
- DDoS protection
- Global distribution

### Multiple Instances

For horizontal scaling:
1. Use external database (PostgreSQL)
2. Use external Redis
3. Run multiple Next.js instances behind load balancer
