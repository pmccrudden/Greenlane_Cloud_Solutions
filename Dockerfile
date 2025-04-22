# Multi-stage build for optimized production deployment

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files from build stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.cjs ./server.cjs
COPY --from=builder /app/stripeConfig.json ./stripeConfig.json

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Expose port
EXPOSE 8080

# Start the server using node directly with CommonJS bootstrap file
CMD ["node", "server.cjs"]
