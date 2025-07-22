# Multi-stage Docker build for DooSyncBrain Obsidian Wiki
# Production-optimized with security hardening

# ===== STAGE 1: Base Dependencies =====
FROM node:18-alpine AS base

# Install system dependencies required for operations
RUN apk add --no-cache \
    git \
    openssh-client \
    curl \
    && rm -rf /var/cache/apk/*

# Enable pnpm package manager
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# ===== STAGE 2: Dependencies Installation =====
FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with caching
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod=false

# ===== STAGE 3: Build Stage =====
FROM base AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Modify next.config.mjs for standalone output
RUN echo "const nextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = Array.isArray(config.externals)
        ? ['firebase-admin', ...config.externals]
        : ['firebase-admin'];
    }
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\\\/]node_modules[\\\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          firebase: {
            test: /[\\\\/]node_modules[\\\\/](firebase|firebaseui)[\\\\/]/,
            name: 'firebase',
            chunks: 'all',
            priority: 20,
          },
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            priority: 5,
          },
        },
      },
    };
    return config;
  }
};
export default nextConfig;" > next.config.mjs

# Build the application
RUN pnpm build

# ===== STAGE 4: Production Runtime =====
FROM node:18-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache \
    git \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=33000
ENV HOSTNAME="0.0.0.0"

# Create system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application from builder stage
COPY --from=builder /app/public ./public

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create directories for volumes and set permissions
RUN mkdir -p /app/logs /obsidian && \
    chown -R nextjs:nodejs /app /obsidian

# Health check script
RUN echo '#!/bin/sh\ncurl -f http://localhost:33000/api/health || exit 1' > /usr/local/bin/healthcheck.sh && \
    chmod +x /usr/local/bin/healthcheck.sh

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 33000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]