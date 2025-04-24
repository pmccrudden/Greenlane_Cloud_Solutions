# Multi-stage build for optimized production deployment

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# List files for debugging
RUN echo "Files in builder stage:" && ls -la

# Stage 2: Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# IMPORTANT: Explicitly copy package files individually
COPY package.json ./
COPY package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from build stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/stripeConfig.json ./stripeConfig.json
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server ./server

# Verify critical files exist
RUN echo "Checking package.json:" && ls -la package.json
RUN echo "Checking server.js:" && ls -la server.js
RUN echo "Checking dist directory:" && ls -la dist

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
# Note: PORT is automatically set by Cloud Run

# Expose port
EXPOSE 8080

# Start the server directly with node instead of npm for better reliability
CMD ["node", "server.js"]
