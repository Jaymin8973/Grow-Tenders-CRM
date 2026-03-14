# Deployment Guide

## Server Requirements

- Ubuntu/Debian Linux VPS
- Docker and Docker Compose installed
- Git installed
- Domain names pointing to VPS IP:
  - `api.grow-tender.com` → Backend API
  - `app.grow-tender.com` → Frontend Dashboard
  - `grow-tender.com` / `www.grow-tender.com` → Marketing Website

---

## Initial Deployment

### 1. Clone Repository

```bash
cd /opt
git clone https://github.com/Jaymin8973/Grow-Tenders-CRM.git grow-tender
cd grow-tender
```

### 2. Configure Environment Variables

Create `backend/.env` file:

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Required variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Email SMTP (Gmail example)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Website Base URL (for email links)
WEBSITE_BASE_URL="https://grow-tender.com"

# Frontend URL (for CORS)
FRONTEND_URL="https://app.grow-tender.com"

# Environment
NODE_ENV="production"
```

Create `frontend/.env` file:

```bash
cp frontend/.env.example frontend/.env
nano frontend/.env
```

Required variables:

```env
NEXT_PUBLIC_API_URL="https://api.grow-tender.com/api"
```

Create `website/.env` file:

```bash
cp website/.env.example website/.env
nano website/.env
```

Required variables:

```env
VITE_API_URL="https://api.grow-tender.com/api"
```

### 3. Build and Start Containers

```bash
# Build all containers
docker compose build

# Start all services
docker compose up -d

# Check status
docker compose ps
```

### 4. Run Database Migrations

```bash
# Run Prisma migrations inside backend container
docker compose exec backend npx prisma migrate deploy

# Seed initial data (optional)
docker compose exec backend npx prisma db seed
```

### 5. Verify Deployment

```bash
# Check backend health
curl http://backend:3001/api

# Check via nginx
curl https://api.grow-tender.com/api
```

---

## Redeployment (Update Production)

### Quick Redeploy (No Code Changes)

If only environment variables changed:

```bash
cd /opt/grow-tender
docker compose up -d --force-recreate
```

### Full Redeploy (Code Changes)

```bash
# 1. SSH into VPS
ssh root@<your-vps-ip>

# 2. Navigate to project
   cd /opt/grow-tender

# 3. Pull latest code
git pull origin main

# 4. Rebuild and restart specific service
docker compose build --no-cache backend
docker compose up -d --force-recreate backend

# Or rebuild all services
docker compose build --no-cache
docker compose up -d --force-recreate

# 5. Check logs
docker compose logs -f --tail=50
```

### Redeploy Individual Services

**Backend only:**
```bash
cd /opt/grow-tender
git pull origin main
docker compose build --no-cache backend
docker compose up -d --force-recreate backend
docker compose logs -f backend --tail=50
```

**Frontend only:**
```bash
cd /opt/grow-tender
git pull origin main
docker compose build --no-cache frontend
docker compose up -d --force-recreate frontend
docker compose logs -f frontend --tail=50
```

**Website only:**
```bash
cd /opt/grow-tender
git pull origin main
docker compose build --no-cache website
docker compose up -d --force-recreate website
docker compose logs -f website --tail=50
```

**Nginx only:**
```bash
cd /opt/grow-tender
docker compose restart nginx
docker compose logs -f nginx --tail=50
```

---

## Troubleshooting

### 502 Bad Gateway

**Cause:** Backend not reachable by nginx

**Diagnosis:**
```bash
# Check if backend container is running
docker compose ps backend

# Check backend logs
docker compose logs backend --tail=100

# Check if backend listens on 0.0.0.0
docker compose exec backend netstat -tlnp | grep 3001

# Check nginx can resolve backend hostname
docker compose exec nginx ping backend
```

**Solutions:**
1. Ensure backend binds to `0.0.0.0` in `backend/src/main.ts`:
   ```typescript
   await app.listen(port, '0.0.0.0');
   ```

2. Rebuild backend:
   ```bash
   docker compose build --no-cache backend
   docker compose up -d --force-recreate backend
   ```

3. Restart nginx to reconnxect:
   ```bash
   docker compose restart nginx
   ```

### Container Won't Start

```bash
# Check detailed logs
docker compose logs backend --tail=200

# Check container status
docker compose ps -a

# Check docker network
docker network ls
docker network inspect grow-tender_default
```

### Database Connection Issues

```bash
# Check database connectivity from backend
docker compose exec backend nc -zv <db-host> 5432

# Check DATABASE_URL in env
docker compose exec backend env | grep DATABASE_URL
```

### SMTP/Email Issues

```bash
# Check SMTP config
docker compose exec backend env | grep SMTP

# Test email endpoint
curl -X POST https://api.grow-tender.com/api/scheduler/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### View Logs

```bash
# All services
docker compose logs -f --tail=100

# Specific service
docker compose logs -f backend --tail=100
docker compose logs -f frontend --tail=100
docker compose logs -f nginx --tail=100
```

---

## Useful Commands

```bash
# Stop all containers
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v

# Restart all containers
docker compose restart

# Execute command in container
docker compose exec backend sh
docker compose exec backend npx prisma studio

# Check container resource usage
docker stats

# Prune unused docker resources
docker system prune -a
```

---

## SSL/HTTPS Setup

This setup uses nginx on port 80. For HTTPS, you have two options:

### Option 1: External SSL Termination (Recommended)

Use Cloudflare or external load balancer for SSL termination.

### Option 2: Certbot on VPS

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get certificates
certbot --nginx -d api.grow-tender.com -d app.grow-tender.com -d grow-tender.com -d www.grow-tender.com

# Auto-renewal
certbot renew --dry-run
```

Update `nginx.conf` to listen on 443 and configure SSL.

---

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for JWT tokens | `random-256-bit-string` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `email@gmail.com` |
| `SMTP_PASS` | SMTP password/app password | `abcd efgh ijkl mnop` |
| `WEBSITE_BASE_URL` | Public website URL | `https://grow-tender.com` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://app.grow-tender.com` |
| `NODE_ENV` | Environment mode | `production` |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.grow-tender.com/api` |

### Website (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.grow-tender.com/api` |

---

## Project Structure

```
/opt/grow-tender/
├── backend/           # NestJS API
│   ├── src/
│   ├── prisma/
│   ├── .env
│   └── Dockerfile
├── frontend/          # Next.js Dashboard
│   ├── src/
│   ├── .env
│   └── Dockerfile
├── website/           # Vite Marketing Site
│   ├── src/
│   ├── .env
│   └── Dockerfile
├── nginx/
│   └── nginx.conf     # Reverse proxy config
├── docker-compose.yml
└── DEPLOYMENT.md
```
