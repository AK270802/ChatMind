# Use Node.js 20 as base image for better ESM compatibility
FROM node:20-alpine AS base

# Install libc6-compat
RUN apk add --no-cache libc6-compat

# =======================
# Install dependencies
# =======================
FROM base AS deps
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# =======================
# Build stage
# =======================
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
# Cache invalidation: 2025-10-02-fix-node-compatibility
COPY . .

# Build the application (both frontend and backend)
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

# Copy built files and package.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/start.sh ./start.sh

# Make startup script executable
RUN chmod +x start.sh

# Set permissions
USER nodejs

EXPOSE 5000
ENV PORT 5000
ENV NODE_ENV=production

# Use startup script
CMD ["./start.sh"]
