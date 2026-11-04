# ==============================================================================
# PERSONAL DRIVER MARKETPLACE - PRODUCTION & STAGING DOCKERFILE
# Multi-stage container build for unified Frontend + Express API deployment
# "Your Car. Your Journey. Your Driver."
# ==============================================================================

# Stage 1: Build the React/Vite Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install all dependencies (including devDependencies needed for Vite)
RUN npm install --legacy-peer-deps

# Copy frontend source and configuration
COPY index.html vite.config.js ./
COPY src/ ./src/
COPY public/ ./public/
COPY server/ ./server/

# Build production bundle into dist/
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Security: Install wget for healthchecks and dumb-init for PID 1 signal forwarding
RUN apk add --no-cache dumb-init wget

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy package definitions and install production-only dependencies
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy pre-compiled frontend assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend server, migrations, and scripts
COPY server/ ./server/
COPY public/ ./public/
COPY supabase/ ./supabase/
COPY scripts/ ./scripts/

# Create non-root user and set permissions
RUN chown -R node:node /app

# Switch to unprivileged user
USER node

# Expose server port
EXPOSE 5000

# Container Healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-5000}/health || exit 1

# Start server using dumb-init
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server/index.js"]
