FROM node:22-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy all source code
COPY . .

# Debug: verify files exist
RUN echo "=== Dashboard directory ===" && \
    ls -la src/app/\(dashboard\)/ && \
    echo "=== Taken page ===" && \
    ls -la src/app/\(dashboard\)/taken/ && \
    echo "=== Import page ===" && \
    ls -la src/app/\(dashboard\)/import/ && \
    echo "=== Import API ===" && \
    ls -la src/app/api/import/

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

# Production image
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
