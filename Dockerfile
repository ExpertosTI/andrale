# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# We add better-sqlite3 dependencies for compilation if needed
RUN apk add --no-cache python3 make g++ 
RUN npm ci --omit=dev
COPY . .

# Run stage
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Create data and upload directories
RUN mkdir -p data assets/uploads && \
    chown -R appuser:nodejs data assets/uploads

USER appuser
EXPOSE 3000
ENV NODE_ENV=production
ENV WEDDING_PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/themes || exit 1

CMD ["node", "server.js"]
