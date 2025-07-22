# 🐳 Docker Deployment Guide

## Quick Start

### Development Environment
```bash
# 1. Copy environment template
cp .env.docker .env.local

# 2. Edit environment variables (required)
nano .env.local

# 3. Start development environment
docker-compose up --build

# 4. Access application
open http://localhost:33000
```

### Production Environment
```bash
# 1. Build production image
docker-compose -f docker-compose.yml build

# 2. Start production services
docker-compose -f docker-compose.yml --profile proxy up -d

# 3. View logs
docker-compose logs -f doo-wiki
```

## File Structure

```
docker/
├── Dockerfile                 # Production multi-stage build
├── Dockerfile.dev            # Development environment
├── docker-compose.yml        # Main orchestration
├── docker-compose.override.yml # Development overrides
├── .dockerignore             # Build optimization
├── .env.docker               # Environment template
└── config/
    └── redis.conf            # Redis configuration
```

## Environment Configuration

### Required Variables
```bash
# Firebase (get from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# Obsidian Vault Path (host machine)
OBSIDIAN_VAULT_PATH=/path/to/your/obsidian/vault

# GitHub Webhook
GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

### Optional Customization
```bash
# Application
SITE_NAME=YourWikiName
SITE_URL=https://yoursite.com
SITE_AUTHOR=YourName

# Ports
HOST_PORT=33000
REDIS_PORT=6379
```

## Service Architecture

### Core Services
- **doo-wiki**: Main Next.js application (port 33000)
- **redis**: Caching and rate limiting (port 6379)
- **nginx**: Reverse proxy (ports 80/443) [optional]

### Development Services
- **doo-wiki-dev**: Hot reload development server

## Production Deployment

### 1. Security Hardening
```bash
# Use Docker secrets for sensitive data
echo "your-firebase-private-key" | docker secret create firebase_private_key -
echo "your-webhook-secret" | docker secret create github_webhook_secret -
```

### 2. SSL Configuration
```bash
# Generate SSL certificates
mkdir -p config/ssl
# Add your SSL certificates to config/ssl/
```

### 3. Resource Monitoring
```bash
# Monitor resource usage
docker stats

# View application logs
docker-compose logs -f --tail=100 doo-wiki

# Health check status
docker-compose ps
```

## Troubleshooting

### Build Issues
```bash
# Clear build cache
docker system prune -f
docker-compose build --no-cache

# Check build logs
docker-compose build doo-wiki 2>&1 | tee build.log
```

### Runtime Issues
```bash
# Check service health
docker-compose exec doo-wiki curl -f http://localhost:33000/api/health

# Inspect container
docker-compose exec doo-wiki sh

# View full logs
docker-compose logs --details doo-wiki
```

### Performance Optimization
```bash
# Optimize image size
docker images | grep doo-sync-obsidian

# Analyze layer sizes
docker history doo-sync-obsidian:latest

# Monitor resource usage
docker exec -it doo-wiki-app htop
```

## Security Best Practices

### Container Security
- ✅ Non-root user execution (nextjs:1001)
- ✅ Minimal base image (Alpine Linux)
- ✅ Resource limits configured
- ✅ Health checks implemented
- ✅ Secrets management ready

### Network Security
- ✅ Custom bridge network isolation
- ✅ Only required ports exposed
- ✅ Internal service communication

### Data Security
- ✅ Volume mounting for persistent data
- ✅ Read-only configuration files
- ✅ Secure environment variable handling

## Maintenance

### Regular Updates
```bash
# Update base images
docker-compose pull

# Rebuild with latest dependencies
docker-compose build --pull

# Clean unused resources
docker system prune -f
```

### Backup Strategy
```bash
# Backup volumes
docker run --rm -v doo_redis-data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz /data

# Backup configuration
tar czf config-backup.tar.gz config/ .env.local
```

## Performance Metrics

### Expected Performance
- **Build Time**: < 5 minutes
- **Image Size**: < 500MB compressed
- **Startup Time**: < 30 seconds
- **Memory Usage**: < 512MB
- **CPU Usage**: < 50% under normal load

### Monitoring Commands
```bash
# Resource usage
docker stats --no-stream

# Container health
docker inspect --format='{{.State.Health.Status}}' doo-wiki-app

# Application metrics
curl -s http://localhost:33000/api/health | jq
```