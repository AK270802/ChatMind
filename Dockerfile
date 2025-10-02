# Use Node.js 18 as base image
FROM node:18-alpine AS base

# Install libc6-compat
RUN apk add --no-cache libc6-compat

# =======================
# Install dependencies
# =======================
FROM base AS deps
WORKDIR /app

# Copy root package.json for backend
COPY package.json package-lock.json* ./
RUN npm ci

# Install frontend dependencies
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm ci

# =======================
# Build stage
# =======================
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules

# Copy source code
COPY . .

# Build backend
RUN npm run build

# Build frontend
WORKDIR /app/client
RUN npm run build

# =======================
# Production image
# =======================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Add non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built backend and frontend
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/node_modules ./node_modules

# Set permissions
USER nodejs

EXPOSE 5000
ENV PORT 5000

CMD ["node", "dist/index.js"]
