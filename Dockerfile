# Multi-stage build for optimized production deployment

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine AS production

# Set NODE_ENV to production
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy built files from build stage
COPY --from=builder /app/dist ./dist

# Copy configuration files
COPY --from=builder /app/stripeConfig.json ./stripeConfig.json

# Expose port
EXPOSE 8080

# Set Cloud Run compatibility variables
ENV PORT=8080
ENV HOST=0.0.0.0

# Start the server
CMD ["npm", "start"]
