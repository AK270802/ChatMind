# Use Node.js 18 as base image
FROM node:18-alpine AS base

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

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/node_modules ./node_modules

# Set permissions
USER nodejs

EXPOSE 5000
ENV PORT 5000

CMD ["node", "dist/index.js"]
