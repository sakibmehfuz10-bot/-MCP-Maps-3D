# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install pnpm and serve
RUN npm install -g pnpm serve

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 4173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4173/ || exit 1

# Start server
CMD ["serve", "-s", "dist", "-l", "4173"]
