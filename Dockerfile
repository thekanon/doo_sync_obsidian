# 1) Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# 2) Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Set build-time environment variables
ENV NODE_ENV=production
ENV NEXT_PUBLIC_FIREBASE_API_KEY=dummy
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dummy
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=dummy
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dummy
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=dummy
ENV NEXT_PUBLIC_FIREBASE_APP_ID=dummy
ENV OBSIDIAN_VAULT_PATH=/tmp/dummy
ENV REPO_PATH=/tmp/dummy
ENV OBSIDIAN_ROOT_DIR=Root
ENV GITHUB_WEBHOOK_SECRET=dummy

# Build the application
RUN npm run build

# 3) Runner (production)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set the correct permissions
USER nextjs

EXPOSE 33001

ENV PORT=33001
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "PORT=33001 node server.js"]