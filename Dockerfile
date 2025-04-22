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
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/stripeConfig.json ./stripeConfig.json

# Print diagnostic info at startup
RUN echo '#!/bin/sh' > start-debug.sh && \
    echo 'echo "Starting application with the following environment:"' >> start-debug.sh && \
    echo 'echo "NODE_ENV=$NODE_ENV"' >> start-debug.sh && \
    echo 'echo "PORT=$PORT"' >> start-debug.sh && \
    echo 'echo "Running: npm start"' >> start-debug.sh && \
    echo 'npm start' >> start-debug.sh && \
    chmod +x start-debug.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Expose port
EXPOSE 8080

# Start the server using npm start
CMD ["./start-debug.sh"]
